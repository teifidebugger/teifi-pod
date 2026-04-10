"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember } from "@/app/actions"
import { revalidatePath } from "next/cache"
import { PokerSessionStatus, PokerRoundStatus } from "@prisma/client"
import { createClient as createLinearGenqlClient } from "@/lib/linear-genql"
import { decryptToken } from "@/lib/linear"

async function getMember() {
    return getSessionMember()
}

// Get all sessions for the current workspace
export async function getPokerSessions() {
    const { member } = await getMember()

    return prisma.pokerSession.findMany({
        where: { workspaceId: member.workspaceId },
        include: {
            createdBy: {
                select: { id: true, user: { select: { name: true, image: true } } },
            },
            _count: { select: { rounds: true, participants: true } },
        },
        orderBy: { createdAt: "desc" },
    })
}

// Create a new session
export async function createPokerSession(formData: FormData) {
    const { member } = await getMember()

    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) {
        throw new Error("Only OWNER, ADMIN, or MANAGER can create estimation sessions")
    }

    const name = formData.get("name") as string
    const description = (formData.get("description") as string) || null
    const deckType = (formData.get("deckType") as string) || "fibonacci"
    const customDeckRaw = formData.get("customDeck") as string | null
    const customDeck = customDeckRaw
        ? customDeckRaw.split(",").map((v) => v.trim()).filter(Boolean)
        : []
    const projectId = (formData.get("projectId") as string) || null

    if (!name) throw new Error("Session name is required")

    // Validate projectId belongs to this workspace
    if (projectId) {
        const project = await prisma.teifiProject.findFirst({
            where: { id: projectId, workspaceId: member.workspaceId },
            select: { id: true },
        })
        if (!project) throw new Error("Project not found")
    }

    const session = await prisma.pokerSession.create({
        data: {
            workspaceId: member.workspaceId,
            projectId,
            name,
            description,
            deckType,
            customDeck,
            createdById: member.id,
            participants: {
                create: {
                    memberId: member.id,
                    isHost: true,
                },
            },
        },
    })

    revalidatePath("/estimation")
    return session
}

// Get a single session with rounds + participants + votes
export async function getPokerSession(sessionId: string) {
    const { member } = await getMember()

    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        include: {
            project: {
                select: { id: true, name: true, linearTeamId: true, linearProjectId: true },
            },
            createdBy: {
                select: { id: true, user: { select: { name: true, image: true } } },
            },
            participants: {
                include: {
                    member: {
                        select: { id: true, user: { select: { name: true, image: true } } },
                    },
                    votes: true,
                },
                orderBy: { joinedAt: "asc" },
            },
            rounds: {
                include: {
                    votes: {
                        include: {
                            participant: {
                                include: {
                                    member: { select: { id: true, user: { select: { name: true, image: true } } } },
                                },
                            },
                        },
                    },
                },
                orderBy: { position: "asc" },
            },
        },
    })

    if (!session) throw new Error("Session not found")
    return session
}

// Add a round to a session (one issue to estimate)
export async function addPokerRound(formData: FormData) {
    const { member } = await getMember()

    const sessionId = formData.get("sessionId") as string
    const title = formData.get("title") as string
    const linearIssueId = (formData.get("linearIssueId") as string) || null
    const linearIssueTitle = (formData.get("linearIssueTitle") as string) || null
    const linearIssueIdentifier = (formData.get("linearIssueIdentifier") as string) || null

    if (!sessionId || !title) throw new Error("sessionId and title are required")

    // Verify session belongs to workspace
    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: { id: true },
    })
    if (!session) throw new Error("Session not found")

    // Get next position
    const maxPositionResult = await prisma.pokerRound.aggregate({
        where: { sessionId },
        _max: { position: true },
    })
    const nextPosition = (maxPositionResult._max.position ?? -1) + 1

    const round = await prisma.pokerRound.create({
        data: {
            sessionId,
            title,
            linearIssueId,
            linearIssueTitle,
            linearIssueIdentifier,
            position: nextPosition,
        },
    })

    revalidatePath(`/estimation/${sessionId}`)
    return round
}

// Cast a vote on a round
export async function castVote(formData: FormData) {
    const { member } = await getMember()

    const roundId = formData.get("roundId") as string
    const value = formData.get("value") as string

    if (!roundId || !value) throw new Error("roundId and value are required")

    // Verify round exists and belongs to a session in this workspace
    const round = await prisma.pokerRound.findFirst({
        where: { id: roundId, session: { workspaceId: member.workspaceId } },
        select: { id: true, sessionId: true, status: true },
    })
    if (!round) throw new Error("Round not found")
    if (round.status === "COMPLETE") throw new Error("Cannot vote on a completed round")

    // Auto-join as participant if not already in session
    const participant = await prisma.pokerParticipant.upsert({
        where: { sessionId_memberId: { sessionId: round.sessionId, memberId: member.id } },
        create: { sessionId: round.sessionId, memberId: member.id, isHost: false, isObserver: false },
        update: {},
    })

    // Block observers from casting votes
    if (participant.isObserver) throw new Error("Observers cannot cast votes")

    // Upsert vote (one vote per participant per round)
    const vote = await prisma.pokerVote.upsert({
        where: { roundId_participantId: { roundId, participantId: participant.id } },
        create: { roundId, participantId: participant.id, value },
        update: { value },
    })

    revalidatePath(`/estimation/${round.sessionId}`)
    return vote
}

// Reveal votes for a round (host only)
export async function revealRound(roundId: string) {
    const { member } = await getMember()

    const round = await prisma.pokerRound.findFirst({
        where: { id: roundId, session: { workspaceId: member.workspaceId } },
        select: { id: true, sessionId: true },
    })
    if (!round) throw new Error("Round not found")

    // Only session host (creator) can reveal
    const session = await prisma.pokerSession.findUnique({
        where: { id: round.sessionId },
        select: { createdById: true },
    })
    if (!session) throw new Error("Session not found")
    if (session.createdById !== member.id) throw new Error("Only the session host can reveal votes")

    await prisma.pokerRound.update({
        where: { id: roundId },
        data: { status: PokerRoundStatus.REVEALED, revealedAt: new Date() },
    })

    revalidatePath(`/estimation/${round.sessionId}`)
}

// Set final estimate (host only)
export async function setFinalEstimate(roundId: string, estimate: string) {
    const { member } = await getMember()

    const round = await prisma.pokerRound.findFirst({
        where: { id: roundId, session: { workspaceId: member.workspaceId } },
        select: { id: true, sessionId: true, taskId: true },
    })
    if (!round) throw new Error("Round not found")

    const session = await prisma.pokerSession.findUnique({
        where: { id: round.sessionId },
        select: { createdById: true },
    })
    if (!session) throw new Error("Session not found")
    if (session.createdById !== member.id) throw new Error("Only the session host can set the final estimate")

    await prisma.pokerRound.update({
        where: { id: roundId },
        data: { finalEstimate: estimate, status: PokerRoundStatus.COMPLETE },
    })

    // Sync story points to the linked TeifiTask if numeric
    if (round.taskId) {
        const numeric = parseInt(estimate, 10)
        if (!isNaN(numeric)) {
            await prisma.teifiTask.update({
                where: { id: round.taskId },
                data: { storyPoints: numeric },
            })
        }
    }

    revalidatePath(`/estimation/${round.sessionId}`)
}

// Batch sync all round final estimates to linked TeifiTask.storyPoints
export async function batchSyncSessionEstimates(sessionId: string) {
    const { member } = await getMember()

    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: {
            id: true,
            createdById: true,
            rounds: { select: { id: true, taskId: true, finalEstimate: true } },
        },
    })
    if (!session) throw new Error("Session not found")
    if (session.createdById !== member.id) throw new Error("Only the session host can sync estimates")

    const updates = session.rounds.filter(
        (r) => r.taskId && r.finalEstimate !== null && !isNaN(parseInt(r.finalEstimate, 10))
    )

    await Promise.all(
        updates.map((r) =>
            prisma.teifiTask.update({
                where: { id: r.taskId! },
                data: { storyPoints: parseInt(r.finalEstimate!, 10) },
            })
        )
    )

    return { synced: updates.length }
}

// Start/advance session status
export async function updateSessionStatus(sessionId: string, status: "ACTIVE" | "COMPLETED") {
    const { member } = await getMember()

    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: { id: true, createdById: true },
    })
    if (!session) throw new Error("Session not found")
    if (session.createdById !== member.id) throw new Error("Only the session host can change session status")

    const data: { status: PokerSessionStatus; completedAt?: Date } = {
        status: status as PokerSessionStatus,
    }
    if (status === "COMPLETED") {
        data.completedAt = new Date()
    }

    await prisma.pokerSession.update({
        where: { id: sessionId },
        data,
    })

    revalidatePath("/estimation")
    revalidatePath(`/estimation/${sessionId}`)
}

// Delete a session (creator only)
export async function deletePokerSession(sessionId: string) {
    const { member } = await getMember()

    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: { id: true, createdById: true },
    })
    if (!session) throw new Error("Session not found")
    if (session.createdById !== member.id) throw new Error("Only the session creator can delete a session")

    await prisma.pokerSession.delete({ where: { id: sessionId } })

    revalidatePath("/estimation")
}

// Heartbeat — keeps participant presence alive
export async function heartbeat(sessionId: string) {
    const { member } = await getMember()
    await prisma.pokerParticipant.updateMany({
        where: { sessionId, memberId: member.id },
        data: { lastSeenAt: new Date() },
    })
}

// Join a session as participant
export async function joinPokerSession(sessionId: string, isObserver?: boolean) {
    const { member } = await getMember()

    // Verify session belongs to workspace
    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: { id: true },
    })
    if (!session) throw new Error("Session not found")

    await prisma.pokerParticipant.upsert({
        where: { sessionId_memberId: { sessionId, memberId: member.id } },
        create: { sessionId, memberId: member.id, isHost: false, isObserver: isObserver ?? false },
        update: {},
    })

    revalidatePath(`/estimation/${sessionId}`)
}

// ── Import project tasks ──────────────────────────────────────────────────────

export async function importProjectTasks(sessionId: string) {
    const { member } = await getMember()

    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: { id: true, createdById: true, projectId: true, rounds: { select: { taskId: true } } },
    })
    if (!session) throw new Error("Session not found")
    if (session.createdById !== member.id) throw new Error("Only the session host can import tasks")
    if (!session.projectId) throw new Error("Session is not linked to a project")

    const tasks = await prisma.teifiTask.findMany({
        where: { projectId: session.projectId, completed: false },
        orderBy: { createdAt: "asc" },
    })

    // Skip tasks already in session as rounds
    const existingTaskIds = new Set(session.rounds.map((r) => r.taskId).filter(Boolean))
    const newTasks = tasks.filter((t) => !existingTaskIds.has(t.id))
    if (newTasks.length === 0) return { imported: 0 }

    const maxPositionResult = await prisma.pokerRound.aggregate({
        where: { sessionId },
        _max: { position: true },
    })
    let nextPosition = (maxPositionResult._max.position ?? -1) + 1

    await prisma.pokerRound.createMany({
        data: newTasks.map((task) => ({
            sessionId,
            taskId: task.id,
            title: task.name,
            position: nextPosition++,
        })),
    })

    revalidatePath(`/estimation/${sessionId}`)
    return { imported: newTasks.length }
}

// ── Fetch Linear issues for picker (no side effects) ─────────────────────────

export async function fetchLinearIssuesForSession(sessionId: string) {
    const { member } = await getMember()

    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: { id: true, projectId: true, rounds: { select: { linearIssueId: true } } },
    })
    if (!session) throw new Error("Session not found")
    if (!session.projectId) throw new Error("Session is not linked to a project")

    const project = await prisma.teifiProject.findUnique({
        where: { id: session.projectId },
        select: { linearTeamId: true, linearProjectId: true },
    })
    if (!project?.linearTeamId) throw new Error("Project is not linked to a Linear team")

    const tokenRecord = await prisma.linearUserToken.findFirst({
        where: { userId: member.userId },
    })
    if (!tokenRecord) throw new Error("Connect your Linear account first (Settings → Integrations)")

    let accessToken: string
    try {
        accessToken = decryptToken(tokenRecord.accessToken)
    } catch {
        await prisma.linearUserToken.deleteMany({ where: { userId: member.userId } })
        throw new Error("Linear token expired — please reconnect (Settings → Integrations)")
    }

    const client = createLinearGenqlClient({
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    const data = await client.query({
        issues: {
            __args: {
                filter: {
                    team: { id: { eq: project.linearTeamId } },
                    state: { type: { nin: ["completed", "canceled"] } },
                    ...(project.linearProjectId
                        ? { project: { id: { eq: project.linearProjectId } } }
                        : {}),
                },
                first: 100,
                orderBy: "updatedAt" as const,
            },
            nodes: {
                id: true,
                identifier: true,
                title: true,
                description: true,
                state: { name: true },
            },
        },
    })

    const existingLinearIds = new Set(session.rounds.map((r) => r.linearIssueId).filter(Boolean))

    return (data.issues?.nodes ?? [])
        .filter((i) => i.id)
        .map((issue) => ({
            id: issue.id ?? "",
            identifier: issue.identifier ?? "",
            title: issue.title ?? "",
            description: issue.description ?? null,
            stateName: issue.state?.name ?? "",
            alreadyAdded: existingLinearIds.has(issue.id ?? ""),
        }))
}

// ── Add selected Linear issues ────────────────────────────────────────────────

export async function addLinearIssuesToSession(
    sessionId: string,
    issues: { id: string; title: string; identifier: string; description?: string | null }[]
) {
    const { member } = await getMember()

    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: { id: true, createdById: true, rounds: { select: { linearIssueId: true } } },
    })
    if (!session) throw new Error("Session not found")
    if (session.createdById !== member.id) throw new Error("Only the session host can add issues")

    const existingLinearIds = new Set(session.rounds.map((r) => r.linearIssueId).filter(Boolean))
    const newIssues = issues.filter((i) => !existingLinearIds.has(i.id))
    if (newIssues.length === 0) return { added: 0 }

    const maxPositionResult = await prisma.pokerRound.aggregate({
        where: { sessionId },
        _max: { position: true },
    })
    let nextPosition = (maxPositionResult._max.position ?? -1) + 1

    await prisma.pokerRound.createMany({
        data: newIssues.map((issue) => ({
            sessionId,
            linearIssueId: issue.id,
            linearIssueTitle: issue.title,
            linearIssueIdentifier: issue.identifier,
            title: issue.title || issue.identifier || "Unknown",
            description: issue.description ?? null,
            position: nextPosition++,
        })),
    })

    revalidatePath(`/estimation/${sessionId}`)
    return { added: newIssues.length }
}

// ── Session CRUD ──────────────────────────────────────────────────────────────

export async function updatePokerSession(
    sessionId: string,
    data: { name?: string; description?: string; deckType?: string }
) {
    const { member } = await getMember()

    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: { id: true, createdById: true },
    })
    if (!session) throw new Error("Session not found")
    if (session.createdById !== member.id) throw new Error("Only the session host can edit the session")

    await prisma.pokerSession.update({
        where: { id: sessionId },
        data: {
            ...(data.name ? { name: data.name } : {}),
            ...(data.description !== undefined ? { description: data.description || null } : {}),
            ...(data.deckType ? { deckType: data.deckType } : {}),
        },
    })

    revalidatePath(`/estimation/${sessionId}`)
    revalidatePath("/estimation")
}

// ── Round CRUD ────────────────────────────────────────────────────────────────

export async function deletePokerRound(roundId: string) {
    const { member } = await getMember()

    const round = await prisma.pokerRound.findFirst({
        where: { id: roundId, session: { workspaceId: member.workspaceId } },
        select: { id: true, sessionId: true, session: { select: { createdById: true } } },
    })
    if (!round) throw new Error("Round not found")
    if (round.session.createdById !== member.id) throw new Error("Only the session host can delete rounds")

    await prisma.pokerRound.delete({ where: { id: roundId } })

    revalidatePath(`/estimation/${round.sessionId}`)
}

export async function updatePokerRound(roundId: string, data: { title: string }) {
    const { member } = await getMember()

    const round = await prisma.pokerRound.findFirst({
        where: { id: roundId, session: { workspaceId: member.workspaceId } },
        select: { id: true, sessionId: true, session: { select: { createdById: true } } },
    })
    if (!round) throw new Error("Round not found")
    if (round.session.createdById !== member.id) throw new Error("Only the session host can edit rounds")

    await prisma.pokerRound.update({
        where: { id: roundId },
        data: { title: data.title },
    })

    revalidatePath(`/estimation/${round.sessionId}`)
}

// Reset a round back to VOTING (re-estimate — host only)
export async function resetRound(roundId: string) {
    const { member } = await getMember()

    const round = await prisma.pokerRound.findFirst({
        where: { id: roundId, session: { workspaceId: member.workspaceId } },
        select: { id: true, sessionId: true, session: { select: { createdById: true } } },
    })
    if (!round) throw new Error("Round not found")
    if (round.session.createdById !== member.id) throw new Error("Only the session host can reset rounds")

    await prisma.pokerVote.deleteMany({ where: { roundId } })
    await prisma.pokerRound.update({
        where: { id: roundId },
        data: { status: PokerRoundStatus.VOTING, finalEstimate: null, revealedAt: null },
    })

    revalidatePath(`/estimation/${round.sessionId}`)
}

// ── Fetch Linear issue detail (description + comments) ───────────────────────

export async function fetchLinearIssueDetail(linearIssueId: string, sessionId: string) {
    const { member } = await getMember()

    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: { id: true },
    })
    if (!session) throw new Error("Session not found")

    const tokenRecord = await prisma.linearUserToken.findFirst({
        where: { userId: member.userId },
    })
    if (!tokenRecord) throw new Error("Connect your Linear account first (Settings → Integrations)")

    let accessToken: string
    try {
        accessToken = decryptToken(tokenRecord.accessToken)
    } catch {
        await prisma.linearUserToken.deleteMany({ where: { userId: member.userId } })
        throw new Error("Linear token expired — please reconnect (Settings → Integrations)")
    }

    const client = createLinearGenqlClient({
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    const data = await client.query({
        issue: {
            __args: { id: linearIssueId },
            description: true,
            comments: {
                __args: { orderBy: "createdAt" as const, first: 50 },
                nodes: {
                    id: true,
                    body: true,
                    createdAt: true,
                    user: { name: true },
                },
            },
        },
    })

    const issue = data.issue
    if (!issue) throw new Error("Issue not found")

    return {
        description: issue.description ?? null,
        comments: (issue.comments?.nodes ?? []).map((c) => ({
            id: c.id ?? "",
            body: c.body ?? "",
            createdAt: c.createdAt ?? "",
            userName: c.user?.name ?? "Unknown",
        })),
    }
}

export async function reorderRounds(sessionId: string, orderedIds: string[]) {
    const { member } = await getMember()

    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: { id: true, createdById: true },
    })
    if (!session) throw new Error("Session not found")
    if (session.createdById !== member.id) throw new Error("Only the session host can reorder rounds")

    await prisma.$transaction(
        orderedIds.map((id, index) =>
            prisma.pokerRound.update({ where: { id }, data: { position: index } })
        )
    )

    revalidatePath(`/estimation/${sessionId}`)
}

// ── Invite members ─────────────────────────────────────────────────────────

export async function getWorkspaceMembersForInvite(sessionId: string) {
    const { member } = await getMember()

    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: { id: true },
    })
    if (!session) throw new Error("Session not found")

    const [allMembers, participants] = await Promise.all([
        prisma.workspaceMember.findMany({
            where: { workspaceId: member.workspaceId },
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
        }),
        prisma.pokerParticipant.findMany({
            where: { sessionId },
            select: { memberId: true },
        }),
    ])

    const participantMemberIds = new Set(participants.map((p) => p.memberId))

    return allMembers.map((m) => ({
        id: m.id,
        userId: m.userId,
        userName: m.user.name,
        userEmail: m.user.email,
        userImage: m.user.image,
        isParticipant: participantMemberIds.has(m.id),
    }))
}

export async function inviteMemberToSession(sessionId: string, invitedMemberId: string) {
    const { member } = await getMember()

    const session = await prisma.pokerSession.findFirst({
        where: { id: sessionId, workspaceId: member.workspaceId },
        select: { id: true },
    })
    if (!session) throw new Error("Session not found")

    // Verify the invited member belongs to the same workspace
    const invitedMember = await prisma.workspaceMember.findFirst({
        where: { id: invitedMemberId, workspaceId: member.workspaceId },
        select: { id: true },
    })
    if (!invitedMember) throw new Error("Member not found")

    await prisma.pokerParticipant.upsert({
        where: { sessionId_memberId: { sessionId, memberId: invitedMemberId } },
        update: {},
        create: { sessionId, memberId: invitedMemberId, isHost: false },
    })

    revalidatePath(`/estimation/${sessionId}`)
}

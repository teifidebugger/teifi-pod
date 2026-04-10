"use server"

import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/app/actions"
import {
    createLinearTeam,
    createLinearProject,
    addMembersToLinearTeam,
    getSUPTeams,
} from "@/lib/linear-onboarding"
import { sendWorkspaceEmail } from "@/lib/email"

// ─── Types ────────────────────────────────────────────────────────────────────

type StepId =
    | "create_client"
    | "find_linear_team"
    | "create_linear_team"
    | "add_members_linear"
    | "create_linear_project"
    | "create_teifi_project"
    | "setup_portal"
    | "invite_portal_user"
    | "notify_team"

type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped"

type Step = {
    id: StepId
    status: StepStatus
    result: unknown
    error?: string
}

export type OnboardingInput = {
    template: "support" | "standard"
    clientName: string
    clientEmail?: string
    projectName: string
    linearProjectName?: string  // name for the Linear project (falls back to projectName)
    billingType?: string
    budgetHours?: number
    portalUserEmail?: string
    /** support template: existing Linear team ID to use (if known) */
    linearTeamId?: string
    /** standard template: name for the new Linear team */
    linearTeamName?: string
    /** standard template: key for the new Linear team (e.g. "ACME") */
    linearTeamKey?: string
    /** WorkspaceMember IDs — all selected members (with or without Linear) */
    memberIds?: string[]
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function requireOwnerOrAdmin() {
    const user = await getSessionUser()
    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        select: { id: true, workspaceId: true, role: true },
    })
    if (!member) throw new Error("No workspace membership")
    if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Owner or Admin access required")
    return member
}

// ─── Step helpers ─────────────────────────────────────────────────────────────

function buildSteps(template: "support" | "standard"): Step[] {
    const ids: StepId[] =
        template === "support"
            ? [
                  "create_client",
                  "find_linear_team",
                  "create_linear_project",
                  "create_teifi_project",
                  "setup_portal",
                  "invite_portal_user",
                  "notify_team",
              ]
            : [
                  "create_client",
                  "create_linear_team",
                  "add_members_linear",
                  "create_linear_project",
                  "create_teifi_project",
                  "setup_portal",
                  "invite_portal_user",
                  "notify_team",
              ]

    return ids.map(id => ({ id, status: "pending", result: null }))
}

async function updateStep(jobId: string, stepId: StepId, patch: Partial<Step>, allSteps: Step[]): Promise<Step[]> {
    const next = allSteps.map(s => (s.id === stepId ? { ...s, ...patch } : s))
    await prisma.onboardingJob.update({
        where: { id: jobId },
        data: { steps: next as object[] },
    })
    return next
}

async function setJobStatus(
    jobId: string,
    status: string,
    result?: object,
) {
    await prisma.onboardingJob.update({
        where: { id: jobId },
        data: { status, ...(result ? { result } : {}) },
    })
}

// ─── Async step runner ────────────────────────────────────────────────────────

async function runOnboardingJob(
    jobId: string,
    workspaceId: string,
    input: OnboardingInput,
    initialSteps: Step[],
) {
    let steps = initialSteps
    await setJobStatus(jobId, "running")

    // Accumulated context passed between steps
    const ctx: {
        clientId?: string
        linearTeamId?: string
        linearProjectId?: string
    } = {}

    const fail = async (stepId: StepId, err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        steps = await updateStep(jobId, stepId, { status: "failed", error: message }, steps)
        await setJobStatus(jobId, "failed", { error: `Step ${stepId} failed: ${message}` })
    }

    for (const step of steps) {
        steps = await updateStep(jobId, step.id, { status: "running" }, steps)

        try {
            switch (step.id) {
                case "create_client": {
                    const client = await prisma.client.create({
                        data: { name: input.clientName, workspaceId },
                    })
                    ctx.clientId = client.id
                    steps = await updateStep(jobId, step.id, { status: "completed", result: { clientId: client.id } }, steps)
                    break
                }

                case "find_linear_team": {
                    // Use provided teamId or pick the first available SUP* team
                    let teamId = input.linearTeamId
                    if (!teamId) {
                        const supTeams = await getSUPTeams()
                        if (supTeams.length === 0) throw new Error("No SUP* Linear teams found")
                        teamId = supTeams[0].id
                    }
                    ctx.linearTeamId = teamId
                    steps = await updateStep(jobId, step.id, { status: "completed", result: { linearTeamId: teamId } }, steps)
                    break
                }

                case "create_linear_team": {
                    const name = input.linearTeamName
                    const key = input.linearTeamKey
                    if (!name || !key) throw new Error("linearTeamName and linearTeamKey are required for standard template")
                    const team = await createLinearTeam(name, key)
                    ctx.linearTeamId = team.id
                    // Cache in DB so it shows up in team selectors
                    await prisma.linearTeam.upsert({
                        where: { id: team.id },
                        create: { id: team.id, name, key: team.key, workspaceId },
                        update: { name, key: team.key },
                    })
                    steps = await updateStep(jobId, step.id, { status: "completed", result: { linearTeamId: team.id, key: team.key } }, steps)
                    break
                }

                case "add_members_linear": {
                    if (!ctx.linearTeamId) throw new Error("linearTeamId not available")
                    // Resolve WorkspaceMember IDs → Linear user IDs
                    const workspaceMemberIds = input.memberIds ?? []
                    let linearUserIds: string[] = []
                    if (workspaceMemberIds.length > 0) {
                        const wms = await prisma.workspaceMember.findMany({
                            where: { id: { in: workspaceMemberIds } },
                            select: { userId: true },
                        })
                        const userIds = wms.map((wm) => wm.userId)
                        const tokens = await prisma.linearUserToken.findMany({
                            where: { userId: { in: userIds } },
                            select: { linearUserId: true },
                        })
                        linearUserIds = tokens.map((t) => t.linearUserId)
                    }
                    if (linearUserIds.length > 0) {
                        await addMembersToLinearTeam(ctx.linearTeamId, linearUserIds)
                    }
                    steps = await updateStep(jobId, step.id, { status: "completed", result: { added: linearUserIds.length } }, steps)
                    break
                }

                case "create_linear_project": {
                    if (!ctx.linearTeamId) throw new Error("linearTeamId not available")
                    const linearProjectName = input.linearProjectName || input.projectName
                    const project = await createLinearProject(ctx.linearTeamId, linearProjectName)
                    ctx.linearProjectId = project.id
                    steps = await updateStep(jobId, step.id, { status: "completed", result: { linearProjectId: project.id } }, steps)
                    break
                }

                case "create_teifi_project": {
                    if (!ctx.clientId) throw new Error("clientId not available")
                    // Map wizard billingType → DB enum (wizard uses TIME_AND_MATERIALS, DB uses HOURLY)
                    const billingTypeMap: Record<string, "HOURLY" | "FIXED_FEE" | "NON_BILLABLE"> = {
                        TIME_AND_MATERIALS: "HOURLY",
                        FIXED_FEE: "FIXED_FEE",
                        NON_BILLABLE: "NON_BILLABLE",
                    }
                    const billingType = billingTypeMap[input.billingType ?? "TIME_AND_MATERIALS"] ?? "HOURLY"
                    const project = await prisma.teifiProject.create({
                        data: {
                            name: input.projectName,
                            clientId: ctx.clientId,
                            workspaceId,
                            billingType,
                            billBy: billingType === "NON_BILLABLE" ? "none" : "People",
                            budgetHours: input.budgetHours ?? null,
                            status: "ACTIVE",
                            ...(ctx.linearTeamId ? { linearTeamId: ctx.linearTeamId } : {}),
                            ...(ctx.linearProjectId ? { linearProjectId: ctx.linearProjectId, linearProjectName: input.linearProjectName || input.projectName } : {}),
                        },
                    })
                    // Assign selected members to the project
                    const memberIds = input.memberIds ?? []
                    if (memberIds.length > 0) {
                        await prisma.projectMember.createMany({
                            data: memberIds.map((memberId) => ({
                                projectId: project.id,
                                memberId,
                            })),
                            skipDuplicates: true,
                        })
                    }
                    steps = await updateStep(jobId, step.id, { status: "completed", result: { projectId: project.id } }, steps)
                    break
                }

                case "setup_portal": {
                    if (!ctx.clientId) throw new Error("clientId not available")
                    if (ctx.linearTeamId) {
                        // Ensure the LinearTeam record exists in DB before linking
                        const existingTeam = await prisma.linearTeam.findUnique({ where: { id: ctx.linearTeamId } })
                        if (!existingTeam) {
                            // Upsert with minimal data — name will be corrected on next sync
                            await prisma.linearTeam.upsert({
                                where: { id: ctx.linearTeamId },
                                create: { id: ctx.linearTeamId, name: input.linearTeamName ?? "Unknown", key: "", workspaceId },
                                update: {},
                            })
                        }
                        await prisma.client.update({
                            where: { id: ctx.clientId },
                            data: { linearTeams: { connect: { id: ctx.linearTeamId } } },
                        })
                    }
                    steps = await updateStep(jobId, step.id, { status: "completed", result: { linked: !!ctx.linearTeamId } }, steps)
                    break
                }

                case "invite_portal_user": {
                    if (!ctx.clientId) throw new Error("clientId not available")
                    const email = input.portalUserEmail
                    if (!email) {
                        steps = await updateStep(jobId, step.id, { status: "skipped", result: { reason: "no portalUserEmail provided" } }, steps)
                        break
                    }

                    const expiresAt = new Date()
                    expiresAt.setDate(expiresAt.getDate() + 7)

                    const invite = await prisma.portalInvite.create({
                        data: {
                            email: email.toLowerCase().trim(),
                            clientId: ctx.clientId,
                            createdById: "system",
                            expiresAt,
                        },
                    })

                    const workspace = await prisma.workspace.findUnique({
                        where: { id: workspaceId },
                        select: { name: true },
                    })
                    const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"

                    sendWorkspaceEmail(workspaceId, {
                        type: "portal-invite",
                        recipientEmail: email.toLowerCase().trim(),
                        clientName: input.clientName,
                        workspaceName: workspace?.name ?? "Teifi",
                        inviteUrl: `${appUrl}/invite/portal/${invite.token}`,
                    }).catch(err => console.error("[onboarding] portal-invite email failed:", err))

                    steps = await updateStep(jobId, step.id, { status: "completed", result: { inviteToken: invite.token } }, steps)
                    break
                }

                case "notify_team": {
                    // No-op notification step — extend later with Slack/email
                    console.log(`[onboarding] Job ${jobId} completed onboarding for client "${input.clientName}"`)
                    steps = await updateStep(jobId, step.id, { status: "completed", result: { notified: true } }, steps)
                    break
                }

                default:
                    steps = await updateStep(jobId, step.id as StepId, { status: "skipped", result: null }, steps)
            }
        } catch (err) {
            await fail(step.id, err)
            return // Halt on first failure
        }
    }

    await setJobStatus(jobId, "completed", {
        clientId: ctx.clientId,
        linearTeamId: ctx.linearTeamId,
        linearProjectId: ctx.linearProjectId,
    })
}

// ─── Exported server actions ──────────────────────────────────────────────────

export async function checkLinearAuth(): Promise<{ valid: boolean; error?: string }> {
    await requireOwnerOrAdmin()
    try {
        const { validateLinearServiceAccount } = await import("@/lib/linear-onboarding")
        const valid = await validateLinearServiceAccount()
        return { valid }
    } catch (err) {
        return { valid: false, error: err instanceof Error ? err.message : String(err) }
    }
}

export async function startOnboardingJob(input: OnboardingInput): Promise<{ jobId: string }> {
    const member = await requireOwnerOrAdmin()

    const initialSteps = buildSteps(input.template)

    const job = await prisma.onboardingJob.create({
        data: {
            workspaceId: member.workspaceId,
            template: input.template,
            status: "pending",
            steps: initialSteps as object[],
            createdBy: member.id,
        },
    })

    // Schedule background job after response is sent (safe on Vercel serverless)
    after(() => runOnboardingJob(job.id, member.workspaceId, input, initialSteps))

    return { jobId: job.id }
}

export async function getOnboardingJob(jobId: string) {
    const user = await getSessionUser()

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        select: { workspaceId: true },
    })
    if (!member) return null

    const job = await prisma.onboardingJob.findFirst({
        where: { id: jobId, workspaceId: member.workspaceId },
    })
    if (!job) return null

    return {
        id: job.id,
        template: job.template,
        status: job.status,
        steps: job.steps as Step[],
        result: job.result as Record<string, unknown> | null,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
    }
}

"use server"

import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPortalLinearClient, getPortalLinearGenqlClient } from "@/lib/linear-portal"
import { findStateForUATColumn, type UATColumn } from "@/lib/uat-mapping"
import { revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { getPortalUser } from "./auth"
import { assertTeamAccess, resolveActorRole, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "./constants"
import { logPortalEvent } from "./logging"
import { type PortalComment } from "./types"
import { getTeamAllowedTransitions, getTeamStaffTransitions, getTeamActionStates } from "./transitions"
import { loadUATMappingContext, resolveColumnFromState } from "./resolution"

export async function createPortalIssue(data: {
    teamId: string
    title: string
    description?: string
    priority?: number
    stateId?: string
    labelIds?: string[]
    parentId?: string
    targetColumn?: string
}) {
    const title = data.title.trim()
    if (!title) throw new Error("Title is required")
    if (title.length > 255) throw new Error("Title must be 255 characters or fewer")
    const description = data.description ? data.description.trim().slice(0, 10_000) : undefined

    const { user, profile, isStaff, workspaceId } = await getPortalUser({ teamId: data.teamId })

    assertTeamAccess(profile, data.teamId)

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
    const recentCount = await prisma.portalIssueLog.count({
        where: { clientId: profile.clientId, createdAt: { gte: windowStart } },
    })
    if (recentCount >= RATE_LIMIT_MAX) {
        throw new Error(`Rate limit exceeded: max ${RATE_LIMIT_MAX} issues per hour. Please try again later.`)
    }
    await prisma.portalIssueLog.create({
        data: { clientId: profile.clientId, userId: user.id },
    })

    const submitterSig = isStaff ? "" : (() => {
        const emailPart = user.email ? ` \`${user.email}\`` : ""
        const name = user.name ?? user.email ?? "Unknown"
        return `\n\n---\n*Portal submission — Client: **${profile.client.name}** | Submitted by: **${name}**${emailPart}*`
    })()
    const finalDescription = (description ?? "") + submitterSig

    const teamSettings = await prisma.clientTeamSettings.findUnique({
        where: { clientId_linearTeamId: { clientId: profile.clientId, linearTeamId: data.teamId } },
    })
    const uatLabels = [...(teamSettings?.uatLabelIds ?? []), ...(profile.client.uatLabelIds ?? [])]
        .filter((id, i, arr) => arr.indexOf(id) === i)
    const uatProjectIds = [...(teamSettings?.uatProjectIds ?? []), ...(profile.client.uatProjectIds ?? [])]
        .filter((id, i, arr) => arr.indexOf(id) === i)
    const uatProject = uatProjectIds.length === 1 ? uatProjectIds[0] : null

    const labelIds = [...(data.labelIds ?? [])]
    for (const id of uatLabels) {
        if (!labelIds.includes(id)) labelIds.push(id)
    }
    const projectId = uatProject ?? undefined

    let resolvedStateId = data.stateId
    if (!resolvedStateId) {
        const genql = await getPortalLinearGenqlClient(isStaff ? user.id : undefined).catch((e: unknown) => { if (isRedirectError(e)) throw e; return null })
        if (genql) {
            try {
                const statesData = await genql.query({
                    workflowStates: {
                        __args: { filter: { team: { id: { eq: data.teamId } } } },
                        nodes: { id: true, name: true, type: true, position: true },
                    },
                })
                const states = (statesData.workflowStates?.nodes ?? [])
                    .filter(s => !!s.id)
                    .map(s => ({ id: s.id!, name: s.name ?? "", type: s.type ?? "", position: s.position ?? 0 }))
                if (data.targetColumn === "backlog") {
                    const backlogStateId = states.find(s => s.type === "backlog")?.id
                        ?? findStateForUATColumn(states, "backlog")
                    if (backlogStateId) resolvedStateId = backlogStateId
                } else {
                    const submittedStateId =
                        states.find(s => s.type === "triage")?.id
                        ?? findStateForUATColumn(states, "submitted")
                    if (submittedStateId) resolvedStateId = submittedStateId
                }
            } catch {
                // Ignore — let Linear assign the default state
            }
        }
    }

    const linearClient = await getPortalLinearClient(isStaff ? user.id : undefined)
    const result = await linearClient.createIssue({
        teamId: data.teamId,
        title,
        description: finalDescription,
        priority: data.priority,
        stateId: resolvedStateId,
        labelIds: labelIds.length > 0 ? labelIds : undefined,
        projectId,
        parentId: data.parentId,
    })

    const issue = await result.issue
    if (!issue) throw new Error("Failed to create issue in Linear")

    after(() => logPortalEvent({
        workspaceId,
        clientId: profile.clientId,
        teamId: data.teamId,
        userId: user.id,
        issueId: issue.id,
        issueTitle: issue.title,
        issueIdentifier: issue.identifier,
        eventType: 'issue_created',
        actorRole: resolveActorRole(isStaff),
        toColumn: 'submitted',
    }))

    revalidatePath("/uat")
    return { id: issue.id, identifier: issue.identifier, url: issue.url }
}


export async function updatePortalIssueStatus(issueId: string, stateId: string) {
    const { profile, user, isStaff, workspaceId } = await getPortalUser()

    const genql = await getPortalLinearGenqlClient(isStaff ? user.id : undefined)
    const data = await genql.query({
        issue: {
            __args: { id: issueId },
            id: true,
            state: { id: true, name: true, type: true },
            team: {
                id: true,
                states: {
                    __args: {},
                    nodes: { id: true, name: true, type: true },
                },
            },
        },
    })

    const teamId = data.issue?.team?.id
    assertTeamAccess(profile, teamId, "Access denied: issue not in your client's teams")
    if (!teamId) throw new Error("Issue has no team")

    const ctx = await loadUATMappingContext(workspaceId, teamId)

    const currentColumn = resolveColumnFromState(data.issue?.state, ctx)
    const targetState = (data.issue?.team?.states?.nodes ?? []).find(s => s.id === stateId)
    if (!targetState) throw new Error("Invalid target state")
    const targetColumn = resolveColumnFromState(targetState, ctx)
    const transitions = isStaff
        ? await getTeamStaffTransitions(workspaceId, teamId)
        : await getTeamAllowedTransitions(workspaceId, teamId)
    const allowed = currentColumn ? (transitions[currentColumn] ?? []) : []
    if (!targetColumn || !allowed.includes(targetColumn)) {
        throw new Error(`Cannot transition from "${currentColumn ?? "unknown"}" to "${targetColumn ?? "unknown"}"`)
    }

    const linearClient = await getPortalLinearClient(isStaff ? user.id : undefined)
    await linearClient.updateIssue(issueId, { stateId })

    after(() => logPortalEvent({
        workspaceId,
        clientId: profile.clientId,
        teamId: teamId ?? undefined,
        userId: user.id,
        issueId,
        eventType: 'issue_status_changed',
        actorRole: resolveActorRole(isStaff),
        fromColumn: currentColumn,
        toColumn: targetColumn,
    }))

    revalidatePath("/uat")
}

export async function movePortalIssueToUATColumn(issueId: string, target: UATColumn, comment?: string) {
    const { profile, user, isStaff, workspaceId } = await getPortalUser()

    const genql = await getPortalLinearGenqlClient(isStaff ? user.id : undefined)

    const data = await genql.query({
        issue: {
            __args: { id: issueId },
            id: true,
            state: { id: true, name: true, type: true },
            team: {
                id: true,
                states: {
                    __args: {},
                    nodes: { id: true, name: true, type: true },
                },
            },
        },
    })

    const teamId = data.issue?.team?.id
    assertTeamAccess(profile, teamId, "Access denied: issue not in your client's teams")
    if (!teamId) throw new Error("Issue has no team")

    const states = (data.issue?.team?.states?.nodes ?? []).filter(s => s.id) as Array<{ id: string; name: string; type: string }>

    const [ctx, transitions, actionStates] = await Promise.all([
        loadUATMappingContext(workspaceId, teamId),
        isStaff ? getTeamStaffTransitions(workspaceId, teamId) : getTeamAllowedTransitions(workspaceId, teamId),
        getTeamActionStates(workspaceId, teamId),
    ])

    const currentColumn = resolveColumnFromState(data.issue?.state, ctx)
    const allowed = currentColumn ? (transitions[currentColumn] ?? []) : []
    if (!allowed.includes(target)) {
        throw new Error(`Cannot move from "${currentColumn ?? "unknown"}" to "${target}"`)
    }

    if ((target === "submitted" || target === "blocked") && !comment) {
        throw new Error("A comment is required when requesting changes")
    }

    let stateId: string | null = null
    if (target === "done" && actionStates.approveStateId) {
        stateId = actionStates.approveStateId
    } else if (target === "archived" && actionStates.rejectStateId) {
        stateId = actionStates.rejectStateId
    } else {
        stateId = findStateForUATColumn(states, target, ctx.customMappings)
    }
    if (!stateId) {
        throw new Error(`No Linear state found for UAT column "${target}" in this team`)
    }

    const linearClient = await getPortalLinearClient(isStaff ? user.id : undefined)
    await linearClient.updateIssue(issueId, { stateId })

    after(() => logPortalEvent({
        workspaceId,
        clientId: profile.clientId,
        teamId: teamId ?? undefined,
        userId: user.id,
        issueId,
        eventType: 'issue_column_moved',
        actorRole: resolveActorRole(isStaff),
        fromColumn: currentColumn,
        toColumn: target,
    }))

    if (comment) {
        await createPortalComment(issueId, comment)
    }

    revalidatePath("/uat")
}

export async function forceApproveIssueWithSubIssues(issueId: string) {
    const { profile, user, isStaff, workspaceId } = await getPortalUser()

    const genql = await getPortalLinearGenqlClient(isStaff ? user.id : undefined)

    const data = await genql.query({
        issue: {
            __args: { id: issueId },
            id: true,
            identifier: true,
            title: true,
            team: {
                id: true,
                states: { __args: {}, nodes: { id: true, name: true, type: true } },
            },
            children: {
                __args: {},
                nodes: {
                    id: true,
                    state: { id: true, name: true, type: true },
                },
            },
        },
    })

    const teamId = data.issue?.team?.id
    assertTeamAccess(profile, teamId, "Access denied: issue not in your client's teams")

    const states = (data.issue?.team?.states?.nodes ?? []).filter(s => s.id) as Array<{ id: string; name: string; type: string }>
    const [ctx, actionStates] = await Promise.all([
        loadUATMappingContext(workspaceId, teamId),
        getTeamActionStates(workspaceId, teamId),
    ])

    const doneStateId = actionStates.approveStateId ?? findStateForUATColumn(states, "done", ctx.customMappings)
    if (!doneStateId) throw new Error(`No Linear state found for "done" in this team`)

    const TERMINAL: readonly UATColumn[] = ["done", "released", "archived", "canceled"]
    const linearClient = await getPortalLinearClient(isStaff ? user.id : undefined)

    const children = (data.issue?.children?.nodes ?? []).filter((c): c is { id: string; state: { id: string; name: string; type: string } } => !!c.id)
    await Promise.all(
        children
            .filter(child => {
                const col = resolveColumnFromState(child.state, ctx)
                return !col || !TERMINAL.includes(col)
            })
            .map(child => linearClient.updateIssue(child.id, { stateId: doneStateId }))
    )

    await linearClient.updateIssue(issueId, { stateId: doneStateId })

    after(() => logPortalEvent({
        workspaceId,
        clientId: profile.clientId,
        teamId: teamId ?? undefined,
        userId: user.id,
        issueId,
        issueTitle: data.issue?.title ?? undefined,
        issueIdentifier: data.issue?.identifier ?? undefined,
        eventType: 'issue_force_approved',
        actorRole: resolveActorRole(isStaff),
        toColumn: 'done',
    }))

    revalidatePath("/uat")
}

export async function createPortalComment(issueId: string, body: string): Promise<PortalComment> {
    const trimmedBody = body.trim()
    if (!trimmedBody) throw new Error("Comment body is required")
    if (trimmedBody.length > 65_536) throw new Error("Comment is too long (max 65,536 characters)")

    const { profile, user, isStaff, workspaceId } = await getPortalUser()

    const genql = await getPortalLinearGenqlClient(isStaff ? user.id : undefined)
    const data = await genql.query({
        issue: {
            __args: { id: issueId },
            id: true,
            identifier: true,
            title: true,
            team: { id: true },
        },
    })

    const teamId = data.issue?.team?.id
    assertTeamAccess(profile, teamId, "Access denied: issue not in your client's teams")

    const commentWindowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
    const COMMENT_RATE_LIMIT_MAX = 60
    const recentComments = await prisma.portalIssueLog.count({
        where: { clientId: profile.clientId, createdAt: { gte: commentWindowStart } },
    })
    if (recentComments >= COMMENT_RATE_LIMIT_MAX) {
        throw new Error(`Rate limit exceeded: max ${COMMENT_RATE_LIMIT_MAX} comments per hour. Please try again later.`)
    }
    await prisma.portalIssueLog.create({
        data: { clientId: profile.clientId, userId: user.id },
    })

    const attribution = isStaff ? "" : `\n\n---\n*Comment by **${user.name ?? user.email}** via Client Portal*`
    const fullBody = trimmedBody + attribution

    const linearClient = await getPortalLinearClient(isStaff ? user.id : undefined)
    const result = await linearClient.createComment({ issueId, body: fullBody })
    const comment = await result.comment
    if (!comment) throw new Error('Failed to create comment')

    after(() => logPortalEvent({
        workspaceId,
        clientId: profile.clientId,
        teamId: teamId ?? undefined,
        userId: user.id,
        issueId,
        issueTitle: data.issue?.title ?? undefined,
        issueIdentifier: data.issue?.identifier ?? undefined,
        eventType: 'issue_commented',
        actorRole: resolveActorRole(isStaff),
        metadata: { commentLength: body.length },
    }))

    revalidatePath(`/uat`)
    return {
        id: comment.id,
        body: fullBody,
        authorName: user.name ?? user.email ?? 'Unknown',
        createdAt: new Date().toISOString(),
    }
}

export async function updatePortalIssueDescription(issueId: string, description: string) {
    const { profile, user, isStaff, workspaceId } = await getPortalUser()

    const genql = await getPortalLinearGenqlClient(isStaff ? user.id : undefined)
    const data = await genql.query({
        issue: {
            __args: { id: issueId },
            id: true,
            identifier: true,
            title: true,
            team: { id: true },
        },
    })

    const teamId = data.issue?.team?.id
    assertTeamAccess(profile, teamId, "Access denied: issue not in your client's teams")

    const trimmed = description.trim()
    if (!trimmed) throw new Error("Description cannot be empty")
    if (trimmed.length > 65536) throw new Error("Description is too long")

    const linearClient = await getPortalLinearClient(isStaff ? user.id : undefined)
    await linearClient.updateIssue(issueId, { description: trimmed })

    after(() => logPortalEvent({
        workspaceId,
        clientId: profile.clientId,
        teamId: teamId ?? undefined,
        userId: user.id,
        issueId,
        issueTitle: data.issue?.title ?? undefined,
        issueIdentifier: data.issue?.identifier ?? undefined,
        eventType: 'issue_description_updated',
        actorRole: resolveActorRole(isStaff),
    }))

    revalidatePath("/uat")
}

function validateAttachmentUrl(raw: string): string {
    const trimmed = raw.trim()
    if (!trimmed) throw new Error("Attachment URL is required")
    if (trimmed.length > 2048) throw new Error("Attachment URL is too long (max 2048 chars)")
    let parsed: URL
    try { parsed = new URL(trimmed) } catch { throw new Error("Attachment URL is not a valid URL") }
    if (!['https:', 'http:'].includes(parsed.protocol)) {
        throw new Error("Attachment URL must use http or https")
    }
    const host = parsed.hostname.toLowerCase()
    const PRIVATE_RE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/
    if (PRIVATE_RE.test(host)) throw new Error("Attachment URL must be a public URL")
    const ipv6 = host.startsWith('[') ? host.slice(1, -1) : null
    if (ipv6 !== null) {
        if (
            ipv6 === '::1' ||
            ipv6 === '::' ||
            ipv6 === '0:0:0:0:0:0:0:1' ||
            ipv6.startsWith('fc') ||
            ipv6.startsWith('fd') ||
            ipv6.startsWith('fe80')
        ) {
            throw new Error("Attachment URL must be a public URL")
        }
    }
    return trimmed
}

export async function createPortalAttachment(issueId: string, url: string, title: string) {
    const validatedUrl = validateAttachmentUrl(url)

    const { profile, user, isStaff, workspaceId } = await getPortalUser()

    const genql = await getPortalLinearGenqlClient(isStaff ? user.id : undefined)
    const data = await genql.query({
        issue: { __args: { id: issueId }, id: true, identifier: true, title: true, team: { id: true } },
    })
    const teamId = data.issue?.team?.id
    if (!teamId) throw new Error("Issue not found")

    assertTeamAccess(profile, teamId, "Access denied: issue not in your client's teams")

    const attachmentWindowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
    const recentAttachments = await prisma.portalIssueLog.count({
        where: { clientId: profile.clientId, createdAt: { gte: attachmentWindowStart } },
    })
    if (recentAttachments >= RATE_LIMIT_MAX) {
        throw new Error(`Rate limit exceeded: max ${RATE_LIMIT_MAX} portal actions per hour. Please try again later.`)
    }
    await prisma.portalIssueLog.create({
        data: { clientId: profile.clientId, userId: user.id },
    })

    const linearClient = await getPortalLinearClient(isStaff ? user.id : undefined)
    await linearClient.createAttachment({ issueId, url: validatedUrl, title })

    after(() => logPortalEvent({
        workspaceId,
        clientId: profile.clientId,
        teamId: teamId ?? undefined,
        userId: user.id,
        issueId,
        issueTitle: data.issue?.title ?? undefined,
        issueIdentifier: data.issue?.identifier ?? undefined,
        eventType: 'issue_attachment_added',
        actorRole: resolveActorRole(isStaff),
        metadata: { url: validatedUrl, title },
    }))
    revalidatePath("/uat")
}

"use server"

import { prisma } from "@/lib/prisma"
import { getPortalLinearGenqlClient } from "@/lib/linear-portal"
import { type AllowedTransitions } from "@/lib/uat-mapping"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { getPortalUser } from "./auth"
import { assertTeamAccess } from "./constants"
import { type PortalIssue, type PortalWorkflowState, type PortalModuleLabel, type PortalComment, type PortalChildIssue, type PortalAttachment, mapLinearNode } from "./types"
import { getTeamAllowedTransitions, getTeamStaffTransitions } from "./transitions"
import { loadUATMappingContext, resolveColumnFromState } from "./resolution"

export async function getPortalUserFlags() {
    const result = await getPortalUser()
    const { isStaff } = result
    const role = isStaff ? (result as { role: string }).role : undefined
    const isAdminRole = isStaff && role !== undefined && ["OWNER", "ADMIN", "MANAGER"].includes(role)
    return { isStaff, isAdminRole }
}

export async function getPortalProfile() {
    const { user, profile, isStaff } = await getPortalUser()
    return {
        id: profile.id,
        userId: user.id,
        userName: user.name ?? user.email,
        userEmail: user.email,
        userImage: user.image ?? null,
        clientId: profile.clientId,
        clientName: isStaff ? "Staff Access" : profile.client.name,
        isStaff,
    }
}

export async function getPortalTeams() {
    const result = await getPortalUser()
    if (result.isStaff) {
        return result.staffClients.flatMap(c =>
            c.linearTeams.map(t => ({ id: t.id, name: t.name, key: t.key, clientName: c.name, clientId: c.id }))
        )
    }
    return result.profile.client.linearTeams.map(t => ({
        id: t.id, name: t.name, key: t.key, clientName: undefined as string | undefined, clientId: undefined as string | undefined,
    }))
}

export async function getPortalIssues(teamId: string): Promise<PortalIssue[]> {
    const { profile, user, isStaff, workspaceId } = await getPortalUser({ teamId })

    assertTeamAccess(profile, teamId)

    const [teamSettings, clientRecord] = await Promise.all([
        prisma.clientTeamSettings.findUnique({
            where: { clientId_linearTeamId: { clientId: profile.clientId, linearTeamId: teamId } },
        }),
        prisma.client.findUnique({
            where: { id: profile.clientId },
            select: { uatLabelIds: true, uatProjectIds: true, workspaceId: true },
        }),
    ])
    const uatLabelIds = [...(teamSettings?.uatLabelIds ?? []), ...(clientRecord?.uatLabelIds ?? [])]
        .filter((id, i, arr) => arr.indexOf(id) === i)
    const uatProjectIds = [...(teamSettings?.uatProjectIds ?? []), ...(clientRecord?.uatProjectIds ?? [])]
        .filter((id, i, arr) => arr.indexOf(id) === i)

    const wsId = clientRecord?.workspaceId ?? workspaceId
    const ctx = await loadUATMappingContext(wsId, teamId)

    const genql = await getPortalLinearGenqlClient(isStaff ? user.id : undefined).catch((e: unknown) => { if (isRedirectError(e)) throw e; return null })
    if (!genql) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const andConditions: any[] = [{ team: { id: { eq: teamId } } }]
    if (uatLabelIds.length > 0) {
        andConditions.push({ labels: { some: { id: { in: uatLabelIds } } } })
    }
    if (uatProjectIds.length > 0) {
        andConditions.push({ project: { id: { in: uatProjectIds } } })
    }
    const issueFilter = andConditions.length === 1 ? andConditions[0] : { and: andConditions }

    let rawNodes: import("./types").RawLinearNode[]
    try {
        const data = await genql.query({
            issues: {
                __args: {
                    filter: issueFilter,
                    first: 250,
                    orderBy: "updatedAt" as "createdAt",
                },
                nodes: {
                    id: true,
                    identifier: true,
                    title: true,
                    url: true,
                    priority: true,
                    createdAt: true,
                    updatedAt: true,
                    completedAt: true,
                    state: { id: true, name: true, type: true, color: true },
                    assignee: { id: true, name: true, avatarUrl: true },
                    creator: { id: true, name: true, avatarUrl: true },
                    project: { id: true, name: true },
                    cycle: { number: true, name: true },
                    parent: { id: true, identifier: true, title: true },
                    labels: { __args: {}, nodes: { id: true, name: true, color: true } },
                },
            },
        })
        rawNodes = (data.issues?.nodes ?? []).filter(i => i.id)
    } catch (e) {
        console.error('[Portal] Linear query failed:', e)
        return []
    }

    return rawNodes.flatMap(i => {
        const uatColumn = resolveColumnFromState(i.state, ctx)
        if (!uatColumn) return []
        return { ...mapLinearNode(i), uatColumn }
    })
}

export async function getPortalWorkflowStates(teamId: string): Promise<PortalWorkflowState[]> {
    const { profile, user, isStaff, workspaceId } = await getPortalUser({ teamId })

    assertTeamAccess(profile, teamId)

    const genql = await getPortalLinearGenqlClient(isStaff ? user.id : undefined).catch((e: unknown) => { if (isRedirectError(e)) throw e; return null })
    if (!genql) return []

    try {
        const [data, ctx] = await Promise.all([
            genql.query({
                workflowStates: {
                    __args: { filter: { team: { id: { eq: teamId } } } },
                    nodes: { id: true, name: true, type: true, color: true, position: true },
                },
            }),
            loadUATMappingContext(workspaceId, teamId),
        ])
        return (data.workflowStates?.nodes ?? []).filter(s => s.id).map(s => ({
            id: s.id!,
            name: s.name ?? "",
            type: s.type ?? "",
            color: s.color ?? "#6b7280",
            position: s.position ?? 0,
            uatColumn: resolveColumnFromState(s, ctx),
        })).sort((a, b) => a.position - b.position)
    } catch (e) {
        console.error('[Portal] Linear query failed:', e)
        return []
    }
}

export async function getPortalModuleLabels(teamId?: string): Promise<PortalModuleLabel[]> {
    const { profile, user, isStaff } = await getPortalUser(teamId ? { teamId } : undefined)

    const [teamSettings, clientRecord] = await Promise.all([
        teamId ? prisma.clientTeamSettings.findUnique({
            where: { clientId_linearTeamId: { clientId: profile.clientId, linearTeamId: teamId } },
        }) : Promise.resolve(null),
        prisma.client.findUnique({
            where: { id: profile.clientId },
            select: { portalModuleLabelIds: true },
        }),
    ])
    const ids = teamSettings?.portalModuleLabelIds?.length
        ? teamSettings.portalModuleLabelIds
        : (clientRecord?.portalModuleLabelIds ?? [])
    if (ids.length === 0) return []

    const genql = await getPortalLinearGenqlClient(isStaff ? user.id : undefined).catch((e: unknown) => { if (isRedirectError(e)) throw e; return null })
    if (!genql) return []

    try {
        const data = await genql.query({
            issueLabels: {
                __args: { filter: { id: { in: ids } }, first: 250 },
                nodes: { id: true, name: true, color: true, parent: { id: true }, children: { __args: {}, nodes: { id: true } } },
            },
        })
        const map = new Map<string, PortalModuleLabel>()
        for (const l of data.issueLabels?.nodes ?? []) {
            if (!l.id) continue
            const hasChildren = ((l.children as { nodes?: { id?: string | null }[] } | null)?.nodes?.length ?? 0) > 0
            if (hasChildren) continue
            map.set(l.id, {
                id: l.id,
                name: l.name ?? "",
                color: l.color ?? "#6b7280",
                parentId: (l.parent as { id: string } | null)?.id ?? null,
                children: [],
            })
        }
        for (const node of map.values()) {
            if (node.parentId && map.has(node.parentId)) {
                map.get(node.parentId)!.children.push(node)
            }
        }
        const nodes = [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
        for (const n of nodes) n.children.sort((a, b) => a.name.localeCompare(b.name))
        return nodes
    } catch (e) {
        console.error('[Portal] Linear query failed:', e)
        return []
    }
}

export async function getPortalIssue(issueId: string): Promise<PortalIssue & { comments: PortalComment[]; teamId: string; children: PortalChildIssue[]; attachments: PortalAttachment[]; uatColumn: import("@/lib/uat-mapping").UATColumn | null }> {
    const { profile, user, isStaff, workspaceId } = await getPortalUser()
    const genql = await getPortalLinearGenqlClient(isStaff ? user.id : undefined)

    const data = await genql.query({
        issue: {
            __args: { id: issueId },
            id: true,
            identifier: true,
            title: true,
            description: true,
            url: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
            completedAt: true,
            state: { id: true, name: true, type: true, color: true },
            assignee: { id: true, name: true, avatarUrl: true },
            creator: { id: true, name: true, avatarUrl: true },
            project: { id: true, name: true },
            cycle: { number: true, name: true },
            labels: { __args: {}, nodes: { id: true, name: true, color: true } },
            parent: { id: true, identifier: true, title: true },
            team: { id: true },
            comments: {
                __args: {},
                nodes: { id: true, body: true, createdAt: true, user: { id: true, name: true } },
            },
            children: {
                __args: {},
                nodes: {
                    id: true,
                    identifier: true,
                    title: true,
                    priority: true,
                    state: { id: true, name: true, type: true, color: true },
                },
            },
            attachments: {
                __args: {},
                nodes: { id: true, url: true, title: true, subtitle: true },
            },
        },
    })

    const teamId = data.issue?.team?.id
    assertTeamAccess(profile, teamId, "Access denied: issue not in your client's teams")

    if (!data.issue) throw new Error("Issue not found")
    const i = data.issue

    const ctx = await loadUATMappingContext(workspaceId, teamId)
    const uatColumn = resolveColumnFromState(i.state, ctx)

    return {
        ...mapLinearNode(i),
        uatColumn,
        comments: (i.comments?.nodes ?? []).filter(c => c.id).map(c => ({
            id: c.id!,
            body: c.body ?? "",
            authorName: c.user?.name ?? "Unknown",
            createdAt: c.createdAt ?? new Date().toISOString(),
        })),
        children: (i.children?.nodes ?? []).filter(c => c.id).map(c => ({
            id: c.id!,
            identifier: c.identifier ?? "",
            title: c.title ?? "",
            priority: c.priority ?? 0,
            state: {
                id: c.state?.id ?? "",
                name: c.state?.name ?? "",
                type: c.state?.type ?? "",
                color: c.state?.color ?? "#6b7280",
            },
            uatColumn: resolveColumnFromState(c.state, ctx),
        })),
        attachments: (i.attachments?.nodes ?? []).filter(a => a.id).map(a => ({
            id: a.id!,
            url: a.url ?? "",
            title: a.title ?? "",
            subtitle: a.subtitle ?? null,
        })),
        teamId,
    }
}

export async function getPortalIssueComments(issueId: string): Promise<PortalComment[]> {
    const { profile, user, isStaff } = await getPortalUser()

    const genql = await getPortalLinearGenqlClient(isStaff ? user.id : undefined)
    const data = await genql.query({
        issue: {
            __args: { id: issueId },
            id: true,
            team: { id: true },
            comments: {
                __args: {},
                nodes: {
                    id: true,
                    body: true,
                    createdAt: true,
                    user: { id: true, name: true },
                },
            },
        },
    })

    const teamId = data.issue?.team?.id
    assertTeamAccess(profile, teamId, "Access denied")

    return (data.issue?.comments?.nodes ?? [])
        .filter(c => c.id)
        .map(c => ({
            id: c.id!,
            body: c.body ?? '',
            authorName: c.user?.name ?? 'Unknown',
            createdAt: c.createdAt ?? new Date().toISOString(),
        }))
}

export async function getPortalIssueAllowedTransitions(teamId: string): Promise<AllowedTransitions> {
    const { workspaceId, isStaff } = await getPortalUser({ teamId })
    if (isStaff) {
        return getTeamStaffTransitions(workspaceId, teamId)
    }
    return getTeamAllowedTransitions(workspaceId, teamId)
}

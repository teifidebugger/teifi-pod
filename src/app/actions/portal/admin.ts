"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/app/actions"
import { auth } from "@/lib/auth"
import { validatePassword } from "@/lib/password-validation-shared"
import { createClient } from "@/lib/linear-genql"
// NOTE: getLinearClient and decryptToken are intentionally imported from @/lib/linear (staff OAuth),
// not @/lib/linear-portal. This file contains admin-only operations that operate on the admin's
// own OAuth token (not the service account), so using the staff OAuth helpers is correct here.
import { decryptToken, getLinearClient } from "@/lib/linear"
import { LinearClient } from "@linear/sdk"
import { mapStateToUATColumn, type UATColumn, type AllowedTransitions } from "@/lib/uat-mapping"
import { Prisma } from "@prisma/client"
import { getAccessibleTeamIds } from "@/lib/rbac"
import { TRANSITIONS_CACHE_TAG, ACTION_STATES_CACHE_TAG, WORKSPACE_TRANSITIONS_CACHE_TAG, WORKSPACE_STATE_MAPPING_CACHE_TAG } from "./cache-tags"
import { getWorkspaceStateTypeMapping, getTeamAllowedTransitions, getTeamStaffTransitions } from "./transitions"

async function requireAdmin() {
    const user = await getSessionUser()
    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        select: { id: true, workspaceId: true, role: true },
    })
    if (!member) throw new Error("No workspace membership")
    if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Admin access required")
    return member
}

async function requireAdminOrManager() {
    const user = await getSessionUser()
    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        select: { id: true, workspaceId: true, role: true },
    })
    if (!member) throw new Error("No workspace membership")
    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) throw new Error("Admin or manager access required")
    const scopedTeamIds = await getAccessibleTeamIds(member.id, member.role, member.workspaceId)
    return { ...member, scopedTeamIds }
}

export async function createPortalProfile(userId: string, clientId: string) {
    const admin = await requireAdmin()

    // Verify client belongs to this workspace
    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    const profile = await prisma.portalProfile.upsert({
        where: { userId },
        create: { userId, clientId, isActive: true },
        update: { clientId, isActive: true },
    })

    revalidatePath(`/clients/${clientId}`)
    return profile
}

export async function deactivatePortalProfile(profileId: string) {
    const admin = await requireAdmin()

    // Verify the profile's client belongs to this workspace
    const profile = await prisma.portalProfile.findFirst({
        where: { id: profileId },
        include: { client: { select: { workspaceId: true } } },
    })
    if (!profile || profile.client.workspaceId !== admin.workspaceId) {
        throw new Error("Portal profile not found")
    }

    await prisma.portalProfile.update({
        where: { id: profileId },
        data: { isActive: false },
    })

    revalidatePath(`/clients/${profile.clientId}`)
}

export async function reactivatePortalProfile(profileId: string) {
    const admin = await requireAdmin()

    const profile = await prisma.portalProfile.findFirst({
        where: { id: profileId },
        include: { client: { select: { workspaceId: true } } },
    })
    if (!profile || profile.client.workspaceId !== admin.workspaceId) {
        throw new Error("Portal profile not found")
    }

    await prisma.portalProfile.update({
        where: { id: profileId },
        data: { isActive: true },
    })

    revalidatePath(`/clients/${profile.clientId}`)
}

export async function updatePortalUserName(profileId: string, name: string) {
    const admin = await requireAdmin()

    const trimmed = name.trim()
    if (!trimmed) throw new Error("Name cannot be empty")

    const profile = await prisma.portalProfile.findFirst({
        where: { id: profileId },
        include: { client: { select: { workspaceId: true } }, user: { select: { id: true } } },
    })
    if (!profile || profile.client.workspaceId !== admin.workspaceId) {
        throw new Error("Portal profile not found")
    }

    await prisma.user.update({
        where: { id: profile.user.id },
        data: { name: trimmed },
    })

    revalidatePath(`/clients/${profile.clientId}`)
}

export async function linkClientToLinearTeam(clientId: string, teamId: string) {
    const admin = await requireAdmin()

    const [client, team] = await Promise.all([
        prisma.client.findFirst({ where: { id: clientId, workspaceId: admin.workspaceId } }),
        prisma.linearTeam.findFirst({ where: { id: teamId, workspaceId: admin.workspaceId }, include: { clients: { select: { id: true, name: true } } } }),
    ])
    if (!client) throw new Error("Client not found")
    if (!team) throw new Error("Linear team not found")

    const alreadyLinked = team.clients.find(c => c.id !== clientId)
    if (alreadyLinked) throw new Error(`This Linear team is already linked to "${alreadyLinked.name}". Unlink it first before linking to another client.`)

    await prisma.client.update({
        where: { id: clientId },
        data: { linearTeams: { connect: { id: teamId } } },
    })

    revalidatePath(`/clients/${clientId}`)
}

export async function unlinkClientFromLinearTeam(clientId: string, teamId: string) {
    const admin = await requireAdmin()

    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    await prisma.client.update({
        where: { id: clientId },
        data: { linearTeams: { disconnect: { id: teamId } } },
    })

    revalidatePath(`/clients/${clientId}`)
}

/**
 * Look up an existing user by email so admin can grant portal access directly
 * without sending an invite link.
 */
export async function findUserByEmail(email: string) {
    await requireAdmin()
    const user = await prisma.user.findFirst({
        where: { email: email.toLowerCase().trim() },
        select: { id: true, name: true, email: true, image: true },
    })
    return user ?? null
}

export async function getPortalProfilesForClient(clientId: string) {
    const admin = await requireAdmin()

    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    return prisma.portalProfile.findMany({
        where: { clientId },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { createdAt: "asc" },
    })
}

/** Flat label (id + name + color). */
export type LinearLabel = { id: string; name: string; color: string }

/**
 * Label with optional parent — mirrors Linear's own label hierarchy.
 * Top-level labels (no parent) can act as module categories.
 * Child labels refine within a module.
 */
export type LinearLabelNode = LinearLabel & {
    parentId: string | null
    children: LinearLabelNode[]
}

/** Get a Linear genql client using the admin's own OAuth token. Returns null if not connected or token revoked. */
async function getAdminLinearClient(userId: string) {
    const record = await prisma.linearUserToken.findFirst({ where: { userId } })
    if (!record) return null
    let accessToken: string
    try {
        accessToken = decryptToken(record.accessToken)
    } catch {
        // Token was encrypted with an unknown key (e.g. different env) — treat as disconnected
        await prisma.linearUserToken.deleteMany({ where: { userId } })
        return null
    }
    const genql = createClient({ headers: { Authorization: `Bearer ${accessToken}` } })
    try {
        await genql.query({ viewer: { id: true } })
        return genql
    } catch (e: unknown) {
        const status = (e as { response?: { status?: number } })?.response?.status
        if (status === 401) {
            await prisma.linearUserToken.deleteMany({ where: { userId } })
        }
        return null
    }
}

/**
 * Fetch all Linear issue labels for the teams linked to a client,
 * including parent-child hierarchy (Linear label groups).
 * Returns a flat list sorted by name — use buildLabelTree() to get a tree.
 */
export async function getLinearLabelsForClient(clientId: string): Promise<LinearLabelNode[]> {
    const admin = await requireAdmin()
    const user = await getSessionUser()

    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
        include: { linearTeams: { select: { id: true } } },
    })
    if (!client || client.linearTeams.length === 0) return []

    const genql = await getAdminLinearClient(user.id)
    if (!genql) return []

    // Fetch labels for all linked teams with parent info (deduplicated by ID)
    const labelMap = new Map<string, LinearLabelNode>()
    await Promise.all(
        client.linearTeams.map(async team => {
            const data = await genql.query({
                issueLabels: {
                    __args: { filter: { team: { id: { eq: team.id } } }, first: 250 },
                    nodes: {
                        id: true,
                        name: true,
                        color: true,
                        parent: { id: true },
                    },
                },
            })
            for (const l of data.issueLabels?.nodes ?? []) {
                if (l.id) labelMap.set(l.id, {
                    id: l.id,
                    name: l.name ?? "",
                    color: l.color ?? "#6b7280",
                    parentId: (l.parent as { id: string } | null)?.id ?? null,
                    children: [],
                })
            }
        })
    )

    // Wire up children
    const nodes = [...labelMap.values()]
    for (const node of nodes) {
        if (node.parentId && labelMap.has(node.parentId)) {
            labelMap.get(node.parentId)!.children.push(node)
        }
    }
    for (const node of nodes) {
        node.children.sort((a, b) => a.name.localeCompare(b.name))
    }

    return nodes.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Fetch Linear issue labels for a specific team.
 */
export async function getLinearLabelsForTeam(teamId: string): Promise<LinearLabelNode[]> {
    const admin = await requireAdmin()
    const user = await getSessionUser()

    const team = await prisma.linearTeam.findFirst({
        where: { id: teamId, workspaceId: admin.workspaceId },
    })
    if (!team) throw new Error("Linear team not found")

    const genql = await getAdminLinearClient(user.id)
    if (!genql) return []

    const labelMap = new Map<string, LinearLabelNode>()
    const data = await genql.query({
        issueLabels: {
            __args: { filter: { team: { id: { eq: teamId } } }, first: 250 },
            nodes: { id: true, name: true, color: true, parent: { id: true } },
        },
    })
    for (const l of data.issueLabels?.nodes ?? []) {
        if (l.id) labelMap.set(l.id, {
            id: l.id,
            name: l.name ?? "",
            color: l.color ?? "#6b7280",
            parentId: (l.parent as { id: string } | null)?.id ?? null,
            children: [],
        })
    }

    const nodes = [...labelMap.values()]
    for (const node of nodes) {
        if (node.parentId && labelMap.has(node.parentId)) {
            labelMap.get(node.parentId)!.children.push(node)
        }
    }
    for (const node of nodes) {
        node.children.sort((a, b) => a.name.localeCompare(b.name))
    }
    return nodes.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Set the module label IDs for a client portal.
 * These labels are used as UAT module groups in the Acceptance view.
 * Pass [] to clear.
 */
export async function updateClientModuleLabels(clientId: string, labelIds: string[]) {
    const admin = await requireAdmin()

    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    await prisma.client.update({
        where: { id: clientId },
        data: { portalModuleLabelIds: labelIds },
    })

    revalidatePath(`/clients/${clientId}`)
}

/**
 * Set the UAT label IDs for a client.
 * Only issues tagged with ANY of these labels will appear in the client's UAT portal.
 */
export async function updateClientUatLabel(clientId: string, labelIds: string[]) {
    const admin = await requireAdmin()

    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    await prisma.client.update({
        where: { id: clientId },
        data: { uatLabelIds: labelIds },
    })

    revalidatePath(`/clients/${clientId}`)
}

// ─── Per-Team Settings ─────────────────────────────────────────────────────

export type ClientTeamSettingsData = {
    uatLabelIds: string[]
    uatProjectIds: string[]
    portalModuleLabelIds: string[]
}

/**
 * Get or create the per-team settings for a client + Linear team pair.
 */
export async function getClientTeamSettings(clientId: string, teamId: string): Promise<ClientTeamSettingsData> {
    const admin = await requireAdmin()
    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    const settings = await prisma.clientTeamSettings.findUnique({
        where: { clientId_linearTeamId: { clientId, linearTeamId: teamId } },
    })
    return {
        uatLabelIds: settings?.uatLabelIds ?? [],
        uatProjectIds: settings?.uatProjectIds ?? [],
        portalModuleLabelIds: settings?.portalModuleLabelIds ?? [],
    }
}

/**
 * Set the UAT label IDs for a specific team within a client.
 */
export async function updateTeamUatLabel(clientId: string, teamId: string, labelIds: string[]) {
    const admin = await requireAdmin()
    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    await prisma.clientTeamSettings.upsert({
        where: { clientId_linearTeamId: { clientId, linearTeamId: teamId } },
        create: { clientId, linearTeamId: teamId, uatLabelIds: labelIds },
        update: { uatLabelIds: labelIds },
    })
    revalidatePath(`/clients/${clientId}`)
}

/**
 * Set the UAT project filter for a specific team within a client.
 * Pass an empty array to clear the filter.
 */
export async function updateTeamUatProject(clientId: string, teamId: string, projectIds: string[]) {
    const admin = await requireAdmin()
    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    await prisma.clientTeamSettings.upsert({
        where: { clientId_linearTeamId: { clientId, linearTeamId: teamId } },
        create: { clientId, linearTeamId: teamId, uatProjectIds: projectIds },
        update: { uatProjectIds: projectIds },
    })
    revalidatePath(`/clients/${clientId}`)
}

/**
 * Set module label IDs for a specific team within a client.
 */
export async function updateTeamModuleLabels(clientId: string, teamId: string, labelIds: string[]) {
    const admin = await requireAdmin()
    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    await prisma.clientTeamSettings.upsert({
        where: { clientId_linearTeamId: { clientId, linearTeamId: teamId } },
        create: { clientId, linearTeamId: teamId, portalModuleLabelIds: labelIds },
        update: { portalModuleLabelIds: labelIds },
    })
    revalidatePath(`/clients/${clientId}`)
}

/**
 * Fetch Linear projects for a specific team.
 */
export async function getLinearProjectsForTeam(teamId: string): Promise<LinearProject[]> {
    const admin = await requireAdmin()
    const user = await getSessionUser()

    const team = await prisma.linearTeam.findFirst({
        where: { id: teamId, workspaceId: admin.workspaceId },
    })
    if (!team) throw new Error("Linear team not found")

    const genql = await getAdminLinearClient(user.id)
    if (!genql) return []

    const data = await genql.query({
        projects: {
            __args: { filter: { accessibleTeams: { id: { eq: teamId } } }, first: 100 },
            nodes: { id: true, name: true, state: true, color: true },
        },
    })
    return (data.projects?.nodes ?? [])
        .filter(p => p.id)
        .map(p => ({ id: p.id!, name: p.name ?? "", state: p.state ?? "", color: p.color ?? null }))
        .sort((a, b) => a.name.localeCompare(b.name))
}

export type LinearProject = { id: string; name: string; state: string; color: string | null }

/**
 * Fetch all Linear projects for the teams linked to a client.
 */
export async function getLinearProjectsForClient(clientId: string): Promise<LinearProject[]> {
    const admin = await requireAdmin()
    const user = await getSessionUser()

    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
        include: { linearTeams: { select: { id: true } } },
    })
    if (!client || client.linearTeams.length === 0) return []

    const genql = await getAdminLinearClient(user.id)
    if (!genql) return []

    const projectMap = new Map<string, LinearProject>()
    await Promise.all(
        client.linearTeams.map(async team => {
            const data = await genql.query({
                projects: {
                    __args: { filter: { accessibleTeams: { id: { eq: team.id } } }, first: 100 },
                    nodes: { id: true, name: true, state: true, color: true },
                },
            })
            for (const p of data.projects?.nodes ?? []) {
                if (p.id) projectMap.set(p.id, {
                    id: p.id,
                    name: p.name ?? "",
                    state: p.state ?? "",
                    color: p.color ?? null,
                })
            }
        })
    )

    return [...projectMap.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Set the UAT project filter for a client.
 * Pass an empty array to clear the filter.
 */
export async function updateClientUatProject(clientId: string, projectIds: string[]) {
    const admin = await requireAdmin()

    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    await prisma.client.update({
        where: { id: clientId },
        data: { uatProjectIds: projectIds },
    })

    revalidatePath(`/clients/${clientId}`)
}

// ─── UAT State Mapping ──────────────────────────────────────────────────────

export type WorkflowStateWithMapping = {
    id: string
    name: string
    type: string
    color: string
    position: number
    /** undefined = use heuristic (no DB record), null = explicitly hidden, string = column id */
    uatColumn: string | null | undefined
}

/**
 * Fetch Linear workflow states for a team + merge with any custom UAT mappings from DB.
 */
export async function getLinearWorkflowStatesWithMappings(teamId: string): Promise<WorkflowStateWithMapping[] | null> {
    const admin = await requireAdmin()
    const user = await getSessionUser()

    // Verify team belongs to admin's workspace
    const team = await prisma.linearTeam.findFirst({
        where: { id: teamId, workspaceId: admin.workspaceId },
    })
    if (!team) throw new Error("Linear team not found in this workspace")

    const genql = await getAdminLinearClient(user.id)
    if (!genql) return null

    // Fetch workflow states + existing mappings in parallel
    const [statesData, existingMappings] = await Promise.all([
        genql.query({
            workflowStates: {
                __args: { filter: { team: { id: { eq: teamId } } } },
                nodes: { id: true, name: true, type: true, color: true, position: true },
            },
        }),
        prisma.uatStateMapping.findMany({
            where: { workspaceId: admin.workspaceId, linearTeamId: teamId },
        }),
    ])

    const mappingByStateId = new Map(existingMappings.map(m => [m.linearStateId, m.uatColumn]))

    return (statesData.workflowStates?.nodes ?? [])
        .filter(s => s.id)
        .map(s => ({
            id: s.id!,
            name: s.name ?? "",
            type: s.type ?? "",
            color: s.color ?? "#6b7280",
            position: s.position ?? 0,
            uatColumn: mappingByStateId.has(s.id!)
                ? (mappingByStateId.get(s.id!) as string | null) // null = hidden, string = column
                : undefined, // undefined = no override, use heuristic
        }))
        .sort((a, b) => a.position - b.position)
}

/**
 * Save custom UAT state mappings for a Linear team.
 * Only saves states that have been explicitly overridden (not "auto").
 */
export async function saveUATStateMappings(
    teamId: string,
    mappings: Array<{ stateId: string; stateName: string; uatColumn: string | null }>
): Promise<void> {
    const admin = await requireAdmin()

    const team = await prisma.linearTeam.findFirst({
        where: { id: teamId, workspaceId: admin.workspaceId },
    })
    if (!team) throw new Error("Linear team not found in this workspace")

    // Delete any existing mappings for states not in the new set
    const overriddenStateIds = mappings.map(m => m.stateId)
    await prisma.uatStateMapping.deleteMany({
        where: {
            workspaceId: admin.workspaceId,
            linearTeamId: teamId,
            linearStateId: { notIn: overriddenStateIds },
        },
    })

    // Upsert each mapping
    await Promise.all(
        mappings.map(m =>
            prisma.uatStateMapping.upsert({
                where: {
                    workspaceId_linearTeamId_linearStateId: {
                        workspaceId: admin.workspaceId,
                        linearTeamId: teamId,
                        linearStateId: m.stateId,
                    },
                },
                create: {
                    workspaceId: admin.workspaceId,
                    linearTeamId: teamId,
                    linearStateId: m.stateId,
                    linearStateName: m.stateName,
                    uatColumn: m.uatColumn,
                },
                update: {
                    linearStateName: m.stateName,
                    uatColumn: m.uatColumn,
                },
            })
        )
    )

    revalidatePath("/settings/portal")
}

/**
 * Reset all custom UAT state mappings for a team back to auto-detect.
 */
export async function resetUATStateMappings(teamId: string): Promise<void> {
    const admin = await requireAdmin()

    const team = await prisma.linearTeam.findFirst({
        where: { id: teamId, workspaceId: admin.workspaceId },
    })
    if (!team) throw new Error("Linear team not found in this workspace")

    await prisma.uatStateMapping.deleteMany({
        where: { workspaceId: admin.workspaceId, linearTeamId: teamId },
    })

    revalidatePath("/settings/portal")
}

// ─── UAT State Mapping (granular CRUD) ─────────────────────────────────────

/**
 * Returns all Linear workflow states for a team merged with their current UAT column mapping.
 * uatColumn: undefined = no DB record (use heuristic); null = explicitly hidden; string = column id
 */
export async function getUatStateMappings(linearTeamId: string): Promise<Array<{
    stateId: string
    stateName: string
    stateType: string
    stateColor: string
    uatColumn: string | null | undefined
    heuristicColumn: string | null
}>> {
    const admin = await requireAdmin()
    const user = await getSessionUser()

    const team = await prisma.linearTeam.findFirst({
        where: { id: linearTeamId, workspaceId: admin.workspaceId },
    })
    if (!team) throw new Error("Linear team not found in this workspace")

    const genql = await getAdminLinearClient(user.id)
    if (!genql) redirect("/settings/integrations")

    const [statesData, existingMappings] = await Promise.all([
        genql.query({
            workflowStates: {
                __args: { filter: { team: { id: { eq: linearTeamId } } } },
                nodes: { id: true, name: true, type: true, color: true, position: true },
            },
        }),
        prisma.uatStateMapping.findMany({
            where: { workspaceId: admin.workspaceId, linearTeamId },
        }),
    ])

    const [mappingByStateId, wsTypeMapping] = [
        new Map(existingMappings.map(m => [m.linearStateId, m.uatColumn])),
        await getWorkspaceStateTypeMapping(admin.workspaceId),
    ]
    const states = statesData.workflowStates?.nodes ?? []

    return states
        .filter(s => s.id)
        .map(s => ({
            stateId: s.id!,
            stateName: s.name ?? "",
            stateType: s.type ?? "",
            stateColor: s.color ?? "#6b7280",
            uatColumn: mappingByStateId.has(s.id!)
                ? (mappingByStateId.get(s.id!) as string | null)
                : undefined,
            heuristicColumn: mapStateToUATColumn({ name: s.name ?? "", type: s.type ?? "" }, wsTypeMapping),
        }))
        .sort((a, b) => {
            const posA = states.find(s => s.id === a.stateId)?.position ?? 0
            const posB = states.find(s => s.id === b.stateId)?.position ?? 0
            return posA - posB || a.stateName.localeCompare(b.stateName)
        })
}

/**
 * Upsert a single UAT state mapping. uatColumn: null = explicitly hidden.
 */
export async function updateUatStateMapping(
    linearTeamId: string,
    linearStateId: string,
    linearStateName: string,
    uatColumn: string | null,
): Promise<void> {
    const admin = await requireAdmin()

    await prisma.uatStateMapping.upsert({
        where: {
            workspaceId_linearTeamId_linearStateId: {
                workspaceId: admin.workspaceId,
                linearTeamId,
                linearStateId,
            },
        },
        create: {
            workspaceId: admin.workspaceId,
            linearTeamId,
            linearStateId,
            linearStateName,
            uatColumn,
        },
        update: { linearStateName, uatColumn },
    })

    revalidatePath("/settings/portal")
}

/**
 * Remove a single UAT state mapping (reverts that state to heuristic detection).
 */
export async function deleteUatStateMapping(linearTeamId: string, linearStateId: string): Promise<void> {
    const admin = await requireAdmin()

    await prisma.uatStateMapping.deleteMany({
        where: { workspaceId: admin.workspaceId, linearTeamId, linearStateId },
    })

    revalidatePath("/settings/portal")
}

/**
 * Re-run heuristic for all states and upsert mappings (auto-detect / bulk reset).
 */
export async function autoDetectStateMappings(linearTeamId: string): Promise<void> {
    const admin = await requireAdmin()
    const user = await getSessionUser()

    const team = await prisma.linearTeam.findFirst({
        where: { id: linearTeamId, workspaceId: admin.workspaceId },
    })
    if (!team) throw new Error("Linear team not found in this workspace")

    const genql = await getAdminLinearClient(user.id)
    if (!genql) redirect("/settings/integrations")

    const statesData = await genql.query({
        workflowStates: {
            __args: { filter: { team: { id: { eq: linearTeamId } } } },
            nodes: { id: true, name: true, type: true, color: true, position: true },
        },
    })

    const [states, wsTypeMapping] = [
        (statesData.workflowStates?.nodes ?? []).filter(s => s.id),
        await getWorkspaceStateTypeMapping(admin.workspaceId),
    ]

    await Promise.all(
        states.map(s =>
            prisma.uatStateMapping.upsert({
                where: {
                    workspaceId_linearTeamId_linearStateId: {
                        workspaceId: admin.workspaceId,
                        linearTeamId,
                        linearStateId: s.id!,
                    },
                },
                create: {
                    workspaceId: admin.workspaceId,
                    linearTeamId,
                    linearStateId: s.id!,
                    linearStateName: s.name ?? "",
                    uatColumn: mapStateToUATColumn({ name: s.name ?? "", type: s.type ?? "" }, wsTypeMapping),
                },
                update: {
                    linearStateName: s.name ?? "",
                    uatColumn: mapStateToUATColumn({ name: s.name ?? "", type: s.type ?? "" }, wsTypeMapping),
                },
            })
        )
    )

    revalidatePath("/settings/portal")
}

/**
 * Create a new portal user with email + password, linking them to a client.
 * Used by admins to provision client contacts without sending invite emails.
 */
export async function createPortalUserWithPassword(
    clientId: string,
    email: string,
    name: string,
    password: string,
) {
    const admin = await requireAdmin()

    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    // Check if user already exists
    const existing = await prisma.user.findFirst({
        where: { email: email.toLowerCase().trim() },
    })
    if (existing) {
        // Just upsert the portal profile for the existing user
        await prisma.portalProfile.upsert({
            where: { userId: existing.id },
            create: { userId: existing.id, clientId, isActive: true },
            update: { clientId, isActive: true },
        })
        revalidatePath(`/clients/${clientId}`)
        return { userId: existing.id, email: existing.email, name: existing.name ?? name }
    }

    // Validate password strength before creating account
    const { valid, errors } = validatePassword(password)
    if (!valid) throw new Error(`Password does not meet requirements: ${errors.join(", ")}`)

    // Create new user via Better-Auth
    const result = await auth.api.signUpEmail({
        body: { email: email.toLowerCase().trim(), name, password },
    })
    if (!result?.user) throw new Error("Failed to create user account")

    // Mark email as verified so portal users can sign in without email verification flow
    await prisma.user.update({
        where: { id: result.user.id },
        data: { emailVerified: true },
    })

    await prisma.portalProfile.upsert({
        where: { userId: result.user.id },
        create: { userId: result.user.id, clientId, isActive: true },
        update: { clientId, isActive: true },
    })

    revalidatePath(`/clients/${clientId}`)
    return { userId: result.user.id, email: result.user.email, name: result.user.name ?? name }
}

// ─── Allowed Transitions ──────────────────────────────────────────────────

/**
 * Update the allowed client transitions for a specific team within a client.
 * Pass null to clear (revert to defaults).
 */
export async function updateTeamAllowedTransitions(
    clientId: string,
    teamId: string,
    transitions: AllowedTransitions | null,
) {
    const admin = await requireAdmin()

    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
        select: { id: true },
    })
    if (!client) throw new Error("Client not found")

    await prisma.clientTeamSettings.upsert({
        where: { clientId_linearTeamId: { clientId, linearTeamId: teamId } },
        create: { clientId, linearTeamId: teamId, allowedTransitions: transitions as Prisma.InputJsonValue },
        update: { allowedTransitions: transitions as Prisma.InputJsonValue },
    })

    revalidateTag(TRANSITIONS_CACHE_TAG(teamId), "hours")
    revalidatePath("/settings/portal")
}

/**
 * Update the explicit Linear state IDs for Approve and Reject actions on a specific team.
 * Pass null for a field to clear it (revert to heuristic lookup).
 */
export async function updateTeamActionStates(
    clientId: string,
    teamId: string,
    approveStateId: string | null,
    rejectStateId: string | null,
) {
    const admin = await requireAdmin()

    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
        select: { id: true },
    })
    if (!client) throw new Error("Client not found")

    await prisma.clientTeamSettings.upsert({
        where: { clientId_linearTeamId: { clientId, linearTeamId: teamId } },
        create: { clientId, linearTeamId: teamId, approveStateId, rejectStateId },
        update: { approveStateId, rejectStateId },
    })

    revalidateTag(ACTION_STATES_CACHE_TAG(teamId), "hours")
    revalidatePath("/settings/portal")
}

/**
 * Update the staff-allowed transitions for a specific client + Linear team.
 * Pass null to reset to workspace default (all transitions allowed).
 */
export async function updateTeamStaffTransitions(
    clientId: string,
    teamId: string,
    transitions: AllowedTransitions | null,
) {
    const admin = await requireAdmin()

    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: admin.workspaceId },
        select: { id: true },
    })
    if (!client) throw new Error("Client not found")

    await prisma.clientTeamSettings.upsert({
        where: { clientId_linearTeamId: { clientId, linearTeamId: teamId } },
        create: { clientId, linearTeamId: teamId, staffAllowedTransitions: transitions as Prisma.InputJsonValue },
        update: { staffAllowedTransitions: transitions as Prisma.InputJsonValue },
    })

    revalidateTag(TRANSITIONS_CACHE_TAG(teamId), "hours")
    revalidatePath("/settings/portal")
}

/**
 * Update the workspace-level default allowed transitions for the UAT portal.
 * Pass null to clear (revert to hard-coded constant).
 */
export async function updateWorkspaceDefaultTransitions(transitions: AllowedTransitions | null) {
    const admin = await requireAdmin()

    await prisma.workspace.update({
        where: { id: admin.workspaceId },
        data: { portalDefaultTransitions: transitions as Prisma.InputJsonValue },
    })

    revalidateTag(WORKSPACE_TRANSITIONS_CACHE_TAG(admin.workspaceId), "hours")
    revalidatePath("/settings/workspace")
}

/**
 * Update the workspace-level default staff transitions for the UAT portal.
 * Pass null to clear (revert to all-open default).
 */
export async function updateWorkspaceStaffDefaultTransitions(transitions: AllowedTransitions | null) {
    const admin = await requireAdmin()

    await prisma.workspace.update({
        where: { id: admin.workspaceId },
        data: { portalStaffDefaultTransitions: transitions as Prisma.InputJsonValue },
    })

    revalidateTag(WORKSPACE_TRANSITIONS_CACHE_TAG(admin.workspaceId), "hours")
    revalidatePath("/settings/workspace")
}

/**
 * Update the workspace-level default state-type → UAT column mapping.
 * Pass null to clear (revert to hard-coded heuristic).
 */
export async function updateWorkspaceDefaultStateTypeMapping(
    mapping: Partial<Record<string, string | null>> | null,
) {
    const admin = await requireAdmin()

    await prisma.workspace.update({
        where: { id: admin.workspaceId },
        data: { portalDefaultStateTypeMapping: mapping as Prisma.InputJsonValue },
    })

    revalidateTag(WORKSPACE_STATE_MAPPING_CACHE_TAG(admin.workspaceId), "hours")
    revalidatePath("/settings/workspace")
}

/**
 * Get current allowed transitions for a team (client + staff). Uses requireAdmin internally.
 * Suitable for calling from client components without needing workspaceId on the client side.
 */
export async function getTeamTransitions(teamId: string): Promise<{
    clientTransitions: AllowedTransitions
    staffTransitions: AllowedTransitions
}> {
    const admin = await requireAdmin()
    const [clientTransitions, staffTransitions] = await Promise.all([
        getTeamAllowedTransitions(admin.workspaceId, teamId),
        getTeamStaffTransitions(admin.workspaceId, teamId),
    ])
    return { clientTransitions, staffTransitions }
}

// ─── Module Label CRUD ───────────────────────────────────────────────────────

async function getAdminLinearWriteClient(userId: string): Promise<LinearClient | null> {
    return getLinearClient(userId)
}

export async function createModuleLabel(teamId: string, name: string, color: string, parentId?: string): Promise<{ id: string; name: string }> {
    const admin = await requireAdmin()
    const user = await getSessionUser()

    const team = await prisma.linearTeam.findFirst({ where: { id: teamId, workspaceId: admin.workspaceId } })
    if (!team) throw new Error("Linear team not found")

    const client = await getAdminLinearWriteClient(user.id)
    if (!client) throw new Error("Linear account not connected")

    const result = await client.createIssueLabel({ teamId, name, color, ...(parentId ? { parentId } : {}) })
    const label = await result.issueLabel
    if (!label) throw new Error("Failed to create label")
    return { id: label.id, name: label.name }
}

export async function updateModuleLabel(labelId: string, name: string, color: string): Promise<void> {
    await requireAdmin()
    const user = await getSessionUser()

    const client = await getAdminLinearWriteClient(user.id)
    if (!client) throw new Error("Linear account not connected")

    await client.updateIssueLabel(labelId, { name, color })
}

export async function deleteModuleLabel(labelId: string): Promise<void> {
    await requireAdmin()
    const user = await getSessionUser()

    const client = await getAdminLinearWriteClient(user.id)
    if (!client) throw new Error("Linear account not connected")

    await client.deleteIssueLabel(labelId)
}

// ─── Acceptance Issue Templates ───────────────────────────────────────────────

import type { AcceptanceIssueField, IssueTemplateType } from "@/lib/portal-acceptance-fields"

export async function listAcceptanceTemplates() {
    const admin = await requireAdmin()
    return prisma.workspaceAcceptanceTemplate.findMany({
        where: { workspaceId: admin.workspaceId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    })
}

export async function createAcceptanceTemplate(name: string, fields: AcceptanceIssueField[], templateType: IssueTemplateType = "acceptance") {
    const admin = await requireAdmin()
    if (!name.trim()) throw new Error("Template name is required")
    if (!fields.length) throw new Error("At least one field is required")

    const existing = await prisma.workspaceAcceptanceTemplate.count({ where: { workspaceId: admin.workspaceId, templateType } })
    const isDefault = existing === 0

    const template = await prisma.workspaceAcceptanceTemplate.create({
        data: { workspaceId: admin.workspaceId, name: name.trim(), fields: fields as object[], isDefault, templateType },
    })
    revalidatePath("/settings/workspace")
    return template
}

export async function updateAcceptanceTemplate(id: string, name: string, fields: AcceptanceIssueField[]) {
    const admin = await requireAdmin()
    if (!name.trim()) throw new Error("Template name is required")
    if (!fields.length) throw new Error("At least one field is required")

    await prisma.workspaceAcceptanceTemplate.updateMany({
        where: { id, workspaceId: admin.workspaceId },
        data: { name: name.trim(), fields: fields as object[] },
    })
    revalidatePath("/settings/workspace")
    revalidatePath("/settings/portal")
}

export async function deleteAcceptanceTemplate(id: string) {
    const admin = await requireAdmin()

    const template = await prisma.workspaceAcceptanceTemplate.findFirst({ where: { id, workspaceId: admin.workspaceId } })
    if (!template) throw new Error("Template not found")

    await prisma.$transaction(async tx => {
        const total = await tx.workspaceAcceptanceTemplate.count({ where: { workspaceId: admin.workspaceId, templateType: template.templateType } })
        if (total <= 1) throw new Error("Cannot delete the only template")

        await tx.workspaceAcceptanceTemplate.delete({ where: { id } })
        if (template.isDefault) {
            const next = await tx.workspaceAcceptanceTemplate.findFirst({
                where: { workspaceId: admin.workspaceId, templateType: template.templateType },
                orderBy: { createdAt: "asc" },
            })
            if (next) await tx.workspaceAcceptanceTemplate.update({ where: { id: next.id }, data: { isDefault: true } })
        }
    })
    revalidatePath("/settings/workspace")
    revalidatePath("/settings/portal")
}

export async function setDefaultTemplate(id: string) {
    const admin = await requireAdmin()

    const template = await prisma.workspaceAcceptanceTemplate.findFirst({ where: { id, workspaceId: admin.workspaceId } })
    if (!template) throw new Error("Template not found")

    await prisma.$transaction([
        prisma.workspaceAcceptanceTemplate.updateMany({ where: { workspaceId: admin.workspaceId, templateType: template.templateType }, data: { isDefault: false } }),
        prisma.workspaceAcceptanceTemplate.update({ where: { id }, data: { isDefault: true } }),
    ])
    revalidatePath("/settings/workspace")
    revalidatePath("/settings/portal")
}

export async function setTeamAcceptanceTemplate(clientId: string, teamId: string, templateId: string | null) {
    const admin = await requireAdmin()

    const client = await prisma.client.findFirst({ where: { id: clientId, workspaceId: admin.workspaceId }, select: { id: true } })
    if (!client) throw new Error("Client not found")

    if (templateId) {
        const tpl = await prisma.workspaceAcceptanceTemplate.findFirst({ where: { id: templateId, workspaceId: admin.workspaceId } })
        if (!tpl) throw new Error("Template not found")
    }

    await prisma.clientTeamSettings.upsert({
        where: { clientId_linearTeamId: { clientId, linearTeamId: teamId } },
        create: { clientId, linearTeamId: teamId, acceptanceTemplateId: templateId },
        update: { acceptanceTemplateId: templateId },
    })
    revalidatePath("/settings/portal")
}

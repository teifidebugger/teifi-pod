import { prisma } from "@/lib/prisma"
import { DEFAULT_CLIENT_TRANSITIONS, DEFAULT_STAFF_TRANSITIONS, type AllowedTransitions, type UATColumn } from "@/lib/uat-mapping"

export type TeamActionStates = {
    approveStateId: string | null
    rejectStateId: string | null
}

export async function getTeamAllowedTransitions(workspaceId: string, teamId: string): Promise<AllowedTransitions> {
    const settings = await prisma.clientTeamSettings.findFirst({
        where: { linearTeamId: teamId, client: { workspaceId } },
        select: { allowedTransitions: true },
    })
    if (settings?.allowedTransitions && typeof settings.allowedTransitions === "object") {
        return settings.allowedTransitions as AllowedTransitions
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { portalDefaultTransitions: true },
    })
    if (workspace?.portalDefaultTransitions && typeof workspace.portalDefaultTransitions === "object") {
        return workspace.portalDefaultTransitions as AllowedTransitions
    }

    return DEFAULT_CLIENT_TRANSITIONS
}

export async function getTeamStaffTransitions(workspaceId: string, teamId: string): Promise<AllowedTransitions> {
    const settings = await prisma.clientTeamSettings.findFirst({
        where: { linearTeamId: teamId, client: { workspaceId } },
        select: { staffAllowedTransitions: true },
    })
    if (settings?.staffAllowedTransitions && typeof settings.staffAllowedTransitions === "object") {
        return settings.staffAllowedTransitions as AllowedTransitions
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { portalStaffDefaultTransitions: true },
    })
    if (workspace?.portalStaffDefaultTransitions && typeof workspace.portalStaffDefaultTransitions === "object") {
        return workspace.portalStaffDefaultTransitions as AllowedTransitions
    }

    return DEFAULT_STAFF_TRANSITIONS
}

export async function getWorkspaceStateTypeMapping(workspaceId: string): Promise<Partial<Record<string, UATColumn | null>>> {
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { portalDefaultStateTypeMapping: true },
    })

    if (workspace?.portalDefaultStateTypeMapping && typeof workspace.portalDefaultStateTypeMapping === "object") {
        return workspace.portalDefaultStateTypeMapping as Partial<Record<string, UATColumn | null>>
    }

    return {}
}

export async function getTeamActionStates(workspaceId: string, teamId: string): Promise<TeamActionStates> {
    const settings = await prisma.clientTeamSettings.findFirst({
        where: { linearTeamId: teamId, client: { workspaceId } },
        select: { approveStateId: true, rejectStateId: true },
    })

    return {
        approveStateId: settings?.approveStateId ?? null,
        rejectStateId: settings?.rejectStateId ?? null,
    }
}

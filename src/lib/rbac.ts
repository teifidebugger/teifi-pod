import { prisma } from "@/lib/prisma"

type ScopeResult = string[] | null

export async function getAccessibleProjectIds(
    memberId: string,
    role: string,
    workspaceId: string
): Promise<ScopeResult> {
    if (["OWNER", "ADMIN"].includes(role)) return null

    if (role === "MANAGER") {
        const [managed, memberships] = await Promise.all([
            prisma.teifiProject.findMany({
                where: { workspaceId, managerId: memberId },
                select: { id: true },
            }),
            prisma.projectMember.findMany({
                where: { memberId },
                select: { projectId: true },
            }),
        ])
        const ids = new Set([
            ...managed.map(p => p.id),
            ...memberships.map(p => p.projectId),
        ])
        return [...ids]
    }

    const memberships = await prisma.projectMember.findMany({
        where: { memberId },
        select: { projectId: true },
    })
    return memberships.map(m => m.projectId)
}

export async function getAccessibleTeamIds(
    memberId: string,
    role: string,
    workspaceId: string
): Promise<ScopeResult> {
    if (["OWNER", "ADMIN"].includes(role)) return null

    const projectIds = await getAccessibleProjectIds(memberId, role, workspaceId)
    if (!projectIds || projectIds.length === 0) return projectIds ?? []

    const projects = await prisma.teifiProject.findMany({
        where: { id: { in: projectIds }, linearTeamId: { not: null } },
        select: { linearTeamId: true },
    })
    return [...new Set(projects.map(p => p.linearTeamId!).filter(Boolean))]
}

export async function getAccessibleClientIds(
    memberId: string,
    role: string,
    workspaceId: string
): Promise<ScopeResult> {
    if (["OWNER", "ADMIN"].includes(role)) return null

    const teamIds = await getAccessibleTeamIds(memberId, role, workspaceId)
    if (!teamIds || teamIds.length === 0) return teamIds ?? []

    const clients = await prisma.client.findMany({
        where: {
            workspaceId,
            linearTeams: { some: { id: { in: teamIds } } },
        },
        select: { id: true },
    })
    return clients.map(c => c.id)
}

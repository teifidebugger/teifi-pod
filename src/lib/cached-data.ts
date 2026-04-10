import { prisma } from "@/lib/prisma"
import { cacheTag, cacheLife } from "next/cache"

/**
 * Cached workspace-scoped data fetchers.
 *
 * These use the `use cache` directive (Next.js 16 Cache Components) to cache
 * data that is workspace-wide and doesn't change per-user-session.
 * Cache is invalidated via revalidateTag() in the corresponding mutation actions.
 *
 * IMPORTANT: No cookies()/headers()/searchParams inside these functions.
 * The workspaceId must be passed as an argument (it becomes part of the cache key automatically).
 */

/** Clients list for dropdowns (id + name only). */
export async function getCachedWorkspaceClients(workspaceId: string) {
    "use cache"
    cacheTag(`workspace-clients-${workspaceId}`)
    cacheLife("minutes")

    return prisma.client.findMany({
        where: { workspaceId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    })
}

/** Workspace role catalog (name only). */
export async function getCachedWorkspaceRoles(workspaceId: string) {
    "use cache"
    cacheTag(`workspace-roles-${workspaceId}`)
    cacheLife("minutes")

    return prisma.workspaceRole.findMany({
        where: { workspaceId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    })
}

/** Active/tentative projects for dropdowns (id, name, color, client name). */
export async function getCachedActiveProjects(workspaceId: string) {
    "use cache"
    cacheTag(`workspace-projects-${workspaceId}`)
    cacheLife("minutes")

    return prisma.teifiProject.findMany({
        where: { workspaceId, status: { in: ["ACTIVE", "TENTATIVE"] } },
        select: {
            id: true,
            name: true,
            color: true,
            status: true,
            client: { select: { name: true } },
        },
        orderBy: { name: "asc" },
    })
}

/** Workspace managers (OWNER/ADMIN/MANAGER) for dropdowns. */
export async function getCachedWorkspaceManagers(workspaceId: string) {
    "use cache"
    cacheTag(`workspace-managers-${workspaceId}`)
    cacheLife("minutes")

    return prisma.workspaceMember.findMany({
        where: {
            workspaceId,
            role: { in: ["OWNER", "ADMIN", "MANAGER"] },
            disabledAt: null,
        },
        select: {
            id: true,
            role: true,
            user: { select: { name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
    })
}

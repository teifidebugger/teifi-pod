"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { cache } from "react"

export const getPortalUser = cache(async (opts?: { teamId?: string }) => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new Error("Not authenticated")

    const profile = await prisma.portalProfile.findFirst({
        where: { userId: session.user.id, isActive: true },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    workspaceId: true,
                    uatLabelIds: true,
                    uatProjectIds: true,
                    linearTeams: { select: { id: true, name: true, key: true } },
                },
            },
        },
    })
    if (profile) {
        return { user: session.user, profile, workspaceId: profile.client.workspaceId, isStaff: false as const }
    }

    // Staff direct access — workspace member without a portal profile
    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { id: true, workspaceId: true, role: true, canEditClients: true },
    })
    if (!member) throw new Error("No portal access")

    let clientIdFilter: { linearTeams: { some: { projects: { some: { projectMembers: { some: { memberId: string } } } } } } } | undefined
    if (!["OWNER", "ADMIN"].includes(member.role)) {
        clientIdFilter = {
            linearTeams: {
                some: {
                    projects: {
                        some: {
                            projectMembers: {
                                some: { memberId: member.id },
                            },
                        },
                    },
                },
            },
        }
    }

    const staffClients = await prisma.client.findMany({
        where: { workspaceId: member.workspaceId, ...clientIdFilter },
        select: {
            id: true,
            name: true,
            uatLabelIds: true,
            uatProjectIds: true,
            linearTeams: { select: { id: true, name: true, key: true } },
        },
        orderBy: { name: "asc" },
    })

    if (staffClients.length === 0) throw new Error("No portal access — no clients linked to your projects")

    const scopedClient = opts?.teamId
        ? (staffClients.find(c => c.linearTeams.some(t => t.id === opts.teamId)) ?? null)
        : null

    if (opts?.teamId && !scopedClient) {
        throw new Error("Access denied: team not accessible")
    }

    const primaryClient = scopedClient ?? staffClients[0]

    return {
        user: session.user,
        profile: {
            id: `staff:${member.id}`,
            userId: session.user.id,
            clientId: primaryClient.id,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            client: {
                ...primaryClient,
                linearTeams: scopedClient
                    ? scopedClient.linearTeams
                    : staffClients.flatMap(c => c.linearTeams),
            },
        },
        workspaceId: member.workspaceId,
        role: member.role,
        isStaff: true as const,
        staffClients,
    }
})

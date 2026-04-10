"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new Error("Not authenticated")
    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
    })
    if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
        throw new Error("Admin access required")
    }
    return { member }
}

export type AnnouncementInput = {
    clientId: string
    type: "info" | "warning" | "system"
    title: string
    body?: string
    buildId?: string
    expiresAt?: string
}

export async function createAnnouncement(data: AnnouncementInput) {
    const { member } = await requireAdmin()
    const client = await prisma.client.findFirst({ where: { id: data.clientId, workspaceId: member.workspaceId } })
    if (!client) throw new Error("Client not found")
    await prisma.portalAnnouncement.create({
        data: {
            clientId: data.clientId,
            type: data.type,
            title: data.title,
            body: data.body ?? null,
            buildId: data.buildId ?? null,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            isActive: true,
        },
    })
    revalidatePath(`/clients/${data.clientId}`)
    revalidatePath(`/uat`, "layout")
}

export async function toggleAnnouncement(id: string, isActive: boolean) {
    const { member } = await requireAdmin()
    const announcement = await prisma.portalAnnouncement.findFirst({
        where: { id },
        include: { client: { select: { workspaceId: true, id: true } } },
    })
    if (!announcement || announcement.client.workspaceId !== member.workspaceId) throw new Error("Not found")
    await prisma.portalAnnouncement.update({
        where: { id },
        data: { isActive },
    })
    revalidatePath(`/clients/${announcement.client.id}`)
    revalidatePath(`/uat`, "layout")
}

export async function deleteAnnouncement(id: string) {
    const { member } = await requireAdmin()
    const announcement = await prisma.portalAnnouncement.findFirst({
        where: { id },
        include: { client: { select: { workspaceId: true, id: true } } },
    })
    if (!announcement || announcement.client.workspaceId !== member.workspaceId) throw new Error("Not found")
    await prisma.portalAnnouncement.delete({ where: { id } })
    revalidatePath(`/clients/${announcement.client.id}`)
    revalidatePath(`/uat`, "layout")
}

export async function getActiveAnnouncements(clientId: string) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new Error("Not authenticated")
    const now = new Date()
    return prisma.portalAnnouncement.findMany({
        where: {
            clientId,
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: { createdAt: "desc" },
    })
}

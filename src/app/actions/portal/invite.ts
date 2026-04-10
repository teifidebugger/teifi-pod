"use server"

import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { sendWorkspaceEmail } from "@/lib/email"

async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new Error("Not authenticated")
    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
    })
    if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
        throw new Error("Admin access required")
    }
    return { member, user: session.user }
}

export async function invitePortalUser(email: string, clientId: string): Promise<{ token: string }> {
    const { user, member } = await requireAdmin()

    // Verify client exists in admin's workspace
    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: member.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7-day expiry

    const invite = await prisma.portalInvite.create({
        data: {
            email: email.toLowerCase().trim(),
            clientId,
            createdById: user.id,
            expiresAt,
        },
    })

    // Send invite email (fire-and-forget)
    const workspace = await prisma.workspace.findUnique({
        where: { id: member.workspaceId },
        select: { name: true },
    })
    const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
    after(() => sendWorkspaceEmail(member.workspaceId, {
        type: "portal-invite",
        recipientEmail: email.toLowerCase().trim(),
        clientName: client.name,
        workspaceName: workspace?.name ?? "Teifi",
        inviteUrl: `${appUrl}/invite/portal/${invite.token}`,
    }).catch(err => console.error("[email] portal-invite failed:", err)))

    revalidatePath(`/clients/${clientId}`)
    return { token: invite.token }
}

export async function getPortalInvitesForClient(clientId: string) {
    const { member } = await requireAdmin()

    // Verify client belongs to admin's workspace
    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId: member.workspaceId },
    })
    if (!client) throw new Error("Client not found")

    return prisma.portalInvite.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
    })
}

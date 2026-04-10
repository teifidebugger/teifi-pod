"use server"

import { getSessionMember } from "@/app/actions"
import { prisma } from "@/lib/prisma"
import { revalidatePath, revalidateTag } from "next/cache"

/**
 * Ensures the current user is at least an Admin or Manager (depending on what's required).
 * By default, OWNER, ADMIN, MANAGER can manage clients.
 */
async function requireAdminOrManager() {
    const { member } = await getSessionMember()

    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) {
        throw new Error("Insufficient permissions")
    }

    if (member.role === "MANAGER" && !member.canEditClients) {
        throw new Error("Insufficient permissions — client management is not enabled for your account")
    }

    return { workspaceId: member.workspaceId }
}

export async function createClient(formData: FormData) {
    const { workspaceId } = await requireAdminOrManager()

    const name = formData.get("name") as string
    const email = formData.get("email") as string | null
    const website = formData.get("website") as string | null

    if (!name) throw new Error("Client name is required")

    await prisma.client.create({
        data: {
            name,
            email: email || null,
            website: website || null,
            workspaceId,
        },
    })

    revalidateTag(`workspace-clients-${workspaceId}`, "minutes")
    revalidatePath("/clients")
    revalidatePath("/projects")
}

export async function updateClient(formData: FormData) {
    const { workspaceId } = await requireAdminOrManager()

    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const email = formData.get("email") as string | null
    const website = formData.get("website") as string | null

    if (!id || !name) throw new Error("Client ID and name are required")

    // Verify it belongs to the workspace
    const client = await prisma.client.findFirst({
        where: { id, workspaceId },
    })
    if (!client) throw new Error("Client not found")

    await prisma.client.update({
        where: { id },
        data: {
            name,
            email: email || null,
            website: website || null,
        },
    })

    revalidateTag(`workspace-clients-${workspaceId}`, "minutes")
    revalidatePath("/clients")
    revalidatePath("/projects")
}

export async function archiveClient(id: string) {
    const { workspaceId } = await requireAdminOrManager()

    const client = await prisma.client.findFirst({ where: { id, workspaceId } })
    if (!client) throw new Error("Client not found")

    await prisma.client.update({ where: { id }, data: { archivedAt: new Date() } })

    revalidateTag(`workspace-clients-${workspaceId}`, "minutes")
    revalidatePath("/clients")
    revalidatePath(`/clients/${id}`)
}

export async function unarchiveClient(id: string) {
    const { workspaceId } = await requireAdminOrManager()

    const client = await prisma.client.findFirst({ where: { id, workspaceId } })
    if (!client) throw new Error("Client not found")

    await prisma.client.update({ where: { id }, data: { archivedAt: null } })

    revalidateTag(`workspace-clients-${workspaceId}`, "minutes")
    revalidatePath("/clients")
    revalidatePath(`/clients/${id}`)
}

export async function deleteClient(formData: FormData) {
    const { workspaceId } = await requireAdminOrManager()
    const id = formData.get("id") as string

    if (!id) throw new Error("Client ID is required")

    // Verify client belongs to workspace
    const client = await prisma.client.findFirst({
        where: { id, workspaceId },
        include: { _count: { select: { projects: true } } }
    })
    if (!client) throw new Error("Client not found")

    // If there are projects, we shouldn't hard delete. 
    // The user should archive or delete the projects first.
    if (client._count.projects > 0) {
        throw new Error("Cannot delete client because it has active projects. Please reassign or delete the projects first.")
    }

    await prisma.client.delete({
        where: { id },
    })

    revalidateTag(`workspace-clients-${workspaceId}`, "minutes")
    revalidatePath("/clients")
    revalidatePath("/projects")
}

export async function createClientContact(
    clientId: string,
    data: {
        firstName: string
        lastName?: string
        title?: string
        email?: string
        phone?: string
    }
) {
    const { workspaceId } = await requireAdminOrManager()

    if (!data.firstName) throw new Error("First name is required")

    // Verify client belongs to workspace
    const client = await prisma.client.findFirst({
        where: { id: clientId, workspaceId },
    })
    if (!client) throw new Error("Client not found")

    await prisma.clientContact.create({
        data: {
            clientId,
            firstName: data.firstName,
            lastName: data.lastName || null,
            title: data.title || null,
            email: data.email || null,
            phone: data.phone || null,
        },
    })

    revalidatePath(`/clients/${clientId}`, "page")
    revalidatePath("/clients")
}

export async function updateClientContact(
    id: string,
    data: {
        firstName?: string
        lastName?: string
        title?: string
        email?: string
        phone?: string
    }
) {
    const { workspaceId } = await requireAdminOrManager()

    // Verify contact belongs to a client in this workspace
    const contact = await prisma.clientContact.findFirst({
        where: { id, client: { workspaceId } },
    })
    if (!contact) throw new Error("Contact not found")

    await prisma.clientContact.update({
        where: { id },
        data: {
            ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
            ...(data.lastName !== undefined ? { lastName: data.lastName || null } : {}),
            ...(data.title !== undefined ? { title: data.title || null } : {}),
            ...(data.email !== undefined ? { email: data.email || null } : {}),
            ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        },
    })

    revalidatePath(`/clients/${contact.clientId}`, "page")
    revalidatePath("/clients")
}

export async function deleteClientContact(id: string) {
    const { workspaceId } = await requireAdminOrManager()

    // Verify contact belongs to a client in this workspace
    const contact = await prisma.clientContact.findFirst({
        where: { id, client: { workspaceId } },
    })
    if (!contact) throw new Error("Contact not found")

    await prisma.clientContact.delete({ where: { id } })

    revalidatePath(`/clients/${contact.clientId}`, "page")
    revalidatePath("/clients")
}

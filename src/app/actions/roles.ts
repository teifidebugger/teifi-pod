"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember } from "@/app/actions"
import { revalidatePath } from "next/cache"

const ALLOWED_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const

async function getCallerMember() {
    const { member } = await getSessionMember()
    return member
}

function assertManagerOrAbove(role: string) {
    if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
        throw new Error("Insufficient permissions: Manager role or above required")
    }
}

export async function createWorkspaceRole(name: string): Promise<void> {
    const caller = await getCallerMember()
    assertManagerOrAbove(caller.role)

    const trimmed = name.trim()
    if (!trimmed) throw new Error("Role name is required")

    // Check for duplicate
    const existing = await prisma.workspaceRole.findUnique({
        where: { name_workspaceId: { name: trimmed, workspaceId: caller.workspaceId } },
    })
    if (existing) throw new Error(`Role "${trimmed}" already exists`)

    await prisma.workspaceRole.create({
        data: { name: trimmed, workspaceId: caller.workspaceId },
    })

    revalidatePath("/schedule/roles")
    revalidatePath("/schedule/placeholders")
    revalidatePath("/team")
}

export async function deleteWorkspaceRole(id: string): Promise<void> {
    const caller = await getCallerMember()
    assertManagerOrAbove(caller.role)

    const role = await prisma.workspaceRole.findFirst({
        where: { id, workspaceId: caller.workspaceId },
    })
    if (!role) throw new Error("Role not found")

    const roleName = role.name

    // Remove role from all members' roles arrays
    const membersWithRole = await prisma.workspaceMember.findMany({
        where: { workspaceId: caller.workspaceId, roles: { has: roleName } },
        select: { id: true, roles: true },
    })

    // Remove role from all placeholders' roles arrays
    const placeholdersWithRole = await prisma.placeholder.findMany({
        where: { workspaceId: caller.workspaceId, roles: { has: roleName } },
        select: { id: true, roles: true },
    })

    await prisma.$transaction(async (tx) => {
        await Promise.all([
            ...membersWithRole.map((m) =>
                tx.workspaceMember.update({
                    where: { id: m.id },
                    data: { roles: m.roles.filter((r) => r !== roleName) },
                })
            ),
            ...placeholdersWithRole.map((p) =>
                tx.placeholder.update({
                    where: { id: p.id },
                    data: { roles: p.roles.filter((r) => r !== roleName) },
                })
            ),
        ])

        // Delete the role catalog entry
        await tx.workspaceRole.delete({ where: { id } })
    })

    revalidatePath("/schedule/roles")
    revalidatePath("/schedule/placeholders")
    revalidatePath("/team")
    revalidatePath("/schedule")
}

export async function updateMemberRoles(memberId: string, roles: string[]): Promise<void> {
    const caller = await getCallerMember()

    // OWNER/ADMIN/MANAGER can update anyone; member can update self
    const isManagerOrAbove = ALLOWED_ROLES.includes(caller.role as (typeof ALLOWED_ROLES)[number])
    const isSelf = caller.id === memberId

    if (!isManagerOrAbove && !isSelf) {
        throw new Error("Insufficient permissions")
    }

    // Verify target member is in same workspace
    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!target) throw new Error("Member not found in workspace")

    await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { roles: roles.map((r) => r.trim()).filter(Boolean) },
    })

    revalidatePath("/team")
    revalidatePath("/schedule")
}

export async function convertPlaceholderToMember(
    placeholderId: string,
    memberId: string
): Promise<void> {
    const caller = await getCallerMember()
    assertManagerOrAbove(caller.role)

    // Verify placeholder in caller's workspace
    const placeholder = await prisma.placeholder.findFirst({
        where: { id: placeholderId, workspaceId: caller.workspaceId },
        select: { id: true, roles: true },
    })
    if (!placeholder) throw new Error("Placeholder not found in workspace")

    // Verify member in caller's workspace
    const member = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
        select: { id: true, roles: true },
    })
    if (!member) throw new Error("Member not found in workspace")

    // Merge placeholder roles into member roles
    const mergedRoles = [...new Set([...member.roles, ...placeholder.roles])]
    await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { roles: mergedRoles },
    })

    // Reassign all placeholder allocations to the member
    await prisma.allocation.updateMany({
        where: { placeholderId },
        data: { memberId, placeholderId: null },
    })

    // Archive the placeholder
    await prisma.placeholder.update({
        where: { id: placeholderId },
        data: { archivedAt: new Date() },
    })

    revalidatePath("/schedule")
    revalidatePath("/schedule/placeholders")
}

"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember } from "@/app/actions"
import { revalidatePath } from "next/cache"

const ALLOWED_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const

async function getCallerMember() {
    const { member } = await getSessionMember()
    if (!ALLOWED_ROLES.includes(member.role as (typeof ALLOWED_ROLES)[number])) {
        throw new Error("Insufficient permissions: Manager role or above required")
    }
    return member
}

export async function createPlaceholder(data: {
    name: string
    roles: string[]
    weeklyCapacityHours?: number
}): Promise<void> {
    const caller = await getCallerMember()

    if (!data.name.trim()) throw new Error("Name is required")

    await prisma.placeholder.create({
        data: {
            name: data.name.trim(),
            roles: data.roles.filter((r) => r.trim()),
            weeklyCapacityHours: data.weeklyCapacityHours ?? 40,
            workspaceId: caller.workspaceId,
        },
    })

    revalidatePath("/schedule")
    revalidatePath("/schedule/placeholders")
}

export async function updatePlaceholder(
    id: string,
    data: Partial<{
        name: string
        roles: string[]
        weeklyCapacityHours: number
    }>
): Promise<void> {
    const caller = await getCallerMember()

    const existing = await prisma.placeholder.findFirst({
        where: { id, workspaceId: caller.workspaceId },
    })
    if (!existing) throw new Error("Placeholder not found")

    await prisma.placeholder.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name.trim() }),
            ...(data.roles !== undefined && { roles: data.roles.filter((r) => r.trim()) }),
            ...(data.weeklyCapacityHours !== undefined && { weeklyCapacityHours: data.weeklyCapacityHours }),
        },
    })

    revalidatePath("/schedule")
    revalidatePath("/schedule/placeholders")
}

export async function archivePlaceholder(id: string): Promise<void> {
    const caller = await getCallerMember()

    const existing = await prisma.placeholder.findFirst({
        where: { id, workspaceId: caller.workspaceId },
    })
    if (!existing) throw new Error("Placeholder not found")

    await prisma.placeholder.update({
        where: { id },
        data: { archivedAt: new Date() },
    })

    revalidatePath("/schedule")
    revalidatePath("/schedule/placeholders")
}

export async function restorePlaceholder(id: string): Promise<void> {
    const caller = await getCallerMember()

    const existing = await prisma.placeholder.findFirst({
        where: { id, workspaceId: caller.workspaceId },
    })
    if (!existing) throw new Error("Placeholder not found")

    await prisma.placeholder.update({
        where: { id },
        data: { archivedAt: null },
    })

    revalidatePath("/schedule")
    revalidatePath("/schedule/placeholders")
}

export async function deletePlaceholder(id: string): Promise<void> {
    const caller = await getCallerMember()

    const existing = await prisma.placeholder.findFirst({
        where: { id, workspaceId: caller.workspaceId },
    })
    if (!existing) throw new Error("Placeholder not found")

    await prisma.placeholder.delete({ where: { id } })

    revalidatePath("/schedule")
    revalidatePath("/schedule/placeholders")
}

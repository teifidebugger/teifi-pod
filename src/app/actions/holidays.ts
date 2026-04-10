"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember } from "@/app/actions"
import { revalidatePath } from "next/cache"

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const

async function getCallerMember() {
    const { user, member } = await getSessionMember()
    return { ...member, userId: user.id }
}

// ─── Workspace Holidays ──────────────────────────────────────────────────────

export async function createWorkspaceHoliday(data: { name: string; date: string }) {
    const caller = await getCallerMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) {
        throw new Error("Insufficient permissions: Admin role or above required")
    }

    if (!data.name || !data.date) throw new Error("Name and date are required")

    const existing = await prisma.workspaceHoliday.findFirst({
        where: { date: data.date, workspaceId: caller.workspaceId },
    })
    if (existing) throw new Error("A holiday already exists for this date")

    await prisma.workspaceHoliday.create({
        data: {
            name: data.name,
            date: data.date,
            workspaceId: caller.workspaceId,
        },
    })

    revalidatePath("/schedule")
    revalidatePath("/schedule/holidays")
}

export async function deleteWorkspaceHoliday(id: string) {
    const caller = await getCallerMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) {
        throw new Error("Insufficient permissions: Admin role or above required")
    }

    const holiday = await prisma.workspaceHoliday.findFirst({
        where: { id, workspaceId: caller.workspaceId },
    })
    if (!holiday) throw new Error("Holiday not found")

    await prisma.workspaceHoliday.delete({ where: { id } })

    revalidatePath("/schedule")
    revalidatePath("/schedule/holidays")
}

// ─── Member Time-Off ─────────────────────────────────────────────────────────

export async function createMemberTimeOff(data: {
    memberId: string
    date: string
    reason?: string
}) {
    const caller = await getCallerMember()

    if (!data.memberId || !data.date) throw new Error("Member and date are required")

    // OWNER/ADMIN/MANAGER can add for anyone; members can add for themselves only
    const isManager = MANAGE_ROLES.includes(caller.role as (typeof MANAGE_ROLES)[number])
    if (!isManager && caller.id !== data.memberId) {
        throw new Error("You can only add time-off for yourself")
    }

    // Verify target member is in same workspace
    const targetMember = await prisma.workspaceMember.findFirst({
        where: { id: data.memberId, workspaceId: caller.workspaceId },
    })
    if (!targetMember) throw new Error("Member not found in workspace")

    const existingTimeOff = await prisma.memberTimeOff.findFirst({
        where: { memberId: data.memberId, date: data.date },
    })
    if (existingTimeOff) return // silently ignore duplicate

    await prisma.memberTimeOff.create({
        data: {
            memberId: data.memberId,
            date: data.date,
            reason: data.reason || null,
            workspaceId: caller.workspaceId,
        },
    })

    revalidatePath("/schedule")
    revalidatePath("/schedule/holidays")
}

export async function deleteMemberTimeOff(id: string) {
    const caller = await getCallerMember()

    const timeOff = await prisma.memberTimeOff.findFirst({
        where: { id, workspaceId: caller.workspaceId },
    })
    if (!timeOff) throw new Error("Time-off entry not found")

    // OWNER/ADMIN/MANAGER can delete any; members can delete their own only
    const isManager = MANAGE_ROLES.includes(caller.role as (typeof MANAGE_ROLES)[number])
    if (!isManager && caller.id !== timeOff.memberId) {
        throw new Error("You can only remove your own time-off")
    }

    await prisma.memberTimeOff.delete({ where: { id } })

    revalidatePath("/schedule")
    revalidatePath("/schedule/holidays")
}

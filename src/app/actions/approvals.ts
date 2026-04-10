"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember } from "@/app/actions"
import { revalidatePath } from "next/cache"
import { format, endOfWeek, parseISO } from "date-fns"

async function getApprover() {
    const { user, member } = await getSessionMember()
    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) {
        throw new Error("Only Owners, Admins, and Managers can approve time entries")
    }
    return { user, member }
}

/**
 * Approve all PENDING entries for a specific member in a week.
 * Cannot approve own entries. MANAGER can only approve direct reports.
 */
export async function approveWeekForMember(
    targetUserId: string,
    weekStart: string,
    weekEnd: string,
): Promise<number> {
    const { user, member } = await getApprover()

    if (targetUserId === user.id && member.role === "MANAGER") throw new Error("Cannot approve your own time entries")

    if (member.role === "MANAGER") {
        const directReport = await prisma.workspaceMember.findFirst({
            where: { userId: targetUserId, managerId: member.id, workspaceId: member.workspaceId },
        })
        if (!directReport) throw new Error("Member not found in direct reports")
    }

    const result = await prisma.timeEntry.updateMany({
        where: {
            userId: targetUserId,
            project: { workspaceId: member.workspaceId },
            approvalStatus: "PENDING",
            timerStartedAt: null,
            date: { gte: weekStart, lte: weekEnd },
        },
        data: {
            approvalStatus: "APPROVED",
            approvedById: user.id,
            approvedAt: new Date(),
            isLocked: true,
            lockedReason: "Approved",
        },
    })

    // Auto-approve the submitted timesheet week if it exists
    await prisma.timesheetWeek.updateMany({
        where: { userId: targetUserId, workspaceId: member.workspaceId, weekStart, status: "SUBMITTED" },
        data: { status: "APPROVED", reviewedAt: new Date(), reviewedById: user.id },
    })

    revalidatePath("/time/approvals")
    return result.count
}

/**
 * Approve all PENDING entries for a specific project in a week.
 * MANAGER can only approve direct reports. Own entries excluded.
 */
export async function approveWeekForProject(
    projectId: string,
    weekStart: string,
    weekEnd: string,
): Promise<number> {
    const { user, member } = await getApprover()

    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: member.workspaceId },
    })
    if (!project) throw new Error("Project not found")

    let userIdFilter: string[] | undefined
    if (member.role === "MANAGER") {
        const reports = await prisma.workspaceMember.findMany({
            where: { managerId: member.id, workspaceId: member.workspaceId },
            select: { userId: true },
        })
        userIdFilter = reports.map(r => r.userId).filter(id => id !== user.id)
    }

    const result = await prisma.timeEntry.updateMany({
        where: {
            projectId,
            project: { workspaceId: member.workspaceId },
            approvalStatus: "PENDING",
            timerStartedAt: null,
            date: { gte: weekStart, lte: weekEnd },
            userId: userIdFilter
                ? { in: userIdFilter }
                : { not: user.id },
        },
        data: {
            approvalStatus: "APPROVED",
            approvedById: user.id,
            approvedAt: new Date(),
            isLocked: true,
            lockedReason: "Approved",
        },
    })

    // Auto-approve submitted timesheet weeks for affected members
    await prisma.timesheetWeek.updateMany({
        where: {
            workspaceId: member.workspaceId,
            weekStart,
            status: "SUBMITTED",
            userId: userIdFilter ? { in: userIdFilter } : { not: user.id },
        },
        data: { status: "APPROVED", reviewedAt: new Date(), reviewedById: user.id },
    })

    revalidatePath("/time/approvals")
    return result.count
}

/**
 * Approve all PENDING entries for a specific client (or "no client") in a week.
 */
export async function approveWeekForClient(
    clientId: string | null,
    weekStart: string,
    weekEnd: string,
): Promise<number> {
    const { user, member } = await getApprover()

    let userIdFilter: string[] | undefined
    if (member.role === "MANAGER") {
        const reports = await prisma.workspaceMember.findMany({
            where: { managerId: member.id, workspaceId: member.workspaceId },
            select: { userId: true },
        })
        userIdFilter = reports.map(r => r.userId).filter(id => id !== user.id)
    }

    const result = await prisma.timeEntry.updateMany({
        where: {
            project: {
                workspaceId: member.workspaceId,
                ...(clientId ? { clientId } : { clientId: null }),
            },
            approvalStatus: "PENDING",
            timerStartedAt: null,
            date: { gte: weekStart, lte: weekEnd },
            userId: userIdFilter
                ? { in: userIdFilter }
                : { not: user.id },
        },
        data: {
            approvalStatus: "APPROVED",
            approvedById: user.id,
            approvedAt: new Date(),
            isLocked: true,
            lockedReason: "Approved",
        },
    })

    // Auto-approve submitted timesheet weeks for affected members
    await prisma.timesheetWeek.updateMany({
        where: {
            workspaceId: member.workspaceId,
            weekStart,
            status: "SUBMITTED",
            userId: userIdFilter ? { in: userIdFilter } : { not: user.id },
        },
        data: { status: "APPROVED", reviewedAt: new Date(), reviewedById: user.id },
    })

    revalidatePath("/time/approvals")
    return result.count
}

/**
 * Bulk-approve all visible PENDING entries for the week.
 * Respects MANAGER scoping (direct reports only). Never approves own entries.
 */
export async function bulkApproveVisible(
    weekStart: string,
    weekEnd: string,
): Promise<number> {
    const { user, member } = await getApprover()

    let userIdWhere: { not: string } | { in: string[] }
    if (member.role === "MANAGER") {
        const reports = await prisma.workspaceMember.findMany({
            where: { managerId: member.id, workspaceId: member.workspaceId },
            select: { userId: true },
        })
        userIdWhere = { in: reports.map(r => r.userId).filter(id => id !== user.id) }
    } else {
        userIdWhere = { not: user.id }
    }

    const result = await prisma.timeEntry.updateMany({
        where: {
            project: { workspaceId: member.workspaceId },
            approvalStatus: "PENDING",
            timerStartedAt: null,
            date: { gte: weekStart, lte: weekEnd },
            userId: userIdWhere,
        },
        data: {
            approvalStatus: "APPROVED",
            approvedById: user.id,
            approvedAt: new Date(),
            isLocked: true,
            lockedReason: "Approved",
        },
    })

    // Auto-approve submitted timesheet weeks for all affected members
    await prisma.timesheetWeek.updateMany({
        where: {
            workspaceId: member.workspaceId,
            weekStart,
            status: "SUBMITTED",
            userId: userIdWhere,
        },
        data: { status: "APPROVED", reviewedAt: new Date(), reviewedById: user.id },
    })

    revalidatePath("/time/approvals")
    return result.count
}

export async function approveTimeEntry(entryId: string) {
    const { user, member: callerMember } = await getSessionMember()

    const allowedRoles = ["OWNER", "ADMIN", "MANAGER"]
    if (!allowedRoles.includes(callerMember.role)) throw new Error("Only Owners, Admins, and Managers can approve time entries")

    let directReportUserIds: string[] | undefined
    if (callerMember.role === "MANAGER") {
        const reports = await prisma.workspaceMember.findMany({
            where: { managerId: callerMember.id },
            select: { userId: true },
        })
        directReportUserIds = reports.map(r => r.userId)
    }

    const entry = await prisma.timeEntry.findFirst({
        where: {
            id: entryId,
            project: { workspaceId: callerMember.workspaceId },
            ...(directReportUserIds ? { userId: { in: directReportUserIds } } : {}),
        },
    })
    if (!entry) throw new Error("Time entry not found")
    if (entry.userId === user.id && callerMember.role === "MANAGER") throw new Error("Cannot approve your own time entry")

    await prisma.timeEntry.update({
        where: { id: entryId },
        data: { approvalStatus: "APPROVED", approvedById: user.id, approvedAt: new Date(), isLocked: true, lockedReason: "Approved" },
    })

    const submittedWeek = await prisma.timesheetWeek.findFirst({
        where: { userId: entry.userId, workspaceId: callerMember.workspaceId, status: "SUBMITTED" },
    })
    if (submittedWeek) {
        const weekEnd = format(endOfWeek(parseISO(submittedWeek.weekStart), { weekStartsOn: 1 }), "yyyy-MM-dd")
        const pendingCount = await prisma.timeEntry.count({
            where: {
                userId: entry.userId,
                project: { workspaceId: callerMember.workspaceId },
                approvalStatus: "PENDING",
                timerStartedAt: null,
                date: { gte: submittedWeek.weekStart, lte: weekEnd },
            },
        })
        if (pendingCount === 0) {
            await prisma.timesheetWeek.update({
                where: { id: submittedWeek.id },
                data: { status: "APPROVED", reviewedAt: new Date(), reviewedById: user.id },
            })
        }
    }

    revalidatePath("/time/approvals")
    revalidatePath("/time")
}

export async function rejectTimeEntry(entryId: string) {
    const { user, member: callerMember } = await getSessionMember()

    const allowedRoles = ["OWNER", "ADMIN", "MANAGER"]
    if (!allowedRoles.includes(callerMember.role)) throw new Error("Only Owners, Admins, and Managers can reject time entries")

    let directReportUserIds: string[] | undefined
    if (callerMember.role === "MANAGER") {
        const reports = await prisma.workspaceMember.findMany({
            where: { managerId: callerMember.id },
            select: { userId: true },
        })
        directReportUserIds = reports.map(r => r.userId)
    }

    const entry = await prisma.timeEntry.findFirst({
        where: {
            id: entryId,
            project: { workspaceId: callerMember.workspaceId },
            ...(directReportUserIds ? { userId: { in: directReportUserIds } } : {}),
        },
    })
    if (!entry) throw new Error("Time entry not found")
    if (entry.userId === user.id && callerMember.role === "MANAGER") throw new Error("Cannot reject your own time entry")

    if (entry.approvalStatus === "APPROVED" && callerMember.role === "MANAGER" && !callerMember.canWithdrawApprovals) {
        throw new Error("Insufficient permissions — you cannot withdraw an already-approved entry")
    }

    await prisma.timeEntry.update({
        where: { id: entryId },
        data: { approvalStatus: "REJECTED", approvedById: user.id, approvedAt: new Date(), isLocked: false, lockedReason: null },
    })

    revalidatePath("/time/approvals")
    revalidatePath("/time")
}

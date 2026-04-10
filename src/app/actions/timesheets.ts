"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember } from "@/app/actions"
import { revalidatePath } from "next/cache"
import { startOfWeek, endOfWeek, parseISO, format, addDays } from "date-fns"
import { sendWorkspaceEmail } from "@/lib/email"
import { resolveBillingRate } from "@/lib/billing"

// Returns the weekStart and weekEnd date strings for a given weekStart string and weekStartsOn
function getWeekBounds(weekStartStr: string, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
    const anchor = parseISO(weekStartStr)
    const start = startOfWeek(anchor, { weekStartsOn })
    const end = endOfWeek(anchor, { weekStartsOn })
    return { weekStart: format(start, "yyyy-MM-dd"), weekEnd: format(end, "yyyy-MM-dd") }
}

export async function submitWeek(weekStart: string) {
    const { user, member } = await getSessionMember()

    // Block if there's a running timer within the week
    const workspace = await prisma.workspace.findFirst({
        where: { id: member.workspaceId },
        select: { weekStartDay: true },
    })
    const weekStartsOn = (workspace?.weekStartDay ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6
    const { weekStart: weekStartBound, weekEnd } = getWeekBounds(weekStart, weekStartsOn)

    const runningTimer = await prisma.timeEntry.findFirst({
        where: { userId: user.id, timerStartedAt: { not: null }, date: { gte: weekStartBound, lte: weekEnd } },
    })
    if (runningTimer) throw new Error("Stop your running timer before submitting the week.")

    const entryCount = await prisma.timeEntry.count({
        where: {
            userId: user.id,
            project: { workspaceId: member.workspaceId },
            date: { gte: weekStartBound, lte: weekEnd },
            timerStartedAt: null,
        },
    })
    if (entryCount === 0) throw new Error("No time entries to submit for this week.")

    await prisma.timesheetWeek.upsert({
        where: { userId_workspaceId_weekStart: { userId: user.id, workspaceId: member.workspaceId, weekStart } },
        update: { status: "SUBMITTED", submittedAt: new Date(), reviewNote: null, reviewedAt: null, reviewedById: null },
        create: { userId: user.id, workspaceId: member.workspaceId, weekStart, status: "SUBMITTED", submittedAt: new Date() },
    })

    revalidatePath("/time")
    revalidatePath("/time/approvals")
}

export async function retractWeek(weekStart: string) {
    const { user, member } = await getSessionMember()

    const week = await prisma.timesheetWeek.findUnique({
        where: { userId_workspaceId_weekStart: { userId: user.id, workspaceId: member.workspaceId, weekStart } },
    })
    if (!week) throw new Error("Timesheet week not found")
    if (week.status !== "SUBMITTED") throw new Error("Only submitted weeks can be retracted.")

    await prisma.timesheetWeek.update({
        where: { id: week.id },
        data: { status: "OPEN", submittedAt: null },
    })

    revalidatePath("/time")
    revalidatePath("/time/approvals")
}

export async function approveWeek(timesheetWeekId: string) {
    const { user, member: callerMember } = await getSessionMember()
    if (!["OWNER", "ADMIN", "MANAGER"].includes(callerMember.role)) throw new Error("Only Owners, Admins, and Managers can approve timesheets")

    const week = await prisma.timesheetWeek.findFirst({
        where: { id: timesheetWeekId, workspaceId: callerMember.workspaceId },
        include: { workspace: { select: { weekStartDay: true } } },
    })
    if (!week) throw new Error("Timesheet week not found")
    if (week.userId === user.id && callerMember.role === "MANAGER") throw new Error("Cannot approve your own timesheet")

    // MANAGER: only approve direct reports
    if (callerMember.role === "MANAGER") {
        const reports = await prisma.workspaceMember.findMany({
            where: { managerId: callerMember.id, workspaceId: callerMember.workspaceId },
            select: { userId: true },
        })
        const reportIds = reports.map(r => r.userId)
        if (!reportIds.includes(week.userId)) throw new Error("Insufficient permissions — not a direct report")
    }

    const weekStartsOn = (week.workspace.weekStartDay ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6
    const { weekStart: ws, weekEnd: we } = getWeekBounds(week.weekStart, weekStartsOn)

    await prisma.$transaction([
        prisma.timesheetWeek.update({
            where: { id: timesheetWeekId },
            data: { status: "APPROVED", reviewedAt: new Date(), reviewedById: user.id },
        }),
        prisma.timeEntry.updateMany({
            where: {
                userId: week.userId,
                project: { workspaceId: callerMember.workspaceId },
                date: { gte: ws, lte: we },
                timerStartedAt: null,
            },
            data: { approvalStatus: "APPROVED", approvedById: user.id, approvedAt: new Date(), isLocked: true, lockedReason: "Week approved" },
        }),
    ])

    // Send approval notification email (fire-and-forget)
    const [targetMember, approver] = await Promise.all([
        prisma.workspaceMember.findFirst({
            where: { userId: week.userId, workspaceId: callerMember.workspaceId },
            select: { user: { select: { email: true, name: true } } },
        }),
        prisma.workspaceMember.findFirst({
            where: { userId: user.id, workspaceId: callerMember.workspaceId },
            select: { user: { select: { name: true } } },
        }),
    ])
    if (targetMember?.user.email) {
        const weekEnd = addDays(new Date(week.weekStart), 6)
        const weekOf = `${format(new Date(week.weekStart), "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`
        sendWorkspaceEmail(callerMember.workspaceId, {
            type: "timesheet-approved",
            recipientEmail: targetMember.user.email,
            recipientName: targetMember.user.name ?? targetMember.user.email,
            weekOf,
            approverName: approver?.user.name ?? "Your manager",
            appUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
        }).catch(err => console.error("[email] timesheet-approved failed:", err))
    }

    revalidatePath("/time/approvals")
    revalidatePath("/time")
}

export async function rejectWeek(timesheetWeekId: string, note?: string) {
    const { user, member: callerMember } = await getSessionMember()
    if (!["OWNER", "ADMIN", "MANAGER"].includes(callerMember.role)) throw new Error("Only Owners, Admins, and Managers can reject timesheets")

    const week = await prisma.timesheetWeek.findFirst({
        where: { id: timesheetWeekId, workspaceId: callerMember.workspaceId },
        include: { workspace: { select: { weekStartDay: true } } },
    })
    if (!week) throw new Error("Timesheet week not found")
    if (week.userId === user.id && callerMember.role === "MANAGER") throw new Error("Cannot reject your own timesheet")

    if (callerMember.role === "MANAGER") {
        const reports = await prisma.workspaceMember.findMany({
            where: { managerId: callerMember.id, workspaceId: callerMember.workspaceId },
            select: { userId: true },
        })
        const reportIds = reports.map(r => r.userId)
        if (!reportIds.includes(week.userId)) throw new Error("Insufficient permissions — not a direct report")
    }

    const weekStartsOn = (week.workspace.weekStartDay ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6
    const { weekStart: ws, weekEnd: we } = getWeekBounds(week.weekStart, weekStartsOn)

    await prisma.$transaction([
        prisma.timesheetWeek.update({
            where: { id: timesheetWeekId },
            data: { status: "REJECTED", reviewedAt: new Date(), reviewedById: user.id, reviewNote: note ?? null },
        }),
        prisma.timeEntry.updateMany({
            where: {
                userId: week.userId,
                project: { workspaceId: callerMember.workspaceId },
                date: { gte: ws, lte: we },
                timerStartedAt: null,
            },
            data: { isLocked: false, lockedReason: null },
        }),
    ])

    // Send rejection notification email (fire-and-forget)
    const [rejectTarget, rejecter] = await Promise.all([
        prisma.workspaceMember.findFirst({
            where: { userId: week.userId, workspaceId: callerMember.workspaceId },
            select: { user: { select: { email: true, name: true } } },
        }),
        prisma.workspaceMember.findFirst({
            where: { userId: user.id, workspaceId: callerMember.workspaceId },
            select: { user: { select: { name: true } } },
        }),
    ])
    if (rejectTarget?.user.email) {
        const weekEnd = addDays(new Date(week.weekStart), 6)
        const weekOf = `${format(new Date(week.weekStart), "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`
        sendWorkspaceEmail(callerMember.workspaceId, {
            type: "timesheet-rejected",
            recipientEmail: rejectTarget.user.email,
            recipientName: rejectTarget.user.name ?? rejectTarget.user.email,
            weekOf,
            approverName: rejecter?.user.name ?? "Your manager",
            reason: note,
            appUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
        }).catch(err => console.error("[email] timesheet-rejected failed:", err))
    }

    revalidatePath("/time/approvals")
    revalidatePath("/time")
}

export async function upsertWeekEntry(data: {
    projectId: string
    taskId: string | null
    date: string     // yyyy-MM-dd
    hours: number
    weekStart: string
}) {
    const { user, member } = await getSessionMember()

    // Block if week is submitted or approved
    const existingWeek = await prisma.timesheetWeek.findUnique({
        where: { userId_workspaceId_weekStart: { userId: user.id, workspaceId: member.workspaceId, weekStart: data.weekStart } },
    })
    if (existingWeek && (existingWeek.status === "SUBMITTED" || existingWeek.status === "APPROVED")) {
        throw new Error("Cannot edit a submitted or approved timesheet week.")
    }

    const workspace = await prisma.workspace.findFirst({
        where: { id: member.workspaceId },
        select: { requireTimeEntryNotes: true, timeRounding: true },
    })

    const project = await prisma.teifiProject.findFirst({
        where: { id: data.projectId, workspaceId: member.workspaceId },
        select: { id: true, status: true, billingType: true, billBy: true, hourlyRateCents: true },
    })
    if (!project) throw new Error("Project not found")
    if (project.status === "ARCHIVED") throw new Error("Cannot log time to an archived project")

    let durationSeconds = Math.round(data.hours * 3600)
    if (workspace?.timeRounding && workspace.timeRounding > 0 && durationSeconds > 0) {
        const roundToSeconds = workspace.timeRounding * 60
        durationSeconds = Math.ceil(durationSeconds / roundToSeconds) * roundToSeconds
    }

    // Billing resolution
    const task = data.taskId
        ? await prisma.teifiTask.findUnique({ where: { id: data.taskId }, select: { id: true, isBillable: true, hourlyRateCents: true } })
        : await prisma.teifiTask.findFirst({ where: { projectId: data.projectId }, select: { id: true, isBillable: true, hourlyRateCents: true } })

    const userRecord = await prisma.user.findUnique({ where: { id: user.id }, select: { costRateCents: true, defaultBillableCents: true } })
    const pm = await prisma.projectMember.findFirst({ where: { projectId: project.id, memberId: member.id }, select: { billableRateCents: true } })
    const { isBillable, billableRateCents } = resolveBillingRate({
        project,
        task,
        projectMember: pm,
        userDefaultBillableCents: userRecord?.defaultBillableCents ?? 0,
    })

    const taskId = task?.id ?? null

    // Find existing entry for this project+task+date
    const existing = await prisma.timeEntry.findFirst({
        where: {
            userId: user.id,
            projectId: data.projectId,
            taskId: taskId,
            date: data.date,
            timerStartedAt: null,
        },
        orderBy: { date: "asc" },
    })

    if (existing) {
        if (durationSeconds === 0) {
            await prisma.timeEntry.delete({ where: { id: existing.id } })
        } else {
            await prisma.timeEntry.update({
                where: { id: existing.id },
                data: { date: data.date, durationSeconds, isBillable, billableRateCents },
            })
        }
    } else if (durationSeconds > 0) {
        await prisma.timeEntry.create({
            data: {
                userId: user.id,
                projectId: data.projectId,
                taskId,
                date: data.date,
                durationSeconds,
                isBillable,
                billableRateCents,
                costRateCents: userRecord?.costRateCents ?? 0,
            },
        })
    }

    revalidatePath("/time")
}

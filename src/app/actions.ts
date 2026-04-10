"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { startOfWeek, endOfWeek, parseISO, format } from "date-fns"
import { resolveBillingRate } from "@/lib/billing"

/**
 * Get the current authenticated user's ID from the session.
 * Throws if not logged in — middleware should prevent this, but safety first.
 */
export async function getSessionUser() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new Error("Unauthorized")
    return session.user
}

/**
 * Gets the current session user AND their workspace member record.
 * Throws if not authenticated or not a workspace member.
 * The member is returned with ALL fields (no select narrowing) so callers
 * can access any column without additional lookups.
 */
export async function getSessionMember() {
    const user = await getSessionUser()
    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
    })
    if (!member) throw new Error("User has no workspace")
    return { user, member }
}

/**
 * Upsert a LinearIssue record so TeifiTask.linearIssueId FK is satisfied.
 * Called before auto-creating a TeifiTask linked to a Linear issue.
 */
async function ensureLinearIssueCached(params: {
    id: string
    identifier: string
    title: string
    state: string
    url: string
    teamId: string
}) {
    if (!params.id || !params.teamId) return
    await prisma.linearIssue.upsert({
        where: { id: params.id },
        update: { title: params.title, state: params.state, syncedAt: new Date() },
        create: {
            id: params.id,
            identifier: params.identifier || params.id,
            title: params.title || params.id,
            state: params.state || "Unknown",
            url: params.url || "",
            teamId: params.teamId,
            priority: 0,
        },
    })
}

export async function createClient(formData: FormData) {
    const name = formData.get("name") as string
    if (!name) return

    const { member } = await getSessionMember()

    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) throw new Error("Only Owners, Admins, and Managers can create clients")

    await prisma.client.create({
        data: { name, workspaceId: member.workspaceId }
    })

    revalidatePath("/clients")
    revalidatePath("/projects")
}

export async function createProject(formData: FormData) {
    const name = formData.get("name") as string
    const clientId = formData.get("clientId") as string

    if (!name || !clientId) return

    const { member } = await getSessionMember()
    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) throw new Error("Only Owners, Admins, and Managers can create projects")

    // Verify client belongs to this workspace
    const client = await prisma.client.findFirst({ where: { id: clientId, workspaceId: member.workspaceId } })
    if (!client) throw new Error("Client not found")

    const project = await prisma.teifiProject.create({
        data: { name, clientId, workspaceId: member.workspaceId }
    })

    // Create a default task so time can be logged immediately
    await prisma.teifiTask.create({
        data: { name: "General", projectId: project.id }
    })

    revalidatePath("/projects")
    revalidatePath("/time")
    revalidatePath("/schedule")
}

export async function logTime(formData: FormData) {
    const projectId = formData.get("projectId") as string
    const description = formData.get("description") as string
    const dateStr = formData.get("date") as string
    const durationHoursStr = formData.get("durationHours") as string | null
    // Also support start/end time inputs for backwards compatibility
    const startStr = formData.get("startTime") as string | null
    const endStr = formData.get("endTime") as string | null
    // Optional — only present for users with Linear connected
    const linearIssueId = formData.get("linearIssueId") as string | null
    const linearIssueTitle = formData.get("linearIssueTitle") as string | null
    const linearIssueIdentifier = formData.get("linearIssueIdentifier") as string | null
    const linearIssueUrl = formData.get("linearIssueUrl") as string | null
    const linearIssueState = formData.get("linearIssueState") as string | null
    const linearIssueTeamId = formData.get("linearIssueTeamId") as string | null
    const energyLevel = formData.get("energyLevel") ? Number(formData.get("energyLevel")) : null

    if (!projectId || !dateStr || (!durationHoursStr && (!startStr || !endStr)))
        throw new Error("Project, date, and duration are required")

    const { user, member } = await getSessionMember()
    const project = await prisma.teifiProject.findFirst({
        where: {
            id: projectId,
            workspace: { members: { some: { userId: user.id } } }
        },
        select: {
            id: true,
            status: true,
            billingType: true,
            billBy: true,
            hourlyRateCents: true,
        },
    })
    if (!project) throw new Error("Project not found or you don't have access to it")
    if (project.status === "ARCHIVED") throw new Error("Cannot log time to an archived project")
    if (project.status === "TENTATIVE") throw new Error("Cannot log time against a pipeline project")

    // Fetch workspace settings for notes requirement and time rounding
    const workspace = await prisma.workspace.findFirst({
        where: { id: member.workspaceId },
        select: { requireTimeEntryNotes: true, timeRounding: true },
    })
    if (workspace?.requireTimeEntryNotes && !description?.trim()) {
        throw new Error("A time entry note is required in this workspace. Please add a description.")
    }

    // Find or auto-create a task linked to the Linear issue
    let taskId: string | undefined
    let task: { id: string; isBillable: boolean; hourlyRateCents: number | null } | null = null
    if (linearIssueId) {
        // Ensure LinearIssue exists in our cache FIRST (to satisfy FK constraint on TeifiTask)
        if (linearIssueIdentifier && linearIssueTeamId) {
            await prisma.linearIssue.upsert({
                where: { id: linearIssueId },
                update: {
                    title: linearIssueTitle ?? "Unknown Issue",
                    state: linearIssueState ?? "Unknown",
                    url: linearIssueUrl ?? "",
                    teamId: linearIssueTeamId,
                    syncedAt: new Date(),
                },
                create: {
                    id: linearIssueId,
                    identifier: linearIssueIdentifier,
                    title: linearIssueTitle ?? "Unknown Issue",
                    state: linearIssueState ?? "Unknown",
                    url: linearIssueUrl ?? "",
                    teamId: linearIssueTeamId,
                },
            })
        }

        let existingTask = await prisma.teifiTask.findFirst({
            where: { projectId, linearIssueId },
            select: { id: true, isBillable: true, hourlyRateCents: true },
        })
        if (!existingTask) {
            // Auto-create task from the Linear issue title
            existingTask = await prisma.teifiTask.create({
                data: {
                    name: linearIssueTitle ?? linearIssueId,
                    projectId,
                    linearIssueId,
                },
                select: { id: true, isBillable: true, hourlyRateCents: true },
            })
        }
        task = existingTask
        taskId = existingTask.id
    } else {
        const fallbackTask = await prisma.teifiTask.findFirst({
            where: { projectId },
            select: { id: true, isBillable: true, hourlyRateCents: true },
        })
        task = fallbackTask
        taskId = fallbackTask?.id
    }

    let durationSeconds: number
    if (durationHoursStr) {
        const durationHours = parseFloat(durationHoursStr)
        if (isNaN(durationHours) || durationHours <= 0) throw new Error("Duration must be a positive number (e.g. 1.5 for 1 hour 30 minutes)")
        durationSeconds = Math.round(durationHours * 3600)
    } else {
        const start = new Date(`${dateStr}T${startStr}:00`)
        const end = new Date(`${dateStr}T${endStr}:00`)
        durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
        if (durationSeconds <= 0) throw new Error("End time must be after start time")
    }

    // Apply time rounding (manual entry)
    if (workspace?.timeRounding && workspace.timeRounding > 0 && durationSeconds) {
        const roundToSeconds = workspace.timeRounding * 60
        durationSeconds = Math.ceil(durationSeconds / roundToSeconds) * roundToSeconds
    }

    const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { costRateCents: true, defaultBillableCents: true },
    })

    const pm = await prisma.projectMember.findFirst({
        where: { projectId: project.id, memberId: member.id },
        select: { billableRateCents: true },
    })
    const { isBillable, billableRateCents } = resolveBillingRate({
        project,
        task,
        projectMember: pm,
        userDefaultBillableCents: userRecord?.defaultBillableCents ?? 0,
    })

    await prisma.timeEntry.create({
        data: {
            userId: user.id,
            projectId,
            taskId,
            date: dateStr,
            durationSeconds,
            description,
            isBillable,
            billableRateCents,
            costRateCents: userRecord?.costRateCents ?? 0,
            energyLevel: energyLevel !== null && !isNaN(energyLevel) ? energyLevel : null,
        }
    })

    revalidatePath("/time")
    revalidatePath("/schedule")
}

export async function startTimer(formData: FormData) {
    const projectId = formData.get("projectId") as string
    const description = formData.get("description") as string
    // Optional — only present for users with Linear connected
    const linearIssueId = formData.get("linearIssueId") as string | null
    const linearIssueTitle = formData.get("linearIssueTitle") as string | null
    const linearIssueIdentifier = formData.get("linearIssueIdentifier") as string | null
    const linearIssueUrl = formData.get("linearIssueUrl") as string | null
    const linearIssueState = formData.get("linearIssueState") as string | null
    const linearIssueTeamId = formData.get("linearIssueTeamId") as string | null
    const energyLevel = formData.get("energyLevel") ? Number(formData.get("energyLevel")) : null

    if (!projectId) throw new Error("Project is required to start a timer")

    const { user, member } = await getSessionMember()

    const project = await prisma.teifiProject.findFirst({
        where: {
            id: projectId,
            workspace: { members: { some: { userId: user.id } } }
        },
        select: {
            id: true,
            status: true,
            billingType: true,
            billBy: true,
            hourlyRateCents: true,
        },
    })
    if (!project) throw new Error("Project not found or you don't have access to it")
    if (project.status === "ARCHIVED") throw new Error("Cannot log time to an archived project")
    if (project.status === "TENTATIVE") throw new Error("Cannot log time against a pipeline project")

    // Enforce workspace preferences
    const wsSettings = await prisma.workspace.findFirst({
        where: { id: member.workspaceId },
        select: { requireTimeEntryNotes: true, timeRounding: true },
    })
    if (wsSettings?.requireTimeEntryNotes && !description?.trim()) {
        throw new Error("A time entry note is required in this workspace. Please add a description.")
    }

    // Find or auto-create a task linked to the Linear issue
    let taskId: string | undefined
    let task: { id: string; isBillable: boolean; hourlyRateCents: number | null } | null = null
    if (linearIssueId) {
        // Ensure LinearIssue exists in our cache FIRST (to satisfy FK constraint on TeifiTask)
        if (linearIssueIdentifier && linearIssueTeamId) {
            await prisma.linearIssue.upsert({
                where: { id: linearIssueId },
                update: {
                    title: linearIssueTitle ?? "Unknown Issue",
                    state: linearIssueState ?? "Unknown",
                    url: linearIssueUrl ?? "",
                    teamId: linearIssueTeamId,
                    syncedAt: new Date(),
                },
                create: {
                    id: linearIssueId,
                    identifier: linearIssueIdentifier,
                    title: linearIssueTitle ?? "Unknown Issue",
                    state: linearIssueState ?? "Unknown",
                    url: linearIssueUrl ?? "",
                    teamId: linearIssueTeamId,
                },
            })
        }

        let linkedTask = await prisma.teifiTask.findFirst({
            where: { projectId, linearIssueId },
            select: { id: true, isBillable: true, hourlyRateCents: true },
        })
        if (!linkedTask) {
            // Auto-create task from the Linear issue title (Harvest-style)
            linkedTask = await prisma.teifiTask.create({
                data: {
                    name: linearIssueTitle ?? linearIssueId,
                    projectId,
                    linearIssueId,
                },
                select: { id: true, isBillable: true, hourlyRateCents: true },
            })
        }
        task = linkedTask
        taskId = linkedTask.id
    }
    if (!taskId) {
        const fallbackTask = await prisma.teifiTask.findFirst({
            where: { projectId },
            select: { id: true, isBillable: true, hourlyRateCents: true },
        })
        task = fallbackTask
        taskId = fallbackTask?.id
    }

    const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { costRateCents: true, defaultBillableCents: true },
    })

    const pm = await prisma.projectMember.findFirst({
        where: { projectId: project.id, memberId: member.id },
        select: { billableRateCents: true },
    })
    const { isBillable, billableRateCents } = resolveBillingRate({
        project,
        task,
        projectMember: pm,
        userDefaultBillableCents: userRecord?.defaultBillableCents ?? 0,
    })

    // Stop any existing running timer and start the new one atomically
    const now = new Date()
    await prisma.$transaction(async (tx) => {
        const existingTimer = await tx.timeEntry.findFirst({
            where: { userId: user.id, timerStartedAt: { not: null } },
            select: { id: true, timerStartedAt: true },
        })
        if (existingTimer) {
            const rawElapsed = Math.max(0, Math.floor((now.getTime() - existingTimer.timerStartedAt!.getTime()) / 1000))
            const roundTo = (wsSettings?.timeRounding ?? 0) * 60
            const elapsed = roundTo > 0 ? Math.ceil(rawElapsed / roundTo) * roundTo : rawElapsed
            await tx.timeEntry.update({
                where: { id: existingTimer.id },
                data: { timerStartedAt: null, durationSeconds: elapsed },
            })
        }
        await tx.timeEntry.create({
            data: {
                userId: user.id,
                projectId,
                taskId,
                date: format(now, "yyyy-MM-dd"),
                timerStartedAt: now,
                durationSeconds: 0,
                description,
                isBillable,
                billableRateCents,
                costRateCents: userRecord?.costRateCents ?? 0,
                energyLevel: energyLevel !== null && !isNaN(energyLevel) ? energyLevel : null,
            },
        })
    })

    revalidatePath("/time")
    revalidatePath("/schedule")
}

export async function stopTimer(entryId: string) {
    const { user, member } = await getSessionMember()


    const entry = await prisma.timeEntry.findFirst({
        where: { id: entryId, userId: user.id, timerStartedAt: { not: null }, project: { workspaceId: member.workspaceId } },
    })
    if (!entry) throw new Error("Active timer not found")
    const workspace = await prisma.workspace.findFirst({
        where: { id: member.workspaceId },
        select: { timeRounding: true },
    })

    const now = new Date()
    const rawDuration = Math.floor((now.getTime() - entry.timerStartedAt!.getTime()) / 1000)
    const roundTo = (workspace?.timeRounding ?? 0) * 60
    const durationSeconds = roundTo > 0 ? Math.ceil(rawDuration / roundTo) * roundTo : rawDuration

    await prisma.timeEntry.update({
        where: { id: entryId },
        data: { timerStartedAt: null, durationSeconds },
    })

    revalidatePath("/time")
    revalidatePath("/")
    revalidatePath("/schedule")
}

export async function deleteTimeEntry(entryId: string) {
    const { user, member } = await getSessionMember()

    const canEditOthers =
        ["OWNER", "ADMIN"].includes(member.role) ||
        (member.role === "MANAGER" && member.canEditOthersTime)

    const entry = await prisma.timeEntry.findFirst({
        where: {
            id: entryId,
            project: { workspaceId: member.workspaceId },
            ...(!canEditOthers ? { userId: user.id } : {}),
        },
        select: { id: true, isLocked: true, approvalStatus: true, date: true, userId: true },
    })
    if (!entry) throw new Error("Time entry not found or unauthorized")
    if (entry.isLocked) throw new Error("This time entry is locked and cannot be deleted.")
    if (entry.approvalStatus === "APPROVED" && !["OWNER", "ADMIN"].includes(member.role)) {
        throw new Error("This time entry has been approved and cannot be deleted.")
    }

    // Block deletion if the entry's week is submitted or approved
    const workspace = await prisma.workspace.findFirst({
        where: { id: member.workspaceId },
        select: { weekStartDay: true },
    })
    const weekStartsOn = (workspace?.weekStartDay ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6
    const weekStartStr = format(startOfWeek(parseISO(entry.date), { weekStartsOn }), "yyyy-MM-dd")
    const timesheetWeek = await prisma.timesheetWeek.findUnique({
        where: { userId_workspaceId_weekStart: { userId: entry.userId, workspaceId: member.workspaceId, weekStart: weekStartStr } },
    })
    if (timesheetWeek && (timesheetWeek.status === "SUBMITTED" || timesheetWeek.status === "APPROVED")) {
        throw new Error("Cannot delete entries from a submitted or approved week.")
    }

    await prisma.timeEntry.delete({ where: { id: entryId } })

    revalidatePath("/time")
    revalidatePath("/")
    revalidatePath("/schedule")
}

// ─── TEAM MANAGEMENT ──────────────────────────────────────────────────────────

export async function changeRole(memberId: string, newRole: string) {
    const validRoles = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "CONTRACTOR"]
    if (!validRoles.includes(newRole)) throw new Error(`Invalid role "${newRole}". Must be one of: ${validRoles.join(", ")}`)

    const { member: callerMember } = await getSessionMember()

    const allowedRoles = ["OWNER", "ADMIN"]
    if (!allowedRoles.includes(callerMember.role)) throw new Error("Only Owners and Admins can change member roles")

    if (callerMember.id === memberId) throw new Error("Cannot change your own role")

    // Target must be in the same workspace
    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: callerMember.workspaceId },
    })
    if (!target) throw new Error("Member not found")

    // Cannot demote OWNER or promote to OWNER
    if (target.role === "OWNER") throw new Error("Cannot change the role of an Owner")
    if (newRole === "OWNER") throw new Error("Cannot promote to Owner — use a dedicated ownership transfer flow")

    // Clear manager-only permission flags when demoting away from MANAGER
    const permissionClear = newRole !== "MANAGER"
        ? {
            canManageProjects: false,
            canEditOthersTime: false,
            canSeeRates: false,
            canEditClients: false,
            canWithdrawApprovals: false,
        }
        : {}

    await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { role: newRole as import("@prisma/client").Role, ...permissionClear },
    })

    revalidatePath("/team")
}

export async function removeMember(memberId: string) {
    const { member: callerMember } = await getSessionMember()

    const allowedRoles = ["OWNER", "ADMIN"]
    if (!allowedRoles.includes(callerMember.role)) throw new Error("Only Owners and Admins can remove workspace members")

    // Cannot remove self
    if (callerMember.id === memberId) throw new Error("Cannot remove yourself")

    // Target must be in the same workspace
    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: callerMember.workspaceId },
    })
    if (!target) throw new Error("Member not found")
    if (target.role === "OWNER") throw new Error("Cannot remove the workspace owner")

    await prisma.teifiProject.updateMany({
        where: { managerId: memberId, workspaceId: target.workspaceId },
        data: { managerId: null },
    })

    await prisma.workspaceMember.delete({ where: { id: memberId } })

    revalidatePath("/team")
}

// ─── TIMESHEET APPROVALS ──────────────────────────────────────────────────────

export async function approveTimeEntry(entryId: string) {
    const { user, member: callerMember } = await getSessionMember()

    const allowedRoles = ["OWNER", "ADMIN", "MANAGER"]
    if (!allowedRoles.includes(callerMember.role)) throw new Error("Only Owners, Admins, and Managers can approve time entries")

    // MANAGERs can only approve entries from their direct reports
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
        data: {
            approvalStatus: "APPROVED",
            approvedById: user.id,
            approvedAt: new Date(),
            isLocked: true,
            lockedReason: "Approved",
        },
    })

    // Auto-approve the submitted TimesheetWeek if no pending entries remain in that week
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

    // MANAGERs can only reject entries from their direct reports
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

    // Withdrawing an already-APPROVED entry requires canWithdrawApprovals for MANAGERs
    if (
        entry.approvalStatus === "APPROVED" &&
        callerMember.role === "MANAGER" &&
        !callerMember.canWithdrawApprovals
    ) {
        throw new Error("Insufficient permissions — you cannot withdraw an already-approved entry")
    }

    await prisma.timeEntry.update({
        where: { id: entryId },
        data: {
            approvalStatus: "REJECTED",
            approvedById: user.id,
            approvedAt: new Date(),
            isLocked: false,
            lockedReason: null,
        },
    })

    revalidatePath("/time/approvals")
    revalidatePath("/time")
}

export async function updateTimeEntry(
    entryId: string,
    data: {
        description: string
        date: string          // yyyy-MM-dd
        durationHours: number // decimal hours
        projectId: string
        isBillable: boolean
    }
): Promise<void> {
    const { user, member } = await getSessionMember()

    const canEditOthers =
        ["OWNER", "ADMIN"].includes(member.role) ||
        (member.role === "MANAGER" && member.canEditOthersTime)

    const entry = await prisma.timeEntry.findFirst({
        where: {
            id: entryId,
            project: { workspaceId: member.workspaceId },
            ...(!canEditOthers ? { userId: user.id } : {}),
        },
    })
    if (!entry) throw new Error("Time entry not found or unauthorized")
    if (entry.isLocked) throw new Error("This time entry is locked and cannot be edited.")
    if (entry.approvalStatus === "APPROVED" && !["OWNER", "ADMIN"].includes(member.role)) {
        throw new Error("This time entry has been approved and cannot be edited.")
    }

    // Block edit if the entry's week is submitted or approved
    const wsForEntry = await prisma.workspace.findFirst({
        where: { id: member.workspaceId },
        select: { weekStartDay: true, requireTimeEntryNotes: true },
    })
    const wsWeekStartsOn = (wsForEntry?.weekStartDay ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6
    const entryWeekStartStr = format(startOfWeek(parseISO(entry.date), { weekStartsOn: wsWeekStartsOn }), "yyyy-MM-dd")
    const entryTimesheetWeek = await prisma.timesheetWeek.findUnique({
        where: { userId_workspaceId_weekStart: { userId: entry.userId, workspaceId: member.workspaceId, weekStart: entryWeekStartStr } },
    })
    if (entryTimesheetWeek && (entryTimesheetWeek.status === "SUBMITTED" || entryTimesheetWeek.status === "APPROVED")) {
        throw new Error("Cannot edit entries in a submitted or approved week.")
    }

    if (wsForEntry?.requireTimeEntryNotes && data.description !== undefined && !data.description?.trim()) {
        throw new Error("A time entry note is required in this workspace.")
    }

    if (data.durationHours <= 0) throw new Error("Duration must be greater than zero")
    const durationSeconds = Math.round(data.durationHours * 3600)

    // Verify project belongs to workspace
    const project = await prisma.teifiProject.findFirst({
        where: { id: data.projectId, workspaceId: member.workspaceId },
        select: { id: true, status: true, billingType: true, billBy: true, hourlyRateCents: true },
    })
    if (!project) throw new Error("Project not found")
    if (project.status === "ARCHIVED") throw new Error("Cannot move time entry to an archived project")
    if (project.status === "TENTATIVE") throw new Error("Cannot move time entry to a pipeline project")

    // Re-derive isBillable server-side (client value overridden if project is non-billable)
    let isBillable = data.isBillable
    if (project.billingType === "NON_BILLABLE" || project.billBy === "none") isBillable = false

    // Re-derive billableRateCents when project changes
    let billableRateCents = entry.billableRateCents
    if (data.projectId !== entry.projectId) {
        billableRateCents = 0
        if (isBillable) {
            switch (project.billBy) {
                case "Project":
                    billableRateCents = project.hourlyRateCents ?? 0
                    break
                case "Tasks": {
                    const task = entry.taskId
                        ? await prisma.teifiTask.findUnique({
                              where: { id: entry.taskId },
                              select: { hourlyRateCents: true },
                          })
                        : null
                    billableRateCents = task?.hourlyRateCents ?? project.hourlyRateCents ?? 0
                    break
                }
                case "People":
                default: {
                    const userRecord = await prisma.user.findUnique({
                        where: { id: entry.userId },
                        select: { defaultBillableCents: true },
                    })
                    const entryOwnerMember = await prisma.workspaceMember.findFirst({
                        where: { userId: entry.userId, workspaceId: member.workspaceId },
                        select: { id: true },
                    })
                    const pm = entryOwnerMember
                        ? await prisma.projectMember.findFirst({
                              where: { projectId: data.projectId, memberId: entryOwnerMember.id },
                              select: { billableRateCents: true },
                          })
                        : null
                    billableRateCents = pm?.billableRateCents ?? userRecord?.defaultBillableCents ?? 0
                    break
                }
            }
        }
    }

    // Collect changed fields for audit history
    const changedFields: Array<{ field: string; old: string; new: string }> = []
    if (data.description !== (entry.description ?? ""))
        changedFields.push({ field: "description", old: entry.description ?? "", new: data.description ?? "" })
    if (data.date !== entry.date)
        changedFields.push({ field: "date", old: entry.date, new: data.date })
    if (durationSeconds !== entry.durationSeconds)
        changedFields.push({ field: "durationSeconds", old: String(entry.durationSeconds), new: String(durationSeconds) })
    if (data.projectId !== entry.projectId)
        changedFields.push({ field: "projectId", old: entry.projectId, new: data.projectId })
    if (data.isBillable !== entry.isBillable)
        changedFields.push({ field: "isBillable", old: String(entry.isBillable), new: String(data.isBillable) })

    await prisma.timeEntry.update({
        where: { id: entryId },
        data: {
            description: data.description,
            date: data.date,
            durationSeconds,
            projectId: data.projectId,
            isBillable,
            billableRateCents,
        },
    })

    // Write audit history records for each changed field
    if (changedFields.length > 0) {
        await prisma.timeEntryHistory.createMany({
            data: changedFields.map((change) => ({
                timeEntryId: entryId,
                changedById: user.id,
                action: "UPDATE",
                fieldName: change.field,
                oldValue: change.old,
                newValue: change.new,
            })),
        })
    }

    revalidatePath("/time")
    revalidatePath("/time/audit")
    revalidatePath("/")
    revalidatePath("/schedule")
}

export async function updateWorkspaceSettings(data: {
    name?: string
    currency?: string
    timeFormat?: string
    weekStartDay?: number
    requireTimeEntryNotes?: boolean
    timeRounding?: number
    defaultCapacityHours?: number
    timerMode?: string
    reminderEnabled?: boolean
    reminderTime?: string
    reminderDays?: string
    energyTrackingEnabled?: boolean
}) {
    const { member } = await getSessionMember()

    const allowedRoles = ["OWNER", "ADMIN"]
    if (!allowedRoles.includes(member.role)) throw new Error("Only Owners and Admins can update workspace settings")

    if (data.timeRounding !== undefined && ![0, 6, 15, 30].includes(data.timeRounding)) {
        throw new Error("Invalid time rounding interval")
    }
    if (data.weekStartDay !== undefined && ![0, 1].includes(data.weekStartDay)) {
        throw new Error("Invalid week start day")
    }
    if (data.reminderTime !== undefined && data.reminderTime !== "" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.reminderTime)) {
        throw new Error("reminderTime must be in HH:MM 24-hour format")
    }

    await prisma.workspace.update({
        where: { id: member.workspaceId },
        data: {
            ...(data.name ? { name: data.name } : {}),
            ...(data.currency ? { currency: data.currency } : {}),
            ...(data.timeFormat ? { timeFormat: data.timeFormat } : {}),
            ...(data.weekStartDay !== undefined ? { weekStartDay: data.weekStartDay } : {}),
            ...(data.requireTimeEntryNotes !== undefined ? { requireTimeEntryNotes: data.requireTimeEntryNotes } : {}),
            ...(data.timeRounding !== undefined ? { timeRounding: data.timeRounding } : {}),
            ...(data.defaultCapacityHours !== undefined ? { defaultCapacityHours: data.defaultCapacityHours } : {}),
            ...(data.timerMode ? { timerMode: data.timerMode } : {}),
            ...(data.reminderEnabled !== undefined ? { reminderEnabled: data.reminderEnabled } : {}),
            ...(data.reminderTime ? { reminderTime: data.reminderTime } : {}),
            ...(data.reminderDays !== undefined ? { reminderDays: data.reminderDays } : {}),
            ...(data.energyTrackingEnabled !== undefined ? { energyTrackingEnabled: data.energyTrackingEnabled } : {}),
        },
    })

    revalidatePath("/settings/workspace")
}

export async function updateHiddenNavItems(items: string[]) {
    const { member } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Only Owners and Admins can configure navigation")

    await prisma.workspace.update({
        where: { id: member.workspaceId },
        data: { hiddenNavItems: items },
    })

    revalidatePath("/settings/workspace")
}

export async function updateProjectColorLabels(labels: Array<{ key: string; label: string }>) {
    const { member } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Only Owners and Admins can manage project color labels")

    await prisma.workspace.update({
        where: { id: member.workspaceId },
        data: { projectColorLabels: labels },
    })

    revalidatePath("/settings/workspace")
    revalidatePath("/projects")
}

/**
 * Updates the Linear team mapping for a project.
 * Only OWNER, ADMIN, MANAGER roles can do this.
 * The user must also have a connected Linear account (token must exist).
 */
export async function updateProjectLinearTeam(formData: FormData) {
    const projectId = formData.get("projectId") as string
    // Empty string means "disconnect"
    const linearTeamId = (formData.get("linearTeamId") as string) || null
    // Optional project refinement within the team
    const linearProjectId = (formData.get("linearProjectId") as string) || null
    const linearProjectName = (formData.get("linearProjectName") as string) || null

    if (!projectId) return

    const { user, member } = await getSessionMember()

    // Only Admin+ roles can manage project-team mapping
    const allowedRoles = ["OWNER", "ADMIN", "MANAGER"]
    if (!allowedRoles.includes(member.role)) {
        throw new Error("Insufficient permissions: Admin or Manager role required")
    }

    // If mapping to a team, verify the user has a Linear token (they must be connected)
    if (linearTeamId) {
        const token = await prisma.linearUserToken.findFirst({ where: { userId: user.id } })
        if (!token) {
            throw new Error("You must connect your Linear account before mapping a team")
        }
    }

    // Verify project belongs to this workspace
    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: member.workspaceId },
    })
    if (!project) throw new Error("Project not found")

    await prisma.teifiProject.update({
        where: { id: projectId },
        data: {
            linearTeamId,
            // Clear project mapping when team is cleared; otherwise save it
            linearProjectId: linearTeamId ? linearProjectId : null,
            linearProjectName: linearTeamId ? linearProjectName : null,
        },
    })

    revalidatePath(`/projects`)
    revalidatePath(`/projects/${projectId}/settings`)
    revalidatePath("/time")
}

// ── Email Settings ──────────────────────────────────────────────────────────

export async function getWorkspaceEmailSettings() {
    const { member } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Admin access required")

    const ws = await prisma.workspace.findUnique({
        where: { id: member.workspaceId },
        select: { smtpHost: true, smtpPort: true, smtpUser: true, smtpPass: true, emailFrom: true },
    })

    return {
        smtpHost: ws?.smtpHost ?? "",
        smtpPort: ws?.smtpPort ?? 587,
        smtpUser: ws?.smtpUser ?? "",
        hasSmtpPass: !!ws?.smtpPass,
        emailFrom: ws?.emailFrom ?? "",
    }
}

export async function updateEmailSettings(data: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass?: string
    emailFrom: string
}) {
    const { member } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Admin access required")

    await prisma.workspace.update({
        where: { id: member.workspaceId },
        data: {
            smtpHost: data.smtpHost || null,
            smtpPort: data.smtpPort || null,
            smtpUser: data.smtpUser || null,
            ...(data.smtpPass ? { smtpPass: (await import("@/lib/linear")).encryptToken(data.smtpPass) } : {}),
            emailFrom: data.emailFrom || null,
        },
    })

    revalidatePath("/settings/email")
}

export async function sendTestEmail() {
    const { user, member } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Admin access required")

    if (!user.email) throw new Error("No email address on your account")

    const workspace = await prisma.workspace.findUnique({
        where: { id: member.workspaceId },
        select: { name: true },
    })

    const { sendWorkspaceEmail } = await import("@/lib/email")
    await sendWorkspaceEmail(member.workspaceId, {
        type: "time-reminder",
        recipientEmail: user.email,
        recipientName: user.name ?? user.email,
        workspaceName: workspace?.name ?? "Teifi",
        appUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    })
}

export async function getEmailPreviewHtml(type: string): Promise<string> {
    const { member } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Admin access required")
    const { render } = await import("@react-email/components")
    const appUrl = "https://teifi.app"

    switch (type) {
        case "workspace-invite": {
            const { default: Template } = await import("@/emails/workspace-invite")
            return await render(Template({ recipientEmail: "user@example.com", inviterName: "David T.", workspaceName: "Teifi Digital", inviteUrl: `${appUrl}/invite/abc123` }))
        }
        case "portal-invite": {
            const { default: Template } = await import("@/emails/portal-invite")
            return await render(Template({ recipientEmail: "client@example.com", clientName: "Acme Corp", workspaceName: "Teifi Digital", inviteUrl: `${appUrl}/invite/portal/abc123` }))
        }
        case "time-reminder": {
            const { default: Template } = await import("@/emails/time-reminder")
            return await render(Template({ recipientEmail: "user@example.com", recipientName: "Sarah K.", workspaceName: "Teifi Digital", appUrl }))
        }
        case "timesheet-approved": {
            const { default: Template } = await import("@/emails/timesheet-approved")
            return await render(Template({ recipientEmail: "user@example.com", recipientName: "Sarah K.", weekOf: "Mar 10 - Mar 16, 2026", approverName: "David T.", appUrl }))
        }
        case "timesheet-rejected": {
            const { default: Template } = await import("@/emails/timesheet-rejected")
            return await render(Template({ recipientEmail: "user@example.com", recipientName: "Sarah K.", weekOf: "Mar 10 - Mar 16, 2026", approverName: "David T.", reason: "Please add descriptions to all entries.", appUrl }))
        }
        case "budget-alert": {
            const { default: Template } = await import("@/emails/budget-alert")
            return await render(Template({ recipientEmail: "admin@example.com", recipientName: "David T.", projectName: "Website Redesign", projectUrl: `${appUrl}/projects/123`, percentUsed: 87, budgetType: "hours", used: "43.5 hrs", total: "50 hrs" }))
        }
        default:
            throw new Error(`Unknown template type: ${type}`)
    }
}

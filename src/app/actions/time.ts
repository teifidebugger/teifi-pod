"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember } from "@/app/actions"
import { revalidatePath } from "next/cache"
import { startOfWeek, parseISO, format } from "date-fns"

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
            workspaceId: member.workspaceId,
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

    // Derive isBillable from project billing settings and task
    let isBillable = true
    if (project.billingType === "NON_BILLABLE") isBillable = false
    else if (project.billBy === "none") isBillable = false
    else if (task && task.isBillable === false) isBillable = false

    // Derive billableRateCents based on project.billBy
    let billableRateCents = 0
    if (isBillable) {
        switch (project.billBy) {
            case "Project":
                billableRateCents = project.hourlyRateCents ?? 0
                break
            case "Tasks":
                billableRateCents = task?.hourlyRateCents ?? project.hourlyRateCents ?? 0
                break
            case "People":
            default: {
                const pm = await prisma.projectMember.findFirst({
                    where: { projectId: project.id, memberId: member.id },
                    select: { billableRateCents: true },
                })
                billableRateCents = pm?.billableRateCents ?? userRecord?.defaultBillableCents ?? 0
                break
            }
        }
    }

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
            workspaceId: member.workspaceId,
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

    // Derive isBillable from project billing settings and task
    let isBillable = true
    if (project.billingType === "NON_BILLABLE") isBillable = false
    else if (project.billBy === "none") isBillable = false
    else if (task && task.isBillable === false) isBillable = false

    // Derive billableRateCents based on project.billBy
    let billableRateCents = 0
    if (isBillable) {
        switch (project.billBy) {
            case "Project":
                billableRateCents = project.hourlyRateCents ?? 0
                break
            case "Tasks":
                billableRateCents = task?.hourlyRateCents ?? project.hourlyRateCents ?? 0
                break
            case "People":
            default: {
                const pm = await prisma.projectMember.findFirst({
                    where: { projectId: project.id, memberId: member.id },
                    select: { billableRateCents: true },
                })
                billableRateCents = pm?.billableRateCents ?? userRecord?.defaultBillableCents ?? 0
                break
            }
        }
    }

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
    if (data.projectId !== entry.projectId) {
        revalidatePath(`/projects/${data.projectId}`)
        revalidatePath(`/projects/${entry.projectId}`)
    }
}

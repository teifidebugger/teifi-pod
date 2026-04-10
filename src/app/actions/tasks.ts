"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getSessionMember } from "../actions"

export async function createTask(formData: FormData) {
    const { member } = await getSessionMember()
    const name = formData.get("name") as string
    const description = (formData.get("description") as string) || null
    const projectId = formData.get("projectId") as string
    const isBillableRaw = formData.get("isBillable") as string | null
    const hourlyRateRaw = formData.get("hourlyRate") as string | null

    if (!name || !projectId) throw new Error("Name and Project are required")

    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) {
        throw new Error("Only managers and admins can create tasks")
    }
    if (member.role === "MANAGER" && !member.canManageProjects) {
        throw new Error("Insufficient permissions — project management is not enabled for your account")
    }

    // Verify project belongs to workspace
    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: member.workspaceId },
    })
    if (!project) throw new Error("Invalid project")

    // Default isBillable based on project billability
    const isBillable = isBillableRaw !== null
        ? isBillableRaw === "true" || isBillableRaw === "on"
        : project.billingType !== "NON_BILLABLE"

    await prisma.teifiTask.create({
        data: {
            name,
            description,
            projectId,
            isBillable,
            hourlyRateCents: hourlyRateRaw ? Math.round(Number(hourlyRateRaw) * 100) : null,
        },
    })

    revalidatePath("/tasks")
    revalidatePath(`/projects/${projectId}`)
}

export async function updateTask(formData: FormData) {
    const { member } = await getSessionMember()
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const description = (formData.get("description") as string) || null
    const projectId = formData.get("projectId") as string
    const completed = formData.get("completed") === "on"
    const isBillableRaw = formData.get("isBillable") as string | null
    const hourlyRateRaw = formData.get("hourlyRate") as string | null

    if (!id || !name || !projectId) throw new Error("ID, Name, and Project are required")

    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) {
        throw new Error("Only managers and admins can edit tasks")
    }
    if (member.role === "MANAGER" && !member.canManageProjects) {
        throw new Error("Insufficient permissions — project management is not enabled for your account")
    }

    // Verify task and project belong to workspace
    const task = await prisma.teifiTask.findFirst({
        where: {
            id,
            project: { workspaceId: member.workspaceId }
        },
    })
    if (!task) throw new Error("Task not found")

    if (projectId !== task.projectId) {
        const newProject = await prisma.teifiProject.findFirst({
            where: { id: projectId, workspaceId: member.workspaceId },
        })
        if (!newProject) throw new Error("Invalid target project")
    }

    await prisma.teifiTask.update({
        where: { id },
        data: {
            name,
            description,
            projectId,
            completed,
            ...(isBillableRaw !== null ? { isBillable: isBillableRaw === "true" || isBillableRaw === "on" } : {}),
            ...(hourlyRateRaw !== null ? { hourlyRateCents: hourlyRateRaw ? Math.round(Number(hourlyRateRaw) * 100) : null } : {}),
        },
    })

    revalidatePath("/tasks")
    revalidatePath(`/projects/${projectId}`)
    if (projectId !== task.projectId) {
        revalidatePath(`/projects/${task.projectId}`)
    }
}

export async function deleteTask(formData: FormData) {
    const { member } = await getSessionMember()
    const id = formData.get("id") as string

    if (!id) throw new Error("Task ID is required")

    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) {
        throw new Error("Only managers and admins can delete tasks")
    }
    if (member.role === "MANAGER" && !member.canManageProjects) {
        throw new Error("Insufficient permissions — project management is not enabled for your account")
    }

    const task = await prisma.teifiTask.findFirst({
        where: {
            id,
            project: { workspaceId: member.workspaceId }
        },
        include: { _count: { select: { timeEntries: true } } }
    })
    if (!task) throw new Error("Task not found")

    if (task._count.timeEntries > 0) {
        throw new Error("Cannot delete a task that has logged time. Please mark it as completed instead.")
    }

    await prisma.teifiTask.delete({
        where: { id },
    })

    revalidatePath("/tasks")
    revalidatePath(`/projects/${task.projectId}`)
}

/** Toggle task billable status instantly. OWNER/ADMIN/MANAGER only. */
export async function toggleTaskBillable(taskId: string, isBillable: boolean) {
    const { member } = await getSessionMember()

    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) {
        throw new Error("Only managers and admins can change task billability")
    }
    if (member.role === "MANAGER" && !member.canManageProjects) {
        throw new Error("Insufficient permissions — project management is not enabled for your account")
    }

    const task = await prisma.teifiTask.findFirst({
        where: {
            id: taskId,
            project: { workspaceId: member.workspaceId },
        },
    })
    if (!task) throw new Error("Task not found")

    await prisma.teifiTask.update({
        where: { id: taskId },
        data: { isBillable },
    })

    revalidatePath(`/projects/${task.projectId}`)
}

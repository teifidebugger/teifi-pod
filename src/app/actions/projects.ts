"use server"

import { getSessionMember } from "@/app/actions"
import { prisma } from "@/lib/prisma"
import { revalidatePath, revalidateTag } from "next/cache"
import { BillBy, BillingType, ProjectStatus } from "@prisma/client"

async function requireAdminOrManager() {
    const { member } = await getSessionMember()

    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) {
        throw new Error("Only Owners, Admins, and Managers can manage projects")
    }

    if (member.role === "MANAGER" && !member.canManageProjects) {
        throw new Error("Project management is not enabled for your Manager account — contact an Admin")
    }

    return { workspaceId: member.workspaceId }
}

export async function createProject(formData: FormData) {
    const { workspaceId } = await requireAdminOrManager()

    const name = formData.get("name") as string
    const code = (formData.get("code") as string) || null
    const clientId = formData.get("clientId") as string | null
    const status = (formData.get("status") as ProjectStatus) || "ACTIVE"
    const billingType = (formData.get("billingType") as BillingType) || "HOURLY"
    const billBy = ((formData.get("billBy") as string) || "People") as BillBy
    const hourlyRate = formData.get("hourlyRate")
    const budgetHours = formData.get("budgetHours")
    const budgetCents = formData.get("budgetCents") // if fixed fee
    const feeCentsRaw = formData.get("feeCents")
    const budgetBy = (formData.get("budgetBy") as string) || "project_hours"
    const costBudgetRaw = formData.get("costBudgetCents")
    const costBudgetIncludeExpenses = formData.get("costBudgetIncludeExpenses") === "true"
    const notifyWhenOverBudget = formData.get("notifyWhenOverBudget") === "true"
    const overBudgetPct = formData.get("overBudgetNotificationPercent")
    const color = (formData.get("color") as string) || "orange"
    const startsOnRaw = formData.get("startsOn") as string | null
    const endsOnRaw = formData.get("endsOn") as string | null
    const budgetIsMonthly = formData.get("budgetIsMonthly") === "true"
    const showBudgetToAll = formData.get("showBudgetToAll") === "true"
    const managerId = (formData.get("managerId") as string) || null

    if (!name) throw new Error("Project name is required")

    // Verify client if provided
    if (clientId) {
        const client = await prisma.client.findFirst({
            where: { id: clientId, workspaceId },
        })
        if (!client) throw new Error("Client not found in this workspace")
    }

    // Verify manager if provided
    if (managerId) {
        const mgr = await prisma.workspaceMember.findFirst({
            where: { id: managerId, workspaceId },
        })
        if (!mgr) throw new Error("Manager not found in this workspace")
    }

    const newProject = await prisma.teifiProject.create({
        data: {
            workspaceId,
            name,
            code,
            clientId: clientId || null,
            status,
            billingType,
            billBy: billingType === "NON_BILLABLE" ? "none" : billBy,
            hourlyRateCents: hourlyRate ? Math.round(Number(hourlyRate) * 100) : null,
            budgetHours: budgetHours ? parseInt(budgetHours as string, 10) : null,
            budgetCents: budgetCents ? parseInt(budgetCents as string, 10) : null,
            feeCents: feeCentsRaw ? Math.round(Number(feeCentsRaw) * 100) : null,
            budgetBy,
            costBudgetCents: costBudgetRaw ? Math.round(Number(costBudgetRaw) * 100) : null,
            costBudgetIncludeExpenses,
            notifyWhenOverBudget,
            overBudgetNotificationPercent: overBudgetPct ? parseFloat(overBudgetPct as string) : 80,
            color,
            startsOn: startsOnRaw ? new Date(startsOnRaw + "T00:00:00") : null,
            endsOn: endsOnRaw ? new Date(endsOnRaw + "T00:00:00") : null,
            budgetIsMonthly,
            showBudgetToAll,
            managerId,
        },
    })

    // Auto-assign members who have autoAssignAllProjects=true
    const autoMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId, autoAssignAllProjects: true },
        select: { id: true },
    })
    if (autoMembers.length > 0) {
        await prisma.projectMember.createMany({
            data: autoMembers.map((m) => ({ projectId: newProject.id, memberId: m.id })),
            skipDuplicates: true,
        })
    }

    revalidateTag(`workspace-projects-${workspaceId}`, "minutes")
    revalidatePath("/projects")
    revalidatePath("/time")
    revalidatePath("/schedule")
}

export async function updateProject(formData: FormData) {
    const { workspaceId } = await requireAdminOrManager()

    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const code = (formData.get("code") as string) || null
    const clientId = formData.get("clientId") as string | null
    const status = (formData.get("status") as ProjectStatus) || "ACTIVE"
    const billingType = (formData.get("billingType") as BillingType) || "HOURLY"
    const billBy = ((formData.get("billBy") as string) || "People") as BillBy
    const hourlyRate = formData.get("hourlyRate")
    const budgetHours = formData.get("budgetHours")
    const budgetCents = formData.get("budgetCents")
    const feeCentsRaw = formData.get("feeCents")
    const budgetBy = (formData.get("budgetBy") as string) || "project_hours"
    const costBudgetRaw = formData.get("costBudgetCents")
    const costBudgetIncludeExpenses = formData.get("costBudgetIncludeExpenses") === "true"
    const notifyWhenOverBudget = formData.get("notifyWhenOverBudget") === "true"
    const overBudgetPct = formData.get("overBudgetNotificationPercent")
    const color = (formData.get("color") as string) || "orange"
    const startsOnRaw = formData.get("startsOn") as string | null
    const endsOnRaw = formData.get("endsOn") as string | null
    const budgetIsMonthly = formData.get("budgetIsMonthly") === "true"
    const showBudgetToAll = formData.get("showBudgetToAll") === "true"
    const managerId = (formData.get("managerId") as string) || null

    if (!id || !name) throw new Error("Project ID and name are required")

    // Verify it belongs to workspace
    const project = await prisma.teifiProject.findFirst({
        where: { id, workspaceId },
    })
    if (!project) throw new Error("Project not found")

    // Verify client if provided
    if (clientId && clientId !== project.clientId) {
        const client = await prisma.client.findFirst({
            where: { id: clientId, workspaceId },
        })
        if (!client) throw new Error("Client not found in this workspace")
    }

    // Verify manager if provided
    if (managerId) {
        const mgr = await prisma.workspaceMember.findFirst({
            where: { id: managerId, workspaceId },
        })
        if (!mgr) throw new Error("Manager not found in this workspace")
    }

    await prisma.teifiProject.update({
        where: { id },
        data: {
            name,
            code,
            clientId: clientId || null,
            status,
            billingType,
            billBy: billingType === "NON_BILLABLE" ? "none" : billBy,
            hourlyRateCents: hourlyRate ? Math.round(Number(hourlyRate) * 100) : null,
            budgetHours: budgetHours ? parseInt(budgetHours as string, 10) : null,
            budgetCents: budgetCents ? parseInt(budgetCents as string, 10) : null,
            feeCents: feeCentsRaw ? Math.round(Number(feeCentsRaw) * 100) : null,
            budgetBy,
            costBudgetCents: costBudgetRaw ? Math.round(Number(costBudgetRaw) * 100) : null,
            costBudgetIncludeExpenses,
            notifyWhenOverBudget,
            overBudgetNotificationPercent: overBudgetPct ? parseFloat(overBudgetPct as string) : 80,
            color,
            startsOn: startsOnRaw ? new Date(startsOnRaw + "T00:00:00") : null,
            endsOn: endsOnRaw ? new Date(endsOnRaw + "T00:00:00") : null,
            budgetIsMonthly,
            showBudgetToAll,
            managerId,
        },
    })

    revalidateTag(`workspace-projects-${workspaceId}`, "minutes")
    revalidatePath("/projects")
    revalidatePath(`/projects/${id}`)
    revalidatePath(`/projects/${id}/settings`)
    revalidatePath("/time")
    revalidatePath("/schedule")
}

export async function deleteProject(formData: FormData) {
    const { workspaceId } = await requireAdminOrManager()
    const id = formData.get("id") as string

    if (!id) throw new Error("Project ID is required")

    const project = await prisma.teifiProject.findFirst({
        where: { id, workspaceId },
        include: { _count: { select: { timeEntries: true, tasks: true } } }
    })
    if (!project) throw new Error("Project not found")

    if (project._count.timeEntries > 0 || project._count.tasks > 0) {
        throw new Error("Cannot delete project because it has tasks or time entries. Please archive it instead.")
    }

    await prisma.teifiProject.delete({
        where: { id },
    })

    revalidateTag(`workspace-projects-${workspaceId}`, "minutes")
    revalidatePath("/projects")
    revalidatePath("/time")
    revalidatePath("/schedule")
}

/** Duplicate a project with same settings but "Copy of" prefix and reset budget tracking. */
export async function duplicateProject(projectId: string): Promise<string> {
    const { workspaceId } = await requireAdminOrManager()

    const source = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId },
    })
    if (!source) throw new Error("Project not found")

    const newProject = await prisma.teifiProject.create({
        data: {
            workspaceId,
            name: `Copy of ${source.name}`,
            code: source.code ? `${source.code}-copy` : null,
            description: source.description,
            status: "ACTIVE",
            billingType: source.billingType,
            billBy: source.billBy,
            hourlyRateCents: source.hourlyRateCents,
            budgetHours: source.budgetHours,
            budgetCents: source.budgetCents,
            feeCents: source.feeCents,
            budgetBy: source.budgetBy,
            costBudgetCents: source.costBudgetCents,
            costBudgetIncludeExpenses: source.costBudgetIncludeExpenses,
            notifyWhenOverBudget: source.notifyWhenOverBudget,
            overBudgetNotificationPercent: source.overBudgetNotificationPercent,
            color: source.color,
            clientId: source.clientId,
            startsOn: source.startsOn,
            endsOn: source.endsOn,
            budgetIsMonthly: source.budgetIsMonthly,
            showBudgetToAll: source.showBudgetToAll,
            managerId: source.managerId,
            linearTeamId: source.linearTeamId,
        },
    })

    revalidateTag(`workspace-projects-${workspaceId}`, "minutes")
    revalidatePath("/projects")
    return newProject.id
}

// ─── PROJECT MEMBER ACTIONS ───────────────────────────────────────────────────

async function requireAdminOrManagerWithId() {
    const { member } = await getSessionMember()
    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) {
        throw new Error("Only Owners, Admins, and Managers can manage projects")
    }
    if (member.role === "MANAGER" && !member.canManageProjects) {
        throw new Error("Project management is not enabled for your Manager account — contact an Admin")
    }
    return { member }
}

async function requireAdminWithId() {
    const { member } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(member.role)) {
        throw new Error("Insufficient permissions — only OWNER or ADMIN can remove members")
    }
    return { member }
}

/** Assign a member to a project with optional rate override. OWNER/ADMIN/MANAGER only. */
export async function assignMemberToProject(
    projectId: string,
    memberId: string,
    billableRateCents: number | null,
) {
    const { member } = await requireAdminOrManagerWithId()

    // Verify project belongs to caller's workspace
    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: member.workspaceId },
    })
    if (!project) throw new Error("Project not found")

    // Verify memberId belongs to same workspace
    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: member.workspaceId },
    })
    if (!target) throw new Error("Member not found")

    await prisma.projectMember.upsert({
        where: { projectId_memberId: { projectId, memberId } },
        create: { projectId, memberId, billableRateCents },
        update: { billableRateCents },
    })

    revalidatePath(`/projects/${projectId}/settings`)
}

/** Remove a member from a project. OWNER/ADMIN only. */
export async function removeMemberFromProject(projectId: string, memberId: string) {
    const { member } = await requireAdminWithId()

    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: member.workspaceId },
    })
    if (!project) throw new Error("Project not found")

    await prisma.projectMember.deleteMany({
        where: { projectId, memberId },
    })

    revalidatePath(`/projects/${projectId}/settings`)
}

/** Update project status (archive/unarchive/pause/complete). OWNER/ADMIN/MANAGER only. */
export async function updateProjectStatus(projectId: string, status: string) {
    const { workspaceId } = await requireAdminOrManager()
    const validStatuses: ProjectStatus[] = ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED", "TENTATIVE"]
    if (!validStatuses.includes(status as ProjectStatus)) throw new Error(`Invalid status "${status}". Must be one of: ${validStatuses.join(", ")}`)
    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId },
    })
    if (!project) throw new Error("Project not found")
    await prisma.teifiProject.update({ where: { id: projectId }, data: { status: status as ProjectStatus } })
    revalidateTag(`workspace-projects-${workspaceId}`, "minutes")
    revalidatePath("/projects")
    revalidatePath("/schedule")
}

/** Activate a TENTATIVE (pipeline) project, moving it to ACTIVE. OWNER/ADMIN/MANAGER only. */
export async function activateProject(projectId: string) {
    const { workspaceId } = await requireAdminOrManager()

    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId },
        select: { id: true, status: true },
    })
    if (!project) throw new Error("Project not found")
    if (project.status !== "TENTATIVE") throw new Error("Only pipeline (TENTATIVE) projects can be activated this way")

    await prisma.teifiProject.update({
        where: { id: projectId },
        data: { status: "ACTIVE" },
    })

    revalidateTag(`workspace-projects-${workspaceId}`, "minutes")
    revalidatePath("/projects")
    revalidatePath("/schedule")
}

/** Update a project member's billable rate override. OWNER/ADMIN/MANAGER only. */
export async function updateProjectMemberRate(
    projectId: string,
    memberId: string,
    billableRateCents: number | null,
) {
    const { member } = await requireAdminOrManagerWithId()

    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: member.workspaceId },
    })
    if (!project) throw new Error("Project not found")

    await prisma.projectMember.updateMany({
        where: { projectId, memberId },
        data: { billableRateCents },
    })

    revalidatePath(`/projects/${projectId}/settings`)
}

/** Assign or remove a project manager. OWNER/ADMIN/MANAGER only.
 *  Syncs: sets isProjectManager=true in ProjectMember for the new manager. */
export async function assignProjectManager(projectId: string, memberId: string | null) {
    const { member } = await requireAdminOrManagerWithId()

    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: member.workspaceId },
    })
    if (!project) throw new Error("Project not found")

    if (memberId) {
        const mgr = await prisma.workspaceMember.findFirst({
            where: { id: memberId, workspaceId: member.workspaceId },
        })
        if (!mgr) throw new Error("Member not found in workspace")
    }

    await prisma.$transaction(async (tx) => {
        await tx.teifiProject.update({
            where: { id: projectId },
            data: { managerId: memberId },
        })

        // Sync: clear old manager flag, then set new one
        await tx.projectMember.updateMany({
            where: { projectId, isProjectManager: true },
            data: { isProjectManager: false },
        })
        if (memberId) {
            await tx.projectMember.upsert({
                where: { projectId_memberId: { projectId, memberId } },
                create: { projectId, memberId, isProjectManager: true },
                update: { isProjectManager: true },
            })
        }
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/projects")
}

// ── Bulk Map Linear Team ───────────────────────────────────────────────────
export async function bulkMapLinearTeam(projectIds: string[], linearTeamId: string | null) {
    const { workspaceId } = await requireAdminOrManager()
    if (projectIds.length === 0) return

    await prisma.teifiProject.updateMany({
        where: { id: { in: projectIds }, workspaceId },
        data: { linearTeamId: linearTeamId || null },
    })
    revalidatePath("/projects")
    revalidatePath("/settings/integrations")
}

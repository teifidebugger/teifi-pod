"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember } from "@/app/actions"
import { revalidatePath } from "next/cache"
import type { AllocationType } from "@prisma/client"
import { addDays } from "date-fns"

const ALLOWED_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const

async function getCallerMember() {
    const { member } = await getSessionMember()
    if (!ALLOWED_ROLES.includes(member.role as (typeof ALLOWED_ROLES)[number])) {
        throw new Error("Insufficient permissions: Manager role or above required")
    }
    if (member.role === "MANAGER" && !member.canManageProjects) {
        throw new Error("Insufficient permissions — project management is not enabled for your account")
    }
    return member
}

export async function createAllocation(data: {
    memberId?: string
    placeholderId?: string
    projectId: string
    startDate: string
    endDate: string
    hoursPerDay: number
    type: "SOFT" | "HARD"
    notes?: string
}): Promise<void> {
    const caller = await getCallerMember()

    // Exactly one of memberId / placeholderId must be set
    if ((!data.memberId && !data.placeholderId) || (data.memberId && data.placeholderId)) {
        throw new Error("Exactly one of memberId or placeholderId must be provided")
    }

    // Verify assignee belongs to same workspace
    if (data.memberId) {
        const targetMember = await prisma.workspaceMember.findFirst({
            where: { id: data.memberId, workspaceId: caller.workspaceId },
        })
        if (!targetMember) throw new Error("Member not found in workspace")
    }

    if (data.placeholderId) {
        const targetPlaceholder = await prisma.placeholder.findFirst({
            where: { id: data.placeholderId, workspaceId: caller.workspaceId, archivedAt: null },
        })
        if (!targetPlaceholder) throw new Error("Placeholder not found in workspace")
    }

    // Verify project belongs to same workspace and is not archived
    const project = await prisma.teifiProject.findFirst({
        where: { id: data.projectId, workspaceId: caller.workspaceId },
    })
    if (!project) throw new Error("Project not found in workspace")
    if (project.status === "ARCHIVED") throw new Error("Cannot allocate to an archived project")

    // Validate date range and hours
    if (new Date(data.endDate) < new Date(data.startDate)) {
        throw new Error("End date must be on or after start date")
    }
    if (data.hoursPerDay < 0.5 || data.hoursPerDay > 24) {
        throw new Error("Hours per day must be between 0.5 and 24")
    }

    await prisma.allocation.create({
        data: {
            memberId: data.memberId || null,
            placeholderId: data.placeholderId || null,
            projectId: data.projectId,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            hoursPerDay: data.hoursPerDay,
            type: data.type as AllocationType,
            notes: data.notes || null,
        },
    })

    revalidatePath("/schedule")
}

export async function updateAllocation(
    id: string,
    data: Partial<{
        memberId: string
        placeholderId: string
        projectId: string
        startDate: string
        endDate: string
        hoursPerDay: number
        type: "SOFT" | "HARD"
        notes: string
    }>
): Promise<void> {
    const caller = await getCallerMember()

    // Verify allocation belongs to workspace (member OR placeholder)
    const existing = await prisma.allocation.findFirst({
        where: {
            id,
            OR: [
                { member: { workspaceId: caller.workspaceId } },
                { placeholder: { workspaceId: caller.workspaceId } },
            ],
        },
    })
    if (!existing) throw new Error("Allocation not found")

    // Validate updated references belong to same workspace
    if (data.memberId !== undefined) {
        const targetMember = await prisma.workspaceMember.findFirst({
            where: { id: data.memberId, workspaceId: caller.workspaceId },
        })
        if (!targetMember) throw new Error("Member not found in workspace")
    }

    if (data.placeholderId !== undefined) {
        const targetPlaceholder = await prisma.placeholder.findFirst({
            where: { id: data.placeholderId, workspaceId: caller.workspaceId, archivedAt: null },
        })
        if (!targetPlaceholder) throw new Error("Placeholder not found in workspace")
    }

    if (data.projectId !== undefined) {
        const targetProject = await prisma.teifiProject.findFirst({
            where: { id: data.projectId, workspaceId: caller.workspaceId },
        })
        if (!targetProject) throw new Error("Project not found in workspace")
        if (targetProject.status === "ARCHIVED") throw new Error("Cannot allocate to an archived project")
    }

    // Cross-validate dates: use existing values as fallback when only one side is provided
    const effectiveStart = data.startDate ?? existing.startDate.toISOString()
    const effectiveEnd = data.endDate ?? existing.endDate.toISOString()
    if ((data.startDate !== undefined || data.endDate !== undefined) &&
        new Date(effectiveEnd) < new Date(effectiveStart)) {
        throw new Error("End date must be on or after start date")
    }
    if (data.hoursPerDay !== undefined && (data.hoursPerDay < 0.5 || data.hoursPerDay > 24)) {
        throw new Error("Hours per day must be between 0.5 and 24")
    }

    await prisma.allocation.update({
        where: { id },
        data: {
            ...(data.memberId !== undefined && { memberId: data.memberId, placeholderId: null }),
            ...(data.placeholderId !== undefined && { placeholderId: data.placeholderId, memberId: null }),
            ...(data.projectId !== undefined && { projectId: data.projectId }),
            ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
            ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
            ...(data.hoursPerDay !== undefined && { hoursPerDay: data.hoursPerDay }),
            ...(data.type !== undefined && { type: data.type as AllocationType }),
            ...(data.notes !== undefined && { notes: data.notes || null }),
        },
    })

    revalidatePath("/schedule")
}

export async function deleteAllocation(id: string): Promise<void> {
    const caller = await getCallerMember()

    const existing = await prisma.allocation.findFirst({
        where: {
            id,
            OR: [
                { member: { workspaceId: caller.workspaceId } },
                { placeholder: { workspaceId: caller.workspaceId } },
            ],
        },
    })
    if (!existing) throw new Error("Allocation not found")

    await prisma.allocation.delete({ where: { id } })

    revalidatePath("/schedule")
}

export async function duplicateAllocation(id: string): Promise<void> {
    const caller = await getCallerMember()
    const existing = await prisma.allocation.findFirst({
        where: {
            id,
            OR: [
                { member: { workspaceId: caller.workspaceId } },
                { placeholder: { workspaceId: caller.workspaceId } },
            ],
        },
    })
    if (!existing) throw new Error("Allocation not found")
    await prisma.allocation.create({
        data: {
            memberId: existing.memberId,
            placeholderId: existing.placeholderId,
            projectId: existing.projectId,
            startDate: existing.startDate,
            endDate: existing.endDate,
            hoursPerDay: existing.hoursPerDay,
            type: existing.type,
            notes: existing.notes,
        },
    })
    revalidatePath("/schedule")
}

/**
 * Shift all allocations for a project by N days (positive = forward, negative = backward).
 */
export async function shiftProjectAllocations(projectId: string, days: number): Promise<void> {
    const caller = await getCallerMember()

    const allocations = await prisma.allocation.findMany({
        where: {
            projectId,
            OR: [
                { member: { workspaceId: caller.workspaceId } },
                { placeholder: { workspaceId: caller.workspaceId } },
            ],
        },
        select: { id: true, startDate: true, endDate: true },
    })
    if (!allocations.length) return

    await prisma.$transaction(
        allocations.map((a) =>
            prisma.allocation.update({
                where: { id: a.id },
                data: {
                    startDate: addDays(a.startDate, days),
                    endDate: addDays(a.endDate, days),
                },
            })
        )
    )

    revalidatePath("/schedule")
}

/**
 * Reassign a placeholder allocation to a real team member.
 * Sets memberId and clears placeholderId.
 */
export async function convertPlaceholderAllocation(
    allocationId: string,
    memberId: string
): Promise<void> {
    const caller = await getCallerMember()

    const existing = await prisma.allocation.findFirst({
        where: {
            id: allocationId,
            placeholderId: { not: null },
            placeholder: { workspaceId: caller.workspaceId },
        },
    })
    if (!existing) throw new Error("Placeholder allocation not found")

    // Verify target member belongs to same workspace
    const targetMember = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!targetMember) throw new Error("Member not found in workspace")

    await prisma.allocation.update({
        where: { id: allocationId },
        data: {
            memberId,
            placeholderId: null,
        },
    })

    revalidatePath("/schedule")
}

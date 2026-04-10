import { NextRequest, NextResponse } from "next/server"
import { verifyApiToken } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { withCors, corsOptions } from "@/lib/cors"

export async function OPTIONS() { return corsOptions() }

const entrySelect = {
    id: true,
    date: true,
    durationSeconds: true,
    timerStartedAt: true,
    description: true,
    isBillable: true,
    billableRateCents: true,
    energyLevel: true,
    approvalStatus: true,
    isLocked: true,
    project: { select: { id: true, name: true, code: true } },
    task: { select: { id: true, name: true } },
} as const

/**
 * GET /api/v1/time/entries/[id]
 * Returns a single time entry by ID.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const ctx = await verifyApiToken(req)
    if (!ctx) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const { id } = await params

    const entry = await prisma.timeEntry.findFirst({
        where: { id, userId: ctx.userId },
        select: entrySelect,
    })
    if (!entry) return withCors(NextResponse.json({ error: "Entry not found" }, { status: 404 }))

    return withCors(NextResponse.json({
        ...entry,
        timerStartedAt: entry.timerStartedAt?.toISOString() ?? null,
        durationSeconds: entry.timerStartedAt
            ? Math.floor((Date.now() - entry.timerStartedAt.getTime()) / 1000)
            : entry.durationSeconds,
    }))
}

/**
 * PATCH /api/v1/time/entries/[id]
 * Update fields on a time entry.
 *
 * Body: {
 *   description?: string
 *   date?: string          // "yyyy-MM-dd"
 *   hours?: number         // decimal, e.g. 1.5
 *   projectId?: string
 *   taskId?: string | null
 *   isBillable?: boolean
 *   energyLevel?: number | null
 * }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const ctx = await verifyApiToken(req)
    if (!ctx) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const { id } = await params

    let body: {
        description?: string
        date?: string
        hours?: number
        projectId?: string
        taskId?: string | null
        isBillable?: boolean
        energyLevel?: number | null
    }
    try {
        body = await req.json()
    } catch {
        return withCors(NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }))
    }

    const entry = await prisma.timeEntry.findFirst({
        where: { id, userId: ctx.userId },
        select: {
            id: true,
            isLocked: true,
            approvalStatus: true,
            projectId: true,
            taskId: true,
            billableRateCents: true,
            invoiceId: true,
        },
    })
    if (!entry) return withCors(NextResponse.json({ error: "Entry not found" }, { status: 404 }))
    if (entry.invoiceId !== null) return withCors(NextResponse.json({ error: "Entry is attached to an invoice and cannot be edited" }, { status: 409 }))
    if (entry.isLocked) return withCors(NextResponse.json({ error: "Entry is locked and cannot be edited" }, { status: 409 }))
    if (entry.approvalStatus === "APPROVED") {
        return withCors(NextResponse.json({ error: "Entry has been approved and cannot be edited" }, { status: 409 }))
    }

    if (body.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
        return withCors(NextResponse.json({ error: "date must be yyyy-MM-dd" }, { status: 400 }))
    }
    if (body.hours !== undefined && body.hours <= 0) {
        return withCors(NextResponse.json({ error: "hours must be > 0" }, { status: 400 }))
    }

    // Workspace notes requirement
    const workspace = await prisma.workspace.findFirst({
        where: { members: { some: { userId: ctx.userId } } },
        select: { requireTimeEntryNotes: true, timeRounding: true },
    })
    if (workspace?.requireTimeEntryNotes && body.description !== undefined && !body.description.trim()) {
        return withCors(NextResponse.json({ error: "A description is required in this workspace" }, { status: 400 }))
    }

    const targetProjectId = body.projectId ?? entry.projectId
    const targetTaskId = "taskId" in body ? body.taskId : entry.taskId

    // Validate project if provided or if we need to re-derive billing
    const needsBillingRecalc = body.projectId !== undefined || body.isBillable !== undefined
    let billableRateCents = entry.billableRateCents

    if (needsBillingRecalc) {
        const project = await prisma.teifiProject.findFirst({
            where: { id: targetProjectId },
            select: { id: true, status: true, billingType: true, billBy: true, hourlyRateCents: true },
        })
        if (!project) return withCors(NextResponse.json({ error: "Project not found" }, { status: 404 }))
        if (project.status === "ARCHIVED") {
            return withCors(NextResponse.json({ error: "Cannot move entry to an archived project" }, { status: 400 }))
        }

        let isBillable = body.isBillable ?? true
        if (project.billingType === "NON_BILLABLE" || project.billBy === "none") isBillable = false

        if (isBillable) {
            const task = targetTaskId
                ? await prisma.teifiTask.findFirst({ where: { id: targetTaskId }, select: { isBillable: true, hourlyRateCents: true } })
                : null
            if (task?.isBillable === false) isBillable = false

            if (isBillable) {
                switch (project.billBy) {
                    case "Project":
                        billableRateCents = project.hourlyRateCents ?? 0
                        break
                    case "Tasks":
                        billableRateCents = task?.hourlyRateCents ?? project.hourlyRateCents ?? 0
                        break
                    case "People": {
                        const pm = await prisma.projectMember.findFirst({
                            where: { projectId: targetProjectId, memberId: ctx.memberId },
                            select: { billableRateCents: true },
                        })
                        const user = await prisma.user.findUnique({
                            where: { id: ctx.userId },
                            select: { defaultBillableCents: true },
                        })
                        billableRateCents = pm?.billableRateCents ?? user?.defaultBillableCents ?? 0
                        break
                    }
                    default:
                        billableRateCents = 0
                }
            } else {
                billableRateCents = 0
            }
        } else {
            billableRateCents = 0
        }
    }

    const roundTo = (workspace?.timeRounding ?? 0) * 60
    const rawSeconds = body.hours !== undefined ? Math.round(body.hours * 3600) : undefined
    const durationSeconds = rawSeconds !== undefined
        ? (roundTo > 0 ? Math.ceil(rawSeconds / roundTo) * roundTo : rawSeconds)
        : undefined

    const updated = await prisma.timeEntry.update({
        where: { id },
        data: {
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.date !== undefined ? { date: body.date } : {}),
            ...(durationSeconds !== undefined ? { durationSeconds } : {}),
            ...(body.projectId !== undefined ? { projectId: body.projectId } : {}),
            ...("taskId" in body ? { taskId: body.taskId ?? null } : {}),
            ...(needsBillingRecalc ? { billableRateCents, isBillable: billableRateCents > 0 } : {}),
            ...(body.energyLevel !== undefined ? { energyLevel: body.energyLevel } : {}),
        },
        select: entrySelect,
    })

    return withCors(NextResponse.json({
        ...updated,
        timerStartedAt: updated.timerStartedAt?.toISOString() ?? null,
        durationSeconds: updated.timerStartedAt
            ? Math.floor((Date.now() - updated.timerStartedAt.getTime()) / 1000)
            : updated.durationSeconds,
    }))
}

/**
 * DELETE /api/v1/time/entries/[id]
 * Delete a time entry owned by the authenticated user.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const ctx = await verifyApiToken(req)
    if (!ctx) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const { id } = await params

    const entry = await prisma.timeEntry.findFirst({
        where: { id, userId: ctx.userId },
        select: { id: true, isLocked: true, approvalStatus: true, invoiceId: true },
    })
    if (!entry) return withCors(NextResponse.json({ error: "Entry not found" }, { status: 404 }))
    if (entry.invoiceId !== null) return withCors(NextResponse.json({ error: "Entry is attached to an invoice and cannot be deleted" }, { status: 409 }))
    if (entry.isLocked) return withCors(NextResponse.json({ error: "Entry is locked and cannot be deleted" }, { status: 409 }))
    if (entry.approvalStatus === "APPROVED") {
        return withCors(NextResponse.json({ error: "Entry has been approved and cannot be deleted" }, { status: 409 }))
    }

    await prisma.timeEntry.delete({ where: { id } })

    return withCors(new NextResponse(null, { status: 204 }))
}

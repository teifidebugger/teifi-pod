import { NextRequest, NextResponse } from "next/server"
import { verifyApiToken } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { withCors, corsOptions } from "@/lib/cors"
import { resolveBillingRate } from "@/lib/billing"

export async function OPTIONS() { return corsOptions() }

/**
 * POST /api/v1/time
 * Log a manual time entry.
 *
 * Body: {
 *   projectId: string
 *   taskId?: string
 *   date: string        // "yyyy-MM-dd"
 *   hours: number       // decimal, e.g. 1.5
 *   description?: string
 * }
 */
export async function POST(req: NextRequest) {
    const ctx = await verifyApiToken(req)
    if (!ctx) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    let body: { projectId?: string; taskId?: string; date?: string; hours?: number; description?: string; energyLevel?: number }
    try {
        body = await req.json()
    } catch {
        return withCors(NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }))
    }

    const { projectId, taskId, date, hours, description, energyLevel } = body
    if (!projectId) return withCors(NextResponse.json({ error: "projectId is required" }, { status: 400 }))
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return withCors(NextResponse.json({ error: "date must be yyyy-MM-dd" }, { status: 400 }))
    }
    if (!hours || hours <= 0) return withCors(NextResponse.json({ error: "hours must be > 0" }, { status: 400 }))

    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: ctx.workspaceId },
        select: { id: true, status: true, billingType: true, billBy: true, hourlyRateCents: true },
    })
    if (!project) return withCors(NextResponse.json({ error: "Project not found" }, { status: 404 }))
    if (project.status === "ARCHIVED") {
        return withCors(NextResponse.json({ error: "Cannot log time to an archived project" }, { status: 400 }))
    }

    // Workspace settings: notes required + rounding
    const workspace = await prisma.workspace.findUnique({
        where: { id: ctx.workspaceId },
        select: { requireTimeEntryNotes: true, timeRounding: true },
    })
    if (workspace?.requireTimeEntryNotes && !description?.trim()) {
        return withCors(NextResponse.json(
            { error: "A description is required in this workspace" },
            { status: 400 }
        ))
    }

    // Task resolution
    let resolvedTaskId: string | undefined = taskId
    let task: { id: string; isBillable: boolean; hourlyRateCents: number | null } | null = null

    if (resolvedTaskId) {
        task = await prisma.teifiTask.findFirst({
            where: { id: resolvedTaskId, projectId },
            select: { id: true, isBillable: true, hourlyRateCents: true },
        })
    } else {
        task = await prisma.teifiTask.findFirst({
            where: { projectId },
            select: { id: true, isBillable: true, hourlyRateCents: true },
        })
        resolvedTaskId = task?.id
    }

    // Duration with rounding
    const rawSeconds = Math.round(hours * 3600)
    const roundTo = (workspace?.timeRounding ?? 0) * 60
    const durationSeconds = roundTo > 0 ? Math.ceil(rawSeconds / roundTo) * roundTo : rawSeconds

    // Billing rate resolution
    const userRecord = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { costRateCents: true, defaultBillableCents: true },
    })

    const pm = await prisma.projectMember.findFirst({
        where: { projectId, memberId: ctx.memberId },
        select: { billableRateCents: true },
    })
    const { isBillable, billableRateCents } = resolveBillingRate({
        project,
        task,
        projectMember: pm,
        userDefaultBillableCents: userRecord?.defaultBillableCents ?? 0,
    })

    const entry = await prisma.timeEntry.create({
        data: {
            userId: ctx.userId,
            projectId,
            taskId: resolvedTaskId,
            date,
            durationSeconds,
            description: description ?? null,
            isBillable,
            billableRateCents,
            costRateCents: userRecord?.costRateCents ?? 0,
            energyLevel: energyLevel !== undefined && !isNaN(energyLevel) ? energyLevel : null,
        },
        select: {
            id: true,
            date: true,
            durationSeconds: true,
            description: true,
            isBillable: true,
            project: { select: { id: true, name: true } },
            task: { select: { id: true, name: true } },
        },
    })

    return withCors(NextResponse.json(entry, { status: 201 }))
}

import { NextRequest, NextResponse } from "next/server"
import { verifyApiToken } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { withCors, corsOptions } from "@/lib/cors"
import { resolveBillingRate } from "@/lib/billing"

export async function OPTIONS() { return corsOptions() }

/**
 * POST /api/v1/timer/start
 * Starts a new timer for the authenticated user.
 * Stops any existing running timer first.
 *
 * Body: { projectId, taskId?, description?, linearIssueId? }
 */
export async function POST(req: NextRequest) {
    const ctx = await verifyApiToken(req)
    if (!ctx) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    let body: { projectId?: string; taskId?: string; description?: string; linearIssueId?: string; energyLevel?: number }
    try {
        body = await req.json()
    } catch {
        return withCors(NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }))
    }

    const { projectId, taskId, description, linearIssueId, energyLevel } = body
    if (!projectId) return withCors(NextResponse.json({ error: "projectId is required" }, { status: 400 }))

    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: ctx.workspaceId },
        select: { id: true, status: true, billingType: true, billBy: true, hourlyRateCents: true },
    })
    if (!project) return withCors(NextResponse.json({ error: "Project not found" }, { status: 404 }))
    if (project.status === "ARCHIVED") {
        return withCors(NextResponse.json({ error: "Cannot log time to an archived project" }, { status: 400 }))
    }

    // Stop any existing running timer
    const running = await prisma.timeEntry.findFirst({
        where: { userId: ctx.userId, timerStartedAt: { not: null } },
    })
    if (running) {
        const now = new Date()
        const duration = Math.floor((now.getTime() - running.timerStartedAt!.getTime()) / 1000)
        await prisma.timeEntry.update({
            where: { id: running.id },
            data: { timerStartedAt: null, durationSeconds: duration },
        })
    }

    // Resolve task
    let resolvedTaskId: string | undefined = taskId
    let task: { id: string; isBillable: boolean; hourlyRateCents: number | null } | null = null

    if (resolvedTaskId) {
        task = await prisma.teifiTask.findFirst({
            where: { id: resolvedTaskId, projectId },
            select: { id: true, isBillable: true, hourlyRateCents: true },
        })
    } else if (linearIssueId) {
        task = await prisma.teifiTask.findFirst({
            where: { projectId, linearIssueId },
            select: { id: true, isBillable: true, hourlyRateCents: true },
        })
        if (!task) {
            task = await prisma.teifiTask.create({
                data: { name: linearIssueId, projectId, linearIssueId },
                select: { id: true, isBillable: true, hourlyRateCents: true },
            })
        }
        resolvedTaskId = task.id
    } else {
        task = await prisma.teifiTask.findFirst({
            where: { projectId },
            select: { id: true, isBillable: true, hourlyRateCents: true },
        })
        resolvedTaskId = task?.id
    }

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

    const now = new Date()
    const entry = await prisma.timeEntry.create({
        data: {
            userId: ctx.userId,
            projectId,
            taskId: resolvedTaskId,
            date: now.toISOString().slice(0, 10),
            timerStartedAt: now,
            durationSeconds: 0,
            description: description ?? null,
            isBillable,
            billableRateCents,
            costRateCents: userRecord?.costRateCents ?? 0,
            energyLevel: energyLevel !== undefined && !isNaN(energyLevel) ? energyLevel : null,
        },
        select: {
            id: true,
            date: true,
            timerStartedAt: true,
            description: true,
            isBillable: true,
            project: { select: { id: true, name: true, code: true } },
            task: { select: { id: true, name: true } },
        },
    })

    return withCors(NextResponse.json(entry, { status: 201 }))
}

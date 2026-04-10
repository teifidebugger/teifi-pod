import { NextRequest, NextResponse } from "next/server"
import { verifyApiToken } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { withCors, corsOptions } from "@/lib/cors"

export async function OPTIONS() { return corsOptions() }

/**
 * POST /api/v1/timer/stop
 * Stops the currently running timer for the authenticated user.
 * Applies workspace time rounding if configured.
 *
 * Body: {} (empty — always stops the running timer for this user)
 */
export async function POST(req: NextRequest) {
    const ctx = await verifyApiToken(req)
    if (!ctx) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const running = await prisma.timeEntry.findFirst({
        where: { userId: ctx.userId, timerStartedAt: { not: null } },
    })
    if (!running) {
        return withCors(NextResponse.json({ error: "No running timer" }, { status: 404 }))
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: ctx.workspaceId },
        select: { timeRounding: true },
    })

    const now = new Date()
    const rawDuration = Math.floor((now.getTime() - running.timerStartedAt!.getTime()) / 1000)
    const roundTo = (workspace?.timeRounding ?? 0) * 60
    const durationSeconds = roundTo > 0 ? Math.ceil(rawDuration / roundTo) * roundTo : rawDuration

    const entry = await prisma.timeEntry.update({
        where: { id: running.id },
        data: { timerStartedAt: null, durationSeconds },
        select: {
            id: true,
            date: true,
            durationSeconds: true,
            description: true,
            isBillable: true,
            project: { select: { id: true, name: true, code: true } },
            task: { select: { id: true, name: true } },
        },
    })

    return withCors(NextResponse.json(entry))
}

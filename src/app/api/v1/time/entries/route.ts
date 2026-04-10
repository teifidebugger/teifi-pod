import { NextRequest, NextResponse } from "next/server"
import { verifyApiToken } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { withCors, corsOptions } from "@/lib/cors"

export async function OPTIONS() { return corsOptions() }

/**
 * GET /api/v1/time/entries?date=yyyy-MM-dd
 * Returns all time entries for the authenticated user on the given date.
 * Includes both completed entries and any running timer.
 */
export async function GET(req: NextRequest) {
    const ctx = await verifyApiToken(req)
    if (!ctx) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const date = req.nextUrl.searchParams.get("date")
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return withCors(NextResponse.json({ error: "date param must be yyyy-MM-dd" }, { status: 400 }))
    }

    const entries = await prisma.timeEntry.findMany({
        where: { userId: ctx.userId, date },
        select: {
            id: true,
            date: true,
            durationSeconds: true,
            timerStartedAt: true,
            description: true,
            isBillable: true,
            energyLevel: true,
            approvalStatus: true,
            isLocked: true,
            project: { select: { id: true, name: true, code: true } },
            task: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
    })

    const result = entries.map(e => ({
        ...e,
        timerStartedAt: e.timerStartedAt?.toISOString() ?? null,
        // For running timers, compute elapsed seconds as durationSeconds
        durationSeconds: e.timerStartedAt
            ? Math.floor((Date.now() - e.timerStartedAt.getTime()) / 1000)
            : e.durationSeconds,
    }))

    return withCors(NextResponse.json(result))
}

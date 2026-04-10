import { NextRequest, NextResponse } from "next/server"
import { verifyApiToken } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { withCors, corsOptions } from "@/lib/cors"

export async function OPTIONS() { return corsOptions() }

/**
 * GET /api/v1/timer
 * Returns the currently running timer for the authenticated user, or null.
 */
export async function GET(req: NextRequest) {
    const ctx = await verifyApiToken(req)
    if (!ctx) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const entry = await prisma.timeEntry.findFirst({
        where: { userId: ctx.userId, timerStartedAt: { not: null } },
        select: {
            id: true,
            description: true,
            date: true,
            timerStartedAt: true,
            isBillable: true,
            project: { select: { id: true, name: true, code: true } },
            task: { select: { id: true, name: true } },
        },
    })

    if (!entry) return withCors(NextResponse.json(null))

    const elapsedSeconds = Math.floor((Date.now() - entry.timerStartedAt!.getTime()) / 1000)
    return withCors(NextResponse.json({ ...entry, elapsedSeconds }))
}

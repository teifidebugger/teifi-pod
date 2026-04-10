import { NextRequest, NextResponse } from "next/server"
import { verifyApiToken } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { withCors, corsOptions } from "@/lib/cors"

export async function OPTIONS() { return corsOptions() }

/**
 * GET /api/v1/issues/logged?linearIssueId=
 * Returns total time logged (in seconds) against a Linear issue,
 * plus a breakdown of entries. Used by the extension to show "Xh Xm logged".
 */
export async function GET(req: NextRequest) {
    const ctx = await verifyApiToken(req)
    if (!ctx) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const linearIssueId = req.nextUrl.searchParams.get("linearIssueId")
    if (!linearIssueId) {
        return withCors(NextResponse.json({ error: "linearIssueId is required" }, { status: 400 }))
    }

    const task = await prisma.teifiTask.findFirst({
        where: {
            linearIssueId,
            project: { workspaceId: ctx.workspaceId },
        },
        select: { id: true, name: true },
    })

    if (!task) {
        return withCors(NextResponse.json({ totalSeconds: 0, entries: [], task: null }))
    }

    const entries = await prisma.timeEntry.findMany({
        where: { taskId: task.id },
        select: {
            id: true,
            date: true,
            durationSeconds: true,
            description: true,
            user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { date: "desc" },
    })

    const totalSeconds = entries.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0)

    return withCors(NextResponse.json({ totalSeconds, entries, task }))
}

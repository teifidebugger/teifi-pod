import { NextRequest, NextResponse } from "next/server"
import { verifyApiToken } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { withCors, corsOptions } from "@/lib/cors"

export async function OPTIONS() {
    return corsOptions()
}

/**
 * GET /api/v1/me
 * Returns the authenticated user's profile and workspace info.
 */
export async function GET(req: NextRequest) {
    const ctx = await verifyApiToken(req)
    if (!ctx) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const [user, member, workspace] = await Promise.all([
        prisma.user.findUnique({
            where: { id: ctx.userId },
            select: { id: true, name: true, email: true, image: true },
        }),
        prisma.workspaceMember.findUnique({
            where: { id: ctx.memberId },
            select: { id: true, role: true, title: true, weeklyCapacityHours: true },
        }),
        prisma.workspace.findUnique({
            where: { id: ctx.workspaceId },
            select: { id: true, name: true, currency: true, timeFormat: true },
        }),
    ])

    if (!user || !member || !workspace) {
        return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }))
    }

    return withCors(NextResponse.json({ user, member, workspace }))
}

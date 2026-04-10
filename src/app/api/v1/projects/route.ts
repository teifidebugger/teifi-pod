import { NextRequest, NextResponse } from "next/server"
import { verifyApiToken } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { withCors, corsOptions } from "@/lib/cors"

export async function OPTIONS() { return corsOptions() }

/**
 * GET /api/v1/projects
 * Returns active projects the caller has access to, with their tasks.
 * Query params:
 *   status — "ACTIVE" | "PAUSED" | "all" (default: "ACTIVE")
 */
export async function GET(req: NextRequest) {
    const ctx = await verifyApiToken(req)
    if (!ctx) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const statusParam = req.nextUrl.searchParams.get("status") ?? "ACTIVE"
    const statusFilter =
        statusParam === "all"
            ? { in: ["ACTIVE", "PAUSED", "COMPLETED"] as import('@prisma/client').ProjectStatus[] }
            : { in: [statusParam] as import('@prisma/client').ProjectStatus[] }

    const projects = await prisma.teifiProject.findMany({
        where: { workspaceId: ctx.workspaceId, status: statusFilter },
        select: {
            id: true,
            name: true,
            code: true,
            status: true,
            billingType: true,
            billBy: true,
            client: { select: { id: true, name: true } },
            tasks: {
                where: { completed: false },
                select: { id: true, name: true, isBillable: true },
                orderBy: { name: "asc" },
            },
        },
        orderBy: { name: "asc" },
    })

    return withCors(NextResponse.json(projects))
}

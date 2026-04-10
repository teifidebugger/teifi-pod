import { NextRequest, NextResponse } from "next/server"
import { verifyApiToken } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { withCors, corsOptions } from "@/lib/cors"

export async function OPTIONS() { return corsOptions() }

/**
 * GET /api/v1/linear/resolve?identifier=VNM-183
 * Resolves a Linear issue identifier to a matching Teifi project + task.
 * Used by the Chrome extension for auto-matching Linear context.
 *
 * Resolution order:
 *   1. Look up LinearIssue by identifier → get UUID + teamId
 *   2. Find TeifiTask where linearIssueId = UUID
 *   3. If no task, find TeifiProject where linearTeamId = teamId
 */
export async function GET(req: NextRequest) {
    const ctx = await verifyApiToken(req)
    if (!ctx) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const identifier = req.nextUrl.searchParams.get("identifier") // e.g. "VNM-183"
    if (!identifier) {
        return withCors(NextResponse.json({ error: "identifier is required (e.g. VNM-183)" }, { status: 400 }))
    }

    // Step 1: Resolve identifier → LinearIssue (UUID + teamId)
    const linearIssue = await prisma.linearIssue.findFirst({
        where: { identifier },
        select: { id: true, identifier: true, title: true, teamId: true },
    })

    let project = null
    let task = null

    // Extract team key from identifier even if LinearIssue cache is empty (e.g. "VNM" from "VNM-192")
    const teamKeyFromIdentifier = identifier.split("-")[0]

    if (linearIssue) {
        // Step 2: Find task matched by linear issue UUID
        const matchedTask = await prisma.teifiTask.findFirst({
            where: {
                linearIssueId: linearIssue.id,
                project: { workspaceId: ctx.workspaceId, status: { in: ["ACTIVE", "PAUSED"] } },
            },
            select: {
                id: true,
                name: true,
                isBillable: true,
                project: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        billingType: true,
                        billBy: true,
                        client: { select: { id: true, name: true } },
                    },
                },
            },
        })

        if (matchedTask) {
            task = { id: matchedTask.id, name: matchedTask.name, isBillable: matchedTask.isBillable }
            project = matchedTask.project
        }

        // Step 3: Fall back to matching project by linearTeamId on TeifiProject
        if (!project) {
            project = await prisma.teifiProject.findFirst({
                where: {
                    workspaceId: ctx.workspaceId,
                    linearTeamId: linearIssue.teamId,
                    status: { in: ["ACTIVE", "PAUSED"] },
                },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    billingType: true,
                    billBy: true,
                    client: { select: { id: true, name: true } },
                },
            })
        }

        // Step 4: Fall back via ClientTeamSettings — linearTeamId → client → projects
        if (!project) {
            const teamSettings = await prisma.clientTeamSettings.findFirst({
                where: { linearTeamId: linearIssue.teamId },
                select: { clientId: true },
            })
            if (teamSettings) {
                project = await prisma.teifiProject.findFirst({
                    where: {
                        workspaceId: ctx.workspaceId,
                        clientId: teamSettings.clientId,
                        status: { in: ["ACTIVE", "PAUSED"] },
                    },
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        billingType: true,
                        billBy: true,
                        client: { select: { id: true, name: true } },
                    },
                })
            }
        }
    }

    // Fallback: if LinearIssue not in cache, match project via LinearTeam.key (e.g. "VNM")
    if (!project && teamKeyFromIdentifier) {
        const linearTeam = await prisma.linearTeam.findFirst({
            where: { key: teamKeyFromIdentifier },
            select: { id: true },
        })
        if (linearTeam) {
            // Try direct project link
            project = await prisma.teifiProject.findFirst({
                where: {
                    workspaceId: ctx.workspaceId,
                    linearTeamId: linearTeam.id,
                    status: { in: ["ACTIVE", "PAUSED"] },
                },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    billingType: true,
                    billBy: true,
                    client: { select: { id: true, name: true } },
                },
            })
            // Try via ClientTeamSettings
            if (!project) {
                const teamSettings = await prisma.clientTeamSettings.findFirst({
                    where: { linearTeamId: linearTeam.id },
                    select: { clientId: true },
                })
                if (teamSettings) {
                    project = await prisma.teifiProject.findFirst({
                        where: {
                            workspaceId: ctx.workspaceId,
                            clientId: teamSettings.clientId,
                            status: { in: ["ACTIVE", "PAUSED"] },
                        },
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            billingType: true,
                            billBy: true,
                            client: { select: { id: true, name: true } },
                        },
                    })
                }
            }
        }
    }

    const confidence: "exact" | "team" | "none" =
        task ? "exact" : project ? "team" : "none"

    return withCors(NextResponse.json({
        project,
        task,
        linearIssueId: linearIssue?.id ?? null,
        confidence,
    }))
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWorkspaceEmail } from "@/lib/email"
import { format, startOfMonth, endOfMonth } from "date-fns"

export const maxDuration = 60

/**
 * Budget alert cron — checks projects with notifyWhenOverBudget enabled.
 * Sends email when budget usage exceeds the project's overBudgetNotificationPercent.
 * Secured by CRON_SECRET header (same pattern as /api/cron/reminders).
 * Recommended schedule: every hour or daily.
 */
export async function GET(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
    const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret")
    if (secret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Find projects with budget alerts enabled, not archived, not alerted in last 24h
    const projects = await prisma.teifiProject.findMany({
        where: {
            notifyWhenOverBudget: true,
            status: { not: "ARCHIVED" },
            OR: [
                { lastBudgetAlertSentAt: null },
                { lastBudgetAlertSentAt: { lt: twentyFourHoursAgo } },
            ],
        },
        select: {
            id: true,
            name: true,
            workspaceId: true,
            budgetHours: true,
            feeCents: true,
            budgetCents: true,
            budgetIsMonthly: true,
            overBudgetNotificationPercent: true,
            manager: {
                select: {
                    user: { select: { email: true, name: true } },
                },
            },
            workspace: {
                select: {
                    members: {
                        where: { role: { in: ["OWNER", "ADMIN"] } },
                        select: {
                            user: { select: { email: true, name: true } },
                        },
                    },
                },
            },
        },
    })

    let sent = 0
    let checked = 0

    for (const project of projects) {
        checked++

        // Determine budget type and total
        let budgetType: "hours" | "fees"
        let totalBudget: number

        if (project.budgetHours && project.budgetHours > 0) {
            budgetType = "hours"
            totalBudget = project.budgetHours
        } else if (project.feeCents && project.feeCents > 0) {
            budgetType = "fees"
            totalBudget = project.feeCents
        } else if (project.budgetCents && project.budgetCents > 0) {
            budgetType = "fees"
            totalBudget = project.budgetCents
        } else {
            continue // No budget set
        }

        // Calculate usage — filter to current month when budgetIsMonthly is enabled
        const now = new Date()
        const dateFilter = project.budgetIsMonthly
            ? { gte: format(startOfMonth(now), "yyyy-MM-dd"), lte: format(endOfMonth(now), "yyyy-MM-dd") }
            : undefined

        let used: number
        if (budgetType === "hours") {
            const entries = await prisma.timeEntry.aggregate({
                where: { projectId: project.id, ...(dateFilter ? { date: dateFilter } : {}) },
                _sum: { durationSeconds: true },
            })
            const totalSeconds = entries._sum?.durationSeconds ?? 0
            used = Math.round((totalSeconds / 3600) * 100) / 100
        } else {
            // Fee-based: sum per-entry rate × hours (rates can differ per entry)
            const billableEntries = await prisma.timeEntry.findMany({
                where: { projectId: project.id, isBillable: true, ...(dateFilter ? { date: dateFilter } : {}) },
                select: { durationSeconds: true, billableRateCents: true },
            })
            used = billableEntries.reduce((sum, e) => sum + ((e.durationSeconds ?? 0) / 3600) * (e.billableRateCents ?? 0), 0)
        }

        const percentUsed = Math.round((used / totalBudget) * 100)
        const threshold = project.overBudgetNotificationPercent ?? 80

        if (percentUsed < threshold) continue

        // Format display values
        let usedDisplay: string
        let totalDisplay: string
        if (budgetType === "hours") {
            usedDisplay = `${used}h`
            totalDisplay = `${totalBudget}h`
        } else {
            usedDisplay = `$${(used / 100).toFixed(2)}`
            totalDisplay = `$${(totalBudget / 100).toFixed(2)}`
        }

        // Collect recipients: project manager + OWNER/ADMIN members
        const recipients: Array<{ email: string; name: string }> = []

        if (project.manager?.user.email) {
            recipients.push({
                email: project.manager.user.email,
                name: project.manager.user.name ?? project.manager.user.email,
            })
        }

        for (const m of project.workspace.members) {
            if (m.user.email && !recipients.some(r => r.email === m.user.email)) {
                recipients.push({
                    email: m.user.email,
                    name: m.user.name ?? m.user.email,
                })
            }
        }

        const projectUrl = `${appUrl}/projects/${project.id}`
        const sentBefore = sent

        const results = await Promise.allSettled(
            recipients.map(recipient =>
                sendWorkspaceEmail(project.workspaceId, {
                    type: "budget-alert",
                    recipientEmail: recipient.email,
                    recipientName: recipient.name,
                    projectName: project.name,
                    projectUrl,
                    percentUsed,
                    budgetType,
                    used: usedDisplay,
                    total: totalDisplay,
                })
            )
        )
        for (const r of results) {
            if (r.status === "fulfilled") sent++
            else console.error("[budget-alerts] Failed to send:", r.reason)
        }

        // Only mark as alerted if at least one email was delivered successfully
        if (sent > sentBefore) {
            await prisma.teifiProject.update({
                where: { id: project.id },
                data: { lastBudgetAlertSentAt: new Date() },
            })
        }
    }

    return NextResponse.json({ sent, checked, projectsFound: projects.length })
}

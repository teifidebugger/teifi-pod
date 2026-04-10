import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWorkspaceEmail } from "@/lib/email"
import { format } from "date-fns"

export const maxDuration = 60

// Secured by CRON_SECRET header — call this from Vercel Cron or equivalent scheduler
// Recommended schedule: every hour (it checks workspace reminderTime + reminderDays internally)
export async function GET(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
    const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret")
    if (secret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentDay = now.getDay() // 0=Sun..6=Sat
    const todayStr = format(now, "yyyy-MM-dd")

    // Find workspaces with reminders enabled
    const workspaces = await prisma.workspace.findMany({
        where: { reminderEnabled: true },
        select: {
            id: true,
            name: true,
            reminderTime: true,
            reminderDays: true,
            members: {
                select: {
                    id: true,
                    user: { select: { id: true, name: true, email: true } },
                },
            },
        },
    })

    let sent = 0
    let skipped = 0

    for (const ws of workspaces) {
        // Parse reminder time "HH:mm"
        const [remHour, remMin] = ws.reminderTime.split(":").map(Number)
        if (remHour === undefined || remMin === undefined) continue

        // Only fire within the correct hour window (±30 min of target)
        const targetMinutes = remHour * 60 + remMin
        const currentMinutes = currentHour * 60 + currentMinute
        if (Math.abs(currentMinutes - targetMinutes) > 30) {
            skipped++
            continue
        }

        // Check if today is a reminder day
        const reminderDays = ws.reminderDays.split(",").map(Number)
        if (!reminderDays.includes(currentDay)) {
            skipped++
            continue
        }

        // Find members who have 0 time entries today
        const memberIds = ws.members.map((m) => m.id)

        const membersWithEntries = await prisma.timeEntry.findMany({
            where: {
                project: { workspaceId: ws.id },
                date: todayStr,
                userId: { in: ws.members.map((m) => m.user.id) },
            },
            select: { userId: true },
            distinct: ["userId"],
        })

        const loggedUserIds = new Set(membersWithEntries.map((e) => e.userId))

        const membersToRemind = ws.members.filter(m => !loggedUserIds.has(m.user.id) && m.user.email)
        const results = await Promise.allSettled(
            membersToRemind.map(member =>
                sendWorkspaceEmail(ws.id, {
                    type: "time-reminder",
                    recipientEmail: member.user.email!,
                    recipientName: member.user.name ?? member.user.email!,
                    workspaceName: ws.name,
                    appUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
                })
            )
        )
        for (const r of results) {
            if (r.status === "fulfilled") sent++
            else console.error("[reminders] Failed to send:", r.reason)
        }
    }

    return NextResponse.json({ sent, skipped, workspacesChecked: workspaces.length })
}

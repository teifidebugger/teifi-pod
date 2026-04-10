import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/app/actions"
import { redirect } from "next/navigation"
import { UtilizationView } from "./UtilizationView"
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subWeeks,
    subMonths,
    format,
    eachDayOfInterval,
    getDay,
} from "date-fns"
import { cacheLife } from "next/dist/server/use-cache/cache-life"

type Period = "this_week" | "last_4_weeks" | "this_month" | "last_3_months"

function getDateRange(period: Period, weekStartsOn: 0 | 1): { start: Date; end: Date; weeksInPeriod: number } {
    const now = new Date()

    switch (period) {
        case "this_week":
            return {
                start: startOfWeek(now, { weekStartsOn }),
                end: endOfWeek(now, { weekStartsOn }),
                weeksInPeriod: 1,
            }
        case "last_4_weeks":
            return {
                start: startOfWeek(subWeeks(now, 3), { weekStartsOn }),
                end: endOfWeek(now, { weekStartsOn }),
                weeksInPeriod: 4,
            }
        case "this_month": {
            const monthStart = startOfMonth(now)
            const monthEnd = endOfMonth(now)
            const daysInMonth = monthEnd.getDate()
            return {
                start: monthStart,
                end: monthEnd,
                weeksInPeriod: daysInMonth / 7,
            }
        }
        case "last_3_months":
            return {
                start: startOfWeek(subMonths(now, 3), { weekStartsOn }),
                end: endOfWeek(now, { weekStartsOn }),
                weeksInPeriod: 13,
            }
        default:
            return {
                start: startOfWeek(subWeeks(now, 3), { weekStartsOn }),
                end: endOfWeek(now, { weekStartsOn }),
                weeksInPeriod: 4,
            }
    }
}

/** Count working days (Mon–Fri) in the range that are workspace holidays. */
function countHolidayWorkingDays(holidays: string[], start: Date, end: Date): number {
    const holidaySet = new Set(holidays)
    return eachDayOfInterval({ start, end }).filter((d) => {
        const dow = getDay(d)
        return dow !== 0 && dow !== 6 && holidaySet.has(format(d, "yyyy-MM-dd"))
    }).length
}

async function fetchUtilizationData(workspaceId: string, startDate: string, endDate: string) {
    "use cache"
    cacheLife("hours")

    const [members, entries, workspaceHolidays] = await Promise.all([
        prisma.workspaceMember.findMany({
            where: { workspaceId, disabledAt: null },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
            orderBy: { joinedAt: "asc" },
        }),
        prisma.timeEntry.findMany({
            where: {
                project: { workspaceId },
                date: { gte: startDate, lte: endDate },
                timerStartedAt: null,
            },
            select: {
                userId: true,
                durationSeconds: true,
                isBillable: true,
            },
        }),
        prisma.workspaceHoliday.findMany({
            where: {
                workspaceId,
                date: { gte: startDate, lte: endDate },
            },
            select: { date: true },
        }),
    ])

    return { members, entries, workspaceHolidays }
}

export default async function UtilizationPage({
    searchParams,
}: {
    searchParams: Promise<{ period?: string }>
}) {
    const user = await getSessionUser().catch(() => null)
    if (!user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        select: { workspaceId: true },
    })
    if (!member) redirect("/")

    const workspace = await prisma.workspace.findFirst({
        where: { id: member.workspaceId },
        select: { weekStartDay: true },
    })
    const weekStartsOn = (workspace?.weekStartDay ?? 1) as 0 | 1

    const params = await searchParams
    const rawPeriod = params.period
    const validPeriods: Period[] = ["this_week", "last_4_weeks", "this_month", "last_3_months"]
    const period: Period = validPeriods.includes(rawPeriod as Period)
        ? (rawPeriod as Period)
        : "last_4_weeks"

    const { start, end, weeksInPeriod } = getDateRange(period, weekStartsOn)

    const { members, entries, workspaceHolidays } = await fetchUtilizationData(
        member.workspaceId,
        format(start, "yyyy-MM-dd"),
        format(end, "yyyy-MM-dd"),
    )

    const holidayDaysInPeriod = countHolidayWorkingDays(
        workspaceHolidays.map((h) => h.date),
        start,
        end,
    )

    // Compute per-member stats
    const memberStats = members.map(m => {
        const weeklyCapacityHours = (m as typeof m & { weeklyCapacityHours?: number }).weeklyCapacityHours ?? 40
        const dailyCapacityHours = weeklyCapacityHours / 5
        // Deduct workspace holidays (non-working days) from capacity
        const capacityHours = weeklyCapacityHours * weeksInPeriod - holidayDaysInPeriod * dailyCapacityHours
        const memberEntries = entries.filter(e => e.userId === m.userId)
        const trackedSeconds = memberEntries.reduce((s, e) => s + e.durationSeconds, 0)
        const trackedHours = trackedSeconds / 3600
        const billableSeconds = memberEntries
            .filter(e => e.isBillable)
            .reduce((s, e) => s + e.durationSeconds, 0)
        const billableHours = billableSeconds / 3600
        const utilization = capacityHours > 0 ? (trackedHours / capacityHours) * 100 : 0
        const billablePct = trackedHours > 0 ? (billableHours / trackedHours) * 100 : 0

        return {
            id: m.id,
            userId: m.userId,
            name: m.user.name ?? m.user.email,
            email: m.user.email,
            image: m.user.image,
            role: m.role as string,
            roles: m.roles,
            capacityHours,
            trackedHours,
            billableHours,
            utilization,
            billablePct,
        }
    })

    // Sort by utilization descending
    memberStats.sort((a, b) => b.utilization - a.utilization)

    // Summary stats
    const totalMembers = memberStats.length
    const avgUtilization =
        totalMembers > 0
            ? memberStats.reduce((s, m) => s + m.utilization, 0) / totalMembers
            : 0
    const fullyUtilized = memberStats.filter(m => m.utilization >= 80).length
    const underUtilized = memberStats.filter(m => m.utilization < 40).length

    return (
        <div className="flex-1 space-y-6 pt-6">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">Team Utilization</h2>
                <p className="text-muted-foreground mt-1">
                    Per-member time utilization against weekly capacity.
                </p>
            </div>
            <UtilizationView
                period={period}
                memberStats={memberStats}
                summary={{
                    totalMembers,
                    avgUtilization,
                    fullyUtilized,
                    underUtilized,
                }}
                weeksInPeriod={weeksInPeriod}
            />
        </div>
    )
}

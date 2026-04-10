import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/app/actions"
import { redirect } from "next/navigation"
import { CapacityView } from "./CapacityView"
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval, getDay } from "date-fns"
import { cacheLife } from "next/dist/server/use-cache/cache-life"

export interface WeekRange {
    label: string
    startDate: string // ISO yyyy-MM-dd
    endDate: string   // ISO yyyy-MM-dd
}

export interface MemberWeekData {
    weekLabel: string
    allocatedHours: number
    trackedHours: number
    capacityHours: number
    utilizationPct: number
    allocationPct: number
}

export interface MemberCapacityRow {
    memberId: string
    userId: string
    name: string
    email: string
    image: string | null
    role: string
    weeklyCapacityHours: number
    weeks: MemberWeekData[]
}

/** Count Mon–Fri days that fall within [rangeStart, rangeEnd] */
function countWorkdays(rangeStart: Date, rangeEnd: Date): number {
    let days = 0
    const cur = new Date(rangeStart)
    while (cur <= rangeEnd) {
        const dow = cur.getDay()
        if (dow !== 0 && dow !== 6) days++
        cur.setDate(cur.getDate() + 1)
    }
    return days
}

function overlapWorkdayHours(
    allocStart: Date,
    allocEnd: Date,
    weekStart: Date,
    weekEnd: Date,
    hoursPerDay: number,
): number {
    const start = allocStart < weekStart ? weekStart : allocStart
    const end = allocEnd > weekEnd ? weekEnd : allocEnd
    if (start > end) return 0
    return countWorkdays(start, end) * hoursPerDay
}

async function fetchCapacityData(
    workspaceId: string,
    periodStartStr: string,
    periodEndDate: Date,
    startDate: string,
    endDate: string,
) {
    "use cache"
    cacheLife("hours")

    const [members, allocations, timeEntries, workspaceHolidays, memberTimeOffs] = await Promise.all([
        prisma.workspaceMember.findMany({
            where: { workspaceId, disabledAt: null },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
            orderBy: { joinedAt: "asc" },
        }),
        prisma.allocation.findMany({
            where: {
                member: { workspaceId },
                startDate: { lte: periodEndDate },
                endDate: { gte: new Date(periodStartStr) },
            },
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
                date: true,
            },
        }),
        prisma.workspaceHoliday.findMany({
            where: {
                workspaceId,
                date: { gte: startDate, lte: endDate },
            },
            select: { date: true },
        }),
        prisma.memberTimeOff.findMany({
            where: {
                member: { workspaceId },
                date: { gte: startDate, lte: endDate },
            },
            select: { memberId: true, date: true },
        }),
    ])

    return { members, allocations, timeEntries, workspaceHolidays, memberTimeOffs }
}

export default async function CapacityPage({
    searchParams,
}: {
    searchParams: Promise<{ weeks?: string }>
}) {
    const user = await getSessionUser().catch(() => null)
    if (!user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    const canSeeBudget = ["OWNER", "ADMIN", "MANAGER"].includes(member.role ?? "")
    if (!canSeeBudget) redirect("/reports")

    const params = await searchParams
    const rawWeeks = parseInt(params.weeks ?? "8", 10)
    const weekCount = [4, 8, 12].includes(rawWeeks) ? rawWeeks : 8

    // Generate last N Monday–Sunday ranges (oldest first)
    const now = new Date()
    const weeks: WeekRange[] = []
    for (let i = weekCount - 1; i >= 0; i--) {
        const refDay = subWeeks(now, i)
        const wStart = startOfWeek(refDay, { weekStartsOn: 1 })
        const wEnd = endOfWeek(refDay, { weekStartsOn: 1 })
        weeks.push({
            label: `${format(wStart, "MMM d")}–${format(wEnd, "d")}`,
            startDate: format(wStart, "yyyy-MM-dd"),
            endDate: format(wEnd, "yyyy-MM-dd"),
        })
    }

    const periodStart = new Date(weeks[0].startDate)
    const periodEnd = new Date(weeks[weeks.length - 1].endDate)
    // Extend end to end of day
    periodEnd.setHours(23, 59, 59, 999)

    const { members, allocations, timeEntries, workspaceHolidays, memberTimeOffs } =
        await fetchCapacityData(
            member.workspaceId,
            weeks[0].startDate,
            periodEnd,
            weeks[0].startDate,
            weeks[weeks.length - 1].endDate,
        )

    // Pre-build a Set of workspace holiday dates for O(1) lookup
    const holidayDateSet = new Set(workspaceHolidays.map(h => h.date))

    const rows: MemberCapacityRow[] = members.map(m => {
        const weeklyCapacityHours = m.weeklyCapacityHours ?? 40
        const dailyCapacityHours = weeklyCapacityHours / 5
        const memberAllocs = allocations.filter(a => a.memberId === m.id)
        const memberEntries = timeEntries.filter(e => e.userId === m.userId)
        const memberTimeOffDates = new Set(
            memberTimeOffs.filter(t => t.memberId === m.id).map(t => t.date)
        )

        const weekData: MemberWeekData[] = weeks.map(w => {
            const wStart = new Date(w.startDate)
            const wEnd = new Date(w.endDate)
            wEnd.setHours(23, 59, 59, 999)

            // Deduct workspace holidays and member time-off (weekdays only) from capacity
            const nonWorkingDays = eachDayOfInterval({ start: wStart, end: new Date(w.endDate) })
                .filter(d => {
                    const dow = getDay(d)
                    if (dow === 0 || dow === 6) return false
                    const dateStr = format(d, "yyyy-MM-dd")
                    return holidayDateSet.has(dateStr) || memberTimeOffDates.has(dateStr)
                }).length
            const capacityHours = Math.max(0, weeklyCapacityHours - nonWorkingDays * dailyCapacityHours)

            // Allocated hours: sum overlap of each allocation with this week
            const allocatedHours = memberAllocs.reduce((sum, alloc) => {
                return sum + overlapWorkdayHours(
                    alloc.startDate,
                    alloc.endDate,
                    wStart,
                    new Date(w.endDate), // date boundary, no time
                    alloc.hoursPerDay,
                )
            }, 0)

            // Tracked hours: time entries whose date falls in this week
            const trackedHours = memberEntries
                .filter(e => e.date >= w.startDate && e.date <= w.endDate)
                .reduce((sum, e) => sum + e.durationSeconds / 3600, 0)

            const utilizationPct = capacityHours > 0 ? (trackedHours / capacityHours) * 100 : 0
            const allocationPct = capacityHours > 0 ? (allocatedHours / capacityHours) * 100 : 0

            return {
                weekLabel: w.label,
                allocatedHours,
                trackedHours,
                capacityHours,
                utilizationPct,
                allocationPct,
            }
        })

        return {
            memberId: m.id,
            userId: m.userId,
            name: m.user.name ?? m.user.email,
            email: m.user.email,
            image: m.user.image,
            role: m.role as string,
            weeklyCapacityHours: weeklyCapacityHours,
            weeks: weekData,
        }
    })

    return (
        <div className="flex-1 space-y-6 pt-6">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">Capacity Overview</h2>
                <p className="text-muted-foreground mt-1">
                    Portfolio-wide allocation and utilization heatmap per team member.
                </p>
            </div>
            <CapacityView rows={rows} weeks={weeks} weekCount={weekCount} />
        </div>
    )
}

import { addDays, format } from "date-fns"
import type { Range } from "dnd-timeline"
import { COLOR_HEX_MAP } from "@/lib/project-colors"
import { avatarColor } from "@/lib/avatar-color"

// ─── Types ────────────────────────────────────────────────────────────────────

export type GanttAllocation = {
    id: string
    memberId: string | null
    placeholderId: string | null
    projectId: string
    startDate: string
    endDate: string
    hoursPerDay: number
    type: "SOFT" | "HARD"
    notes: string | null
    member: { id: string; name: string; image: string | null }
    isPlaceholder: boolean
}

export type GanttProject = {
    id: string
    name: string
    color: string
    clientName: string | null
    clientId: string | null
    isTentative?: boolean
    allocations: GanttAllocation[]
    // Fields for Edit dialog
    code: string | null
    description: string | null
    status: string
    billingType: string
    billBy: string
    hourlyRateCents: number | null
    budgetHours: number | null
    budgetCents: number | null
    feeCents: number | null
    budgetBy: string
    costBudgetCents: number | null
    costBudgetIncludeExpenses: boolean
    notifyWhenOverBudget: boolean
    overBudgetNotificationPercent: number
    startsOn: string | null
    endsOn: string | null
    budgetIsMonthly: boolean
    showBudgetToAll: boolean
    managerId: string | null
}

export type Member = { id: string; name: string; weeklyCapacityHours?: number }
export type PlaceholderRef = { id: string; name: string; weeklyCapacityHours?: number }
export type Project = { id: string; name: string; clientName?: string | null }
export type ClientOption = { id: string; name: string }
export type ManagerOption = { id: string; name: string | null; email: string; role: string }

// ─── Constants ────────────────────────────────────────────────────────────────

export const SIDEBAR_WIDTH = 256
export const BAR_HEIGHT = 32
export const BAR_GAP = 4
export const PROJ_ROW_PAD = 4
export const DAY_MS = 24 * 60 * 60 * 1000
export const SIX_HOURS_MS = 6 * 60 * 60 * 1000

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getAvatarColors(name: string): string {
    const { bg, text } = avatarColor(name)
    return `${bg} ${text}`
}

export function projectHex(colorKey: string | null | undefined): string {
    return COLOR_HEX_MAP[colorKey ?? "blue"] ?? "#3b82f6"
}

export function barStyle(colorKey: string | null | undefined, isSoft: boolean): React.CSSProperties {
    const hex = projectHex(colorKey)
    return isSoft
        ? { backgroundColor: `${hex}30`, borderColor: hex, color: hex }
        : { backgroundColor: `${hex}cc`, borderColor: `${hex}99`, color: "#ffffff" }
}

export function countWorkingDays(start: string, end: string): number {
    if (!start || !end || end < start) return 0
    const cur = new Date(start + "T00:00:00")
    const e = new Date(end + "T00:00:00")
    let count = 0
    while (cur <= e) {
        const dow = cur.getDay()
        if (dow !== 0 && dow !== 6) count++
        cur.setDate(cur.getDate() + 1)
    }
    return count
}

export function computeRange(zoomDays: number, offsetDays: number): Range {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = addDays(today, offsetDays)
    return { start: start.getTime(), end: addDays(start, zoomDays).getTime() }
}

export function buildDates(range: Range): string[] {
    const dates: string[] = []
    const cur = new Date(range.start)
    while (cur.getTime() < range.end) {
        dates.push(format(cur, "yyyy-MM-dd"))
        cur.setDate(cur.getDate() + 1)
    }
    return dates
}

export function groupByPerson(allocs: GanttAllocation[]) {
    const map = new Map<string, {
        personId: string
        personName: string
        image: string | null
        isPlaceholder: boolean
        allocs: GanttAllocation[]
    }>()
    for (const alloc of allocs) {
        const id = alloc.memberId ?? alloc.placeholderId ?? alloc.id
        if (!map.has(id)) {
            map.set(id, {
                personId: id,
                personName: alloc.member.name,
                image: alloc.member.image,
                isPlaceholder: alloc.isPlaceholder,
                allocs: [],
            })
        }
        map.get(id)!.allocs.push(alloc)
    }
    return [...map.values()].sort((a, b) => a.personName.localeCompare(b.personName))
}

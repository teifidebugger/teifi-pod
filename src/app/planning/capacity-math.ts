import { addDays, parseISO, startOfWeek, format, addWeeks } from "date-fns"
import type { PodMember, HeatmapCell, LiveAllocation, SimulationBlock } from "./types"

export function getWeekMondays(count: number, fromDate: Date = new Date()): Date[] {
  const start = startOfWeek(fromDate, { weekStartsOn: 1 })
  return Array.from({ length: count }, (_, i) => addWeeks(start, i))
}

export function countWorkingDays(weekMonday: Date, holidays: string[], memberTimeOff: string[]): number {
  let count = 0
  for (let i = 0; i < 5; i++) {
    const day = addDays(weekMonday, i)
    const dateStr = format(day, "yyyy-MM-dd")
    if (!holidays.includes(dateStr) && !memberTimeOff.includes(dateStr)) {
      count++
    }
  }
  return count
}

export function computeCeiling(
  skill: string,
  weekMonday: Date,
  members: PodMember[],
  holidays: string[]
): number {
  let total = 0
  for (const m of members) {
    if (!m.roles.includes(skill)) continue
    const workingDays = countWorkingDays(weekMonday, holidays, m.timeOffDates)
    total += (m.weeklyCapacityHours / 5) * workingDays
  }
  return total
}

export function computeLiveLoad(
  skill: string,
  weekMonday: Date,
  members: PodMember[],
  allocations: LiveAllocation[],
  holidays: string[]
): number {
  const memberIds = new Set(members.filter(m => m.roles.includes(skill)).map(m => m.id))
  let total = 0
  for (const alloc of allocations) {
    if (!memberIds.has(alloc.memberId)) continue
    const member = members.find(m => m.id === alloc.memberId)
    if (!member) continue
    const allocStart = parseISO(alloc.startDate)
    const allocEnd = parseISO(alloc.endDate)
    for (let i = 0; i < 5; i++) {
      const day = addDays(weekMonday, i)
      const dateStr = format(day, "yyyy-MM-dd")
      if (day >= allocStart && day <= allocEnd && !holidays.includes(dateStr) && !member.timeOffDates.includes(dateStr)) {
        total += alloc.hoursPerDay
      }
    }
  }
  return total
}

export function computePipelineLoad(
  skill: string,
  weekStart: string,
  blocks: SimulationBlock[]
): number {
  let total = 0
  for (const block of blocks) {
    const blockWeeks = Array.from({ length: block.durationWeeks }, (_, i) => {
      const monday = addWeeks(parseISO(block.startWeek), i)
      return format(monday, "yyyy-MM-dd")
    })
    if (blockWeeks.includes(weekStart)) {
      total += block.skillDemandPerWeek[skill] ?? 0
    }
  }
  return total
}

export function buildHeatmap(
  skills: string[],
  weeks: Date[],
  members: PodMember[],
  allocations: LiveAllocation[],
  blocks: SimulationBlock[],
  holidays: string[]
): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  for (const skill of skills) {
    for (const weekMonday of weeks) {
      const weekStart = format(weekMonday, "yyyy-MM-dd")
      const ceiling = computeCeiling(skill, weekMonday, members, holidays)
      const liveLoad = computeLiveLoad(skill, weekMonday, members, allocations, holidays)
      const pipelineLoad = computePipelineLoad(skill, weekStart, blocks)
      cells.push({
        skill,
        weekStart,
        ceiling,
        liveLoad,
        pipelineLoad,
        remaining: ceiling - liveLoad - pipelineLoad,
      })
    }
  }
  return cells
}

export function computeDefaultDuration(project: { budgetHours: number | null }, demandPerWeek: number): number {
  if (!project.budgetHours || demandPerWeek <= 0) return 4
  return Math.max(1, Math.ceil(project.budgetHours / demandPerWeek))
}

export function computeSmartDemand(
  skills: string[],
  cells: HeatmapCell[],
  startWeek: string,
  durationWeeks: number
): Record<string, number> {
  const demand: Record<string, number> = {}
  for (const skill of skills) {
    const relevant = cells.filter(c => c.skill === skill && c.weekStart >= startWeek).slice(0, durationWeeks)
    const avgRemaining = relevant.length > 0
      ? relevant.reduce((s, c) => s + Math.max(0, c.remaining), 0) / relevant.length
      : 0
    demand[skill] = Math.round(avgRemaining * 0.5) // suggest 50% of available
  }
  return demand
}

"use client"

import { useMemo } from "react"
import { format, startOfWeek, addWeeks, parseISO } from "date-fns"
import { WeekHeader } from "./WeekHeader"
import { SkillRowLabel } from "./SkillRowLabel"
import { HeatmapCell } from "./HeatmapCell"
import type { HeatmapCell as HeatmapCellType, SimulationBlock, PlanProject } from "./types"

const SKILL_LABEL_WIDTH = 150

interface CapacityHeatmapProps {
  skills: string[]
  weeks: Date[]
  cells: HeatmapCellType[]
  blocks: SimulationBlock[]
  projects: PlanProject[]
  showPipeline: boolean
  onRemoveBlock: (blockId: string) => void
}

export function CapacityHeatmap({ skills, weeks, cells, blocks, projects, showPipeline, onRemoveBlock }: CapacityHeatmapProps) {
  const todayWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")

  // Pre-compute Map<skill, HeatmapCellType[]> to avoid O(n) filter per skill in render
  const cellsBySkill = useMemo(() => {
    const map = new Map<string, HeatmapCellType[]>()
    for (const cell of cells) {
      const arr = map.get(cell.skill)
      if (arr) {
        arr.push(cell)
      } else {
        map.set(cell.skill, [cell])
      }
    }
    return map
  }, [cells])

  // Pre-compute Map<blockId, Set<weekDateString>> to avoid repeated date parsing per skill×week
  const blockWeekSets = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const block of blocks) {
      const weeks = new Set<string>()
      for (let i = 0; i < block.durationWeeks; i++) {
        weeks.add(format(addWeeks(parseISO(block.startWeek), i), "yyyy-MM-dd"))
      }
      map.set(block.id, weeks)
    }
    return map
  }, [blocks])

  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <p className="text-sm font-medium text-muted-foreground">No skill roles in this POD</p>
        <p className="text-xs text-muted-foreground/70">Members in this POD have no skill tags assigned.</p>
        <a href="/schedule/roles" className="text-xs underline text-primary">Add roles</a>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="sticky top-[46px] z-20">
        <WeekHeader weeks={weeks} todayWeekStart={todayWeekStart} skillLabelWidth={SKILL_LABEL_WIDTH} />
      </div>
      {skills.map(skill => {
        const skillCells = cellsBySkill.get(skill) ?? []
        return (
          <div key={skill} className="flex border-b last:border-b-0 min-h-[56px]">
            <SkillRowLabel skill={skill} width={SKILL_LABEL_WIDTH} />
            <div className="flex flex-1">
              {weeks.map(week => {
                const weekStart = format(week, "yyyy-MM-dd")
                const cell = skillCells.find(c => c.weekStart === weekStart) ?? {
                  skill, weekStart, ceiling: 0, liveLoad: 0, pipelineLoad: 0, remaining: 0,
                }
                const blocksHere = blocks.filter(b =>
                  (blockWeekSets.get(b.id)?.has(weekStart) ?? false) &&
                  (b.skillDemandPerWeek[skill] ?? 0) > 0
                )
                return (
                  <HeatmapCell
                    key={weekStart}
                    cell={cell}
                    blocksThisCell={blocksHere}
                    showPipeline={showPipeline}
                    projects={projects}
                    onRemoveBlock={onRemoveBlock}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

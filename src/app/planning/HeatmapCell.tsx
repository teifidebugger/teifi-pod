"use client"

import { useDroppable } from "@dnd-kit/core"
import { CellTooltip } from "./CellTooltip"
import { BlockOverlay } from "./BlockOverlay"
import type { HeatmapCell as HeatmapCellType, SimulationBlock, PlanProject } from "./types"

interface HeatmapCellProps {
  cell: HeatmapCellType
  blocksThisCell: SimulationBlock[]
  showPipeline: boolean
  projects: PlanProject[]
  onRemoveBlock: (blockId: string) => void
}

function cellColor(cell: HeatmapCellType): string {
  if (cell.ceiling === 0) return "bg-muted/20 border-border"
  const pct = cell.remaining / cell.ceiling
  if (cell.remaining <= 0) return "bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-700"
  if (pct < 0.5) return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-600"
  return "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-700"
}

function cellTextColor(cell: HeatmapCellType): string {
  if (cell.ceiling === 0) return "text-muted-foreground/40"
  const pct = cell.remaining / cell.ceiling
  if (cell.remaining <= 0) return "text-red-700 font-semibold dark:text-red-400"
  if (pct < 0.5) return "text-amber-700 dark:text-amber-400"
  return "text-green-700 dark:text-green-400"
}

export function HeatmapCell({ cell, blocksThisCell, showPipeline, projects, onRemoveBlock }: HeatmapCellProps) {
  const droppableId = `cell-${encodeURIComponent(cell.skill)}-${cell.weekStart}`
  const { setNodeRef, isOver } = useDroppable({ id: droppableId, data: { skill: cell.skill, weekStart: cell.weekStart } })

  const livePct = cell.ceiling > 0 ? Math.min(1, cell.liveLoad / cell.ceiling) : 0
  const pipePct = cell.ceiling > 0 ? Math.min(1 - livePct, cell.pipelineLoad / cell.ceiling) : 0

  return (
    <CellTooltip cell={cell}>
      <div
        ref={setNodeRef}
        className={`flex-1 min-w-[80px] border-r last:border-r-0 border p-1.5 transition-colors flex flex-col gap-1 min-h-[56px] ${cellColor(cell)} ${isOver ? "ring-2 ring-primary ring-inset" : ""}`}
      >
        {cell.ceiling === 0 ? (
          <span className="text-xs text-muted-foreground/40 text-center w-full">&mdash;</span>
        ) : (
          <>
            <span className={`text-xs font-medium tabular-nums text-center ${cellTextColor(cell)}`}>
              {cell.remaining >= 0 ? "+" : ""}{cell.remaining.toFixed(0)}h
            </span>
            <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div className="h-full flex">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${livePct * 100}%` }} />
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${pipePct * 100}%`,
                    background: "repeating-linear-gradient(45deg,rgb(251 191 36),rgb(251 191 36) 2px,transparent 2px,transparent 6px)",
                  }}
                />
              </div>
            </div>
          </>
        )}
        {showPipeline && blocksThisCell.map(block => {
          const project = projects.find(p => p.id === block.projectId)
          if (!project) return null
          return (
            <BlockOverlay
              key={block.id}
              block={block}
              projectName={project.name}
              projectColor={project.color}
              hoursThisWeek={block.skillDemandPerWeek[cell.skill] ?? 0}
              onRemove={() => onRemoveBlock(block.id)}
            />
          )
        })}
      </div>
    </CellTooltip>
  )
}

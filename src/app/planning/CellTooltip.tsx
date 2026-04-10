"use client"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import type { HeatmapCell } from "./types"
import { format, addDays, parseISO } from "date-fns"

interface CellTooltipProps {
  cell: HeatmapCell
  children: React.ReactNode
}

export function CellTooltip({ cell, children }: CellTooltipProps) {
  const weekEnd = addDays(parseISO(cell.weekStart), 4)
  const label = `${format(parseISO(cell.weekStart), "MMM d")} \u2013 ${format(weekEnd, "MMM d, yyyy")}`
  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-52 text-sm" side="top">
        <p className="font-medium mb-2">{cell.skill} &middot; {label}</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ceiling</span>
            <span className="font-mono">{cell.ceiling.toFixed(1)}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Live load</span>
            <span className="font-mono text-green-600">&minus;{cell.liveLoad.toFixed(1)}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pipeline</span>
            <span className="font-mono text-amber-600">&minus;{cell.pipelineLoad.toFixed(1)}h</span>
          </div>
          <div className="border-t pt-1 flex justify-between font-medium">
            <span>Remaining</span>
            <span className={`font-mono ${cell.remaining < 0 ? "text-red-600" : cell.remaining < cell.ceiling * 0.5 ? "text-amber-600" : "text-green-600"}`}>
              {cell.remaining >= 0 ? "+" : ""}{cell.remaining.toFixed(1)}h
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

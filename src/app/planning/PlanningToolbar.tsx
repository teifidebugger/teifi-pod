"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RotateCcw, Send } from "lucide-react"
import { ScenarioDropdown } from "./ScenarioDropdown"
import type { ScenarioSummary, SimulationState } from "./types"

interface PlanningToolbarProps {
  pods: string[]
  state: SimulationState
  scenarios: ScenarioSummary[]
  hasBlocks: boolean
  onPodChange: (pod: string | null) => void
  onWeekRangeChange: (w: 4 | 8 | 12 | 26) => void
  onTogglePipeline: () => void
  onCommit: () => void
  onSave: () => void
  onSaveAs: (name: string) => void
  onLoadScenario: (scenarioId: string) => void
  onDeleteScenario: (scenarioId: string) => void
  onReset: () => void
}

export function PlanningToolbar({
  pods, state, scenarios, hasBlocks,
  onPodChange, onWeekRangeChange, onTogglePipeline, onCommit,
  onSave, onSaveAs, onLoadScenario, onDeleteScenario, onReset,
}: PlanningToolbarProps) {
  return (
    <div className="sticky top-0 z-30 flex h-[46px] items-center gap-3 border-b bg-background/95 backdrop-blur px-4 shrink-0">
      {/* POD selector */}
      <Select
        value={state.podFilter ?? "__all__"}
        onValueChange={v => onPodChange(v === "__all__" ? null : v)}
      >
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue placeholder="All workspace" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All workspace</SelectItem>
          {pods.map(pod => <SelectItem key={pod} value={pod}>{pod}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Scenario */}
      <ScenarioDropdown
        scenarios={scenarios}
        currentName={state.scenarioName}
        isDirty={state.isDirty}
        onSave={onSave}
        onSaveAs={onSaveAs}
        onLoad={onLoadScenario}
        onDelete={onDeleteScenario}
      />

      <div className="flex-1" />

      {/* Week range */}
      <ToggleGroup
        type="single"
        value={String(state.weekRange)}
        onValueChange={v => v && onWeekRangeChange(parseInt(v) as 4 | 8 | 12 | 26)}
        className="h-8"
      >
        {([4, 8, 12, 26] as const).map(w => (
          <ToggleGroupItem key={w} value={String(w)} className="h-8 px-2 text-xs">{w}w</ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Pipeline toggle */}
      <div className="flex items-center gap-1.5">
        <Switch
          id="show-pipeline"
          checked={state.showPipeline}
          onCheckedChange={onTogglePipeline}
          className="h-4 w-7"
        />
        <Label htmlFor="show-pipeline" className="text-xs cursor-pointer">Pipeline</Label>
      </div>

      {/* Reset */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs text-muted-foreground"
        onClick={onReset}
        disabled={!hasBlocks}
      >
        <RotateCcw className="size-3.5 mr-1" />Reset
      </Button>

      {/* Commit */}
      <Button
        size="sm"
        className="h-8 text-xs"
        onClick={onCommit}
        disabled={!hasBlocks}
      >
        <Send className="size-3.5 mr-1" />Commit
      </Button>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface DemandPopoverProps {
  open: boolean
  projectName: string
  skills: string[]
  defaultDemand: Record<string, number>
  defaultDuration: number
  anchorRect: { top: number; left: number; bottom: number; right: number; width: number; height: number } | null
  onConfirm: (demand: Record<string, number>, durationWeeks: number) => void
  onCancel: () => void
}

export function DemandPopover({ open, projectName, skills, defaultDemand, defaultDuration, anchorRect, onConfirm, onCancel }: DemandPopoverProps) {
  const [demand, setDemand] = useState<Record<string, number>>(defaultDemand)
  const [duration, setDuration] = useState(defaultDuration)

  useEffect(() => {
    if (open) {
      setDemand(defaultDemand)
      setDuration(defaultDuration)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open || !anchorRect) return null

  const top = Math.min(anchorRect.bottom + 8, typeof window !== "undefined" ? window.innerHeight - 320 : 500)
  const left = Math.min(anchorRect.left, typeof window !== "undefined" ? window.innerWidth - 280 : 500)

  return (
    <div
      className="fixed z-50 w-64 rounded-lg border bg-popover shadow-lg p-4 space-y-3"
      style={{ top, left }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold truncate">{projectName}</p>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Hours / week per skill</Label>
        {skills.map(skill => (
          <div key={skill} className="flex items-center gap-2">
            <span className="text-xs flex-1 truncate">{skill}</span>
            <Input
              type="number"
              min={0}
              max={80}
              value={demand[skill] ?? 0}
              onChange={e => setDemand(d => ({ ...d, [skill]: parseFloat(e.target.value) || 0 }))}
              className="w-16 h-7 text-xs text-right"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground flex-1">Duration (weeks)</Label>
        <Input
          type="number"
          min={1}
          max={52}
          value={duration}
          onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-16 h-7 text-xs text-right"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => onConfirm(demand, duration)}>Add to grid</Button>
      </div>
    </div>
  )
}

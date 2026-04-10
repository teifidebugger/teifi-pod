"use client"

import { useState } from "react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { ChevronDown, Save, Trash2 } from "lucide-react"
import type { ScenarioSummary } from "./types"
import { format } from "date-fns"

interface ScenarioDropdownProps {
  scenarios: ScenarioSummary[]
  currentName: string | null
  isDirty: boolean
  onSave: () => void
  onSaveAs: (name: string) => void
  onLoad: (id: string) => void
  onDelete: (id: string) => void
}

export function ScenarioDropdown({ scenarios, currentName, isDirty, onSave, onSaveAs, onLoad, onDelete }: ScenarioDropdownProps) {
  const [saveAsOpen, setSaveAsOpen] = useState(false)
  const [saveAsName, setSaveAsName] = useState("")

  function handleSaveAs() {
    if (!saveAsName.trim()) return
    onSaveAs(saveAsName.trim())
    setSaveAsOpen(false)
    setSaveAsName("")
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <span className="max-w-32 truncate">{currentName ?? "Unsaved scenario"}{isDirty ? " *" : ""}</span>
            <ChevronDown className="size-3.5 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onSelect={onSave} disabled={!currentName}>
            <Save className="size-4 mr-2" />Save
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setSaveAsOpen(true)}>
            <Save className="size-4 mr-2" />Save as...
          </DropdownMenuItem>
          {scenarios.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {scenarios.map(s => (
                <DropdownMenuItem key={s.id} className="flex items-center justify-between group" onSelect={() => onLoad(s.id)}>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(s.updatedAt), "MMM d")}</span>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 ml-2 p-0.5 rounded hover:text-destructive"
                    onClick={e => { e.stopPropagation(); onDelete(s.id) }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Save scenario</DialogTitle></DialogHeader>
          <Input
            value={saveAsName}
            onChange={e => setSaveAsName(e.target.value)}
            placeholder="Scenario name"
            onKeyDown={e => e.key === "Enter" && handleSaveAs()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveAsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAs} disabled={!saveAsName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

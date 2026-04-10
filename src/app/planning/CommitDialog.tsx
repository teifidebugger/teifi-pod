"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { commitPipelineProjects } from "@/app/actions/planning"
import type { SimulationBlock, PlanProject, CommitSelection } from "./types"

interface CommitDialogProps {
  open: boolean
  blocks: SimulationBlock[]
  projects: PlanProject[]
  onCommit: () => void
  onCancel: () => void
}

export function CommitDialog({ open, blocks, projects, onCommit, onCancel }: CommitDialogProps) {
  const [selections, setSelections] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  const uniqueProjectIds = [...new Set(blocks.map(b => b.projectId))]
  const pipelineProjects = projects.filter(p => uniqueProjectIds.includes(p.id) && p.status === "TENTATIVE")

  function toggle(id: string) {
    setSelections(s => ({ ...s, [id]: !s[id] }))
  }

  function handleCommit() {
    const data: CommitSelection[] = pipelineProjects.map(p => ({
      projectId: p.id,
      createAllocations: selections[p.id] ?? false,
    }))
    startTransition(async () => {
      try {
        await commitPipelineProjects(data, blocks)
        onCommit()
      } catch {
        toast.error("Failed to commit projects")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Commit Pipeline Projects</DialogTitle>
          <DialogDescription>
            Selected projects will be activated. Check boxes to also create placeholder allocations.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {pipelineProjects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No pipeline projects in current simulation.</p>
          )}
          {pipelineProjects.map(p => (
            <div key={p.id} className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox
                id={`commit-${p.id}`}
                checked={selections[p.id] ?? false}
                onCheckedChange={() => toggle(p.id)}
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor={`commit-${p.id}`} className="font-medium cursor-pointer">{p.name}</Label>
                {p.clientName && <p className="text-xs text-muted-foreground">{p.clientName}</p>}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={handleCommit}
            disabled={isPending || pipelineProjects.length === 0}
          >
            {isPending ? "Committing\u2026" : `Activate ${Object.values(selections).filter(Boolean).length} projects`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

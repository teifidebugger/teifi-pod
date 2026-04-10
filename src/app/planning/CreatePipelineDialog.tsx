"use client"

import { useRef, useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createPipelineProject } from "@/app/actions/planning"
import type { PlanProject } from "./types"

interface CreatePipelineDialogProps {
  open: boolean
  clients: { id: string; name: string }[]
  onCreated: (project: PlanProject) => void
  onClose: () => void
}

export function CreatePipelineDialog({ open, clients, onCreated, onClose }: CreatePipelineDialogProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [clientId, setClientId] = useState<string>("__none__")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    if (clientId !== "__none__") formData.set("clientId", clientId)
    startTransition(async () => {
      const result = await createPipelineProject(formData)
      if (result.project) {
        onCreated(result.project)
        formRef.current?.reset()
        setClientId("__none__")
        onClose()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Pipeline Project</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Project name *</Label>
            <Input id="name" name="name" required placeholder="e.g. Acme Redesign" />
          </div>
          <div className="space-y-1">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No client</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="budgetHours">Budget hours</Label>
              <Input id="budgetHours" name="budgetHours" type="number" min={1} placeholder="e.g. 200" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="startsOn">Start date</Label>
              <Input id="startsOn" name="startsOn" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Creating\u2026" : "Create project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

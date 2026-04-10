"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createPod } from "@/app/actions/pods"
import type { PodData } from "./types"

interface CreatePodDialogProps {
  open: boolean
  onCreated: (pod: PodData) => void
  onClose: () => void
}

export function CreatePodDialog({ open, onCreated, onClose }: CreatePodDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("DELIVERY")
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!name.trim()) return
    const fd = new FormData()
    fd.set("name", name.trim())
    fd.set("type", type)
    startTransition(async () => {
      const pod = await createPod(fd)
      onCreated(pod)
      setName("")
      setType("DELIVERY")
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Pod</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="pod-name">Pod name <span className="text-muted-foreground font-normal">*</span></Label>
            <Input
              id="pod-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Galiano Pod"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pod-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="pod-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DELIVERY">Delivery Pod</SelectItem>
                <SelectItem value="SUPPORT">Support Pod</SelectItem>
                <SelectItem value="SHARED_SERVICES">Shared Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {isPending ? "Creating…" : "Create pod"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updatePod } from "@/app/actions/pods"
import type { PodData } from "./types"

interface EditPodDialogProps {
  open: boolean
  pod: PodData
  onUpdated: (pod: PodData) => void
  onClose: () => void
}

export function EditPodDialog({ open, pod, onUpdated, onClose }: EditPodDialogProps) {
  const [name, setName] = useState(pod.name)
  const [type, setType] = useState(pod.type)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!name.trim()) return
    const fd = new FormData()
    fd.set("name", name.trim())
    fd.set("type", type)
    startTransition(async () => {
      await updatePod(pod.id, fd)
      onUpdated({ ...pod, name: name.trim(), type })
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Pod</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="edit-pod-name">Pod name</Label>
            <Input
              id="edit-pod-name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-pod-type">Type</Label>
            <Select value={type} onValueChange={v => setType(v as PodData["type"])}>
              <SelectTrigger id="edit-pod-type"><SelectValue /></SelectTrigger>
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
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { upsertPodSlot } from "@/app/actions/pods"
import type { PodSlotData, WorkspaceMemberOption } from "./types"

const COMMON_ROLES = [
  "Pod Lead (Project Manager)",
  "Pod Lead (Account Manager)",
  "Systems Architect",
  "Technical Product Owner (TPM)",
  "Business Analyst",
  "Frontend Developer",
  "Backend Developer",
  "Designer",
  "Quality Assurance",
  "Client Success Manager",
  "Support Analyst",
]

interface AddSlotDialogProps {
  open: boolean
  podId: string
  /** If provided, the dialog operates in edit mode pre-filled with this slot */
  slot?: PodSlotData
  workspaceMembers: WorkspaceMemberOption[]
  onSaved: (slot: PodSlotData) => void
  onClose: () => void
}

export function AddSlotDialog({ open, podId, slot, workspaceMembers, onSaved, onClose }: AddSlotDialogProps) {
  const isEdit = !!slot

  // Initialise from slot if editing; the parent uses key={slot?.id ?? "__new__"} to force remount
  const initialRole = slot
    ? (COMMON_ROLES.includes(slot.roleName) ? slot.roleName : "__custom__")
    : ""
  const initialCustom = slot
    ? (COMMON_ROLES.includes(slot.roleName) ? "" : slot.roleName)
    : ""

  const [roleName, setRoleName] = useState(initialRole)
  const [customRole, setCustomRole] = useState(initialCustom)
  const [memberId, setMemberId] = useState<string | null>(slot?.memberId ?? null)
  const [allocationRaw, setAllocationRaw] = useState(String(slot?.allocationPercent ?? 100))
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const finalRole = roleName === "__custom__" ? customRole.trim() : roleName
  const selectedMember = workspaceMembers.find(m => m.id === memberId)

  function handleSubmit() {
    if (!finalRole) return
    const pct = Math.min(100, Math.max(1, parseInt(allocationRaw) || 100))
    startTransition(async () => {
      const result = await upsertPodSlot(podId, slot?.id ?? null, finalRole, memberId, pct)
      onSaved({
        id: result.id,
        roleName: finalRole,
        memberId,
        memberName: selectedMember?.name ?? null,
        memberImage: selectedMember?.image ?? null,
        allocationPercent: pct,
        memberWeeklyCapacityHours: slot?.memberWeeklyCapacityHours ?? null,
      })
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Slot" : "Add Slot"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Role *</Label>
            <Select value={roleName || "__placeholder__"} onValueChange={v => { if (v !== "__placeholder__") setRoleName(v) }}>
              <SelectTrigger><SelectValue placeholder="Select role…" /></SelectTrigger>
              <SelectContent>
                {COMMON_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                <SelectItem value="__custom__">Custom role…</SelectItem>
              </SelectContent>
            </Select>
            {roleName === "__custom__" && (
              <Input
                className="mt-2"
                value={customRole}
                onChange={e => setCustomRole(e.target.value)}
                placeholder="e.g. DevOps Engineer"
                autoFocus
              />
            )}
          </div>

          <div className="space-y-1">
            <Label>Assign to member</Label>
            <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={memberPopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className={cn("truncate", !selectedMember && "text-muted-foreground")}>
                    {selectedMember ? (selectedMember.name ?? selectedMember.email) : "To be filled"}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search member…" />
                  <CommandList>
                    <CommandEmpty>No member found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="__none__"
                        onSelect={() => { setMemberId(null); setMemberPopoverOpen(false) }}
                      >
                        <Check className={cn("mr-2 size-4", memberId === null ? "opacity-100" : "opacity-0")} />
                        <span className="text-muted-foreground italic">To be filled</span>
                      </CommandItem>
                      {workspaceMembers.map(m => (
                        <CommandItem
                          key={m.id}
                          value={`${m.name ?? ""} ${m.email}`}
                          onSelect={() => { setMemberId(m.id); setMemberPopoverOpen(false) }}
                        >
                          <Check className={cn("mr-2 size-4", memberId === m.id ? "opacity-100" : "opacity-0")} />
                          <div className="flex flex-col min-w-0">
                            <span className="truncate">{m.name ?? m.email}</span>
                            {m.name && <span className="text-xs text-muted-foreground truncate">{m.email}</span>}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label>Allocation %</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={allocationRaw}
                onChange={e => setAllocationRaw(e.target.value)}
                onBlur={e => {
                  const clamped = Math.min(100, Math.max(1, parseInt(e.target.value) || 100))
                  setAllocationRaw(String(clamped))
                }}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">% of member's weekly capacity</span>
            </div>
            {parseInt(allocationRaw) < 100 && (
              <p className="text-xs text-amber-600">Partial allocation — member may serve multiple pods</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!finalRole || isPending}>
            {isPending ? (isEdit ? "Saving…" : "Adding…") : (isEdit ? "Save changes" : "Add slot")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

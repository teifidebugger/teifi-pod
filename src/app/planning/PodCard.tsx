"use client"

import { useState, useTransition } from "react"
import { MoreHorizontal, Plus, Trash2, Pencil, X, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { PodData, PodSlotData, WorkspaceMemberOption } from "./types"
import { deletePod, deletePodSlot, assignProjectToPod } from "@/app/actions/pods"
import { EditPodDialog } from "./EditPodDialog"
import { AddSlotDialog } from "./AddSlotDialog"
import { COLOR_HEX_MAP } from "@/lib/project-colors"
import { cn } from "@/lib/utils"

const POD_TYPE_COLORS: Record<string, string> = {
  DELIVERY: "bg-blue-500",
  SUPPORT: "bg-violet-500",
  SHARED_SERVICES: "bg-amber-500",
}

const POD_TYPE_LABELS: Record<string, string> = {
  DELIVERY: "Delivery",
  SUPPORT: "Support",
  SHARED_SERVICES: "Shared Services",
}

interface PodCardProps {
  pod: PodData
  workspaceMembers: WorkspaceMemberOption[]
  canManage: boolean
  onUpdated: (pod: PodData) => void
  onDeleted: () => void
  onProjectUnassigned: (projectId: string, podId: string) => void
}

export function PodCard({ pod, workspaceMembers, canManage, onUpdated, onDeleted, onProjectUnassigned }: PodCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [slotDialogOpen, setSlotDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<PodSlotData | null>(null)
  const [, startTransition] = useTransition()

  const filledSlots = pod.slots.filter(s => s.memberId !== null)

  // Effective weekly capacity: sum of (allocationPercent/100 * weeklyCapacityHours) for filled slots
  const effectiveCapacityHours = filledSlots.reduce((sum, s) => {
    const cap = Number(s.memberWeeklyCapacityHours)
    if (!s.memberWeeklyCapacityHours || isNaN(cap)) return sum
    const pct = (s.allocationPercent ?? 100) / 100
    return sum + pct * cap
  }, 0)
  const hasCapacityData = filledSlots.some(s => s.memberWeeklyCapacityHours && Number(s.memberWeeklyCapacityHours) > 0)

  function handleDeletePod() {
    if (!confirm(`Delete "${pod.name}"? This will unassign all projects.`)) return
    startTransition(async () => {
      await deletePod(pod.id)
      onDeleted()
    })
  }

  function handleRemoveSlot(slotId: string) {
    startTransition(async () => {
      await deletePodSlot(slotId)
      onUpdated({ ...pod, slots: pod.slots.filter(s => s.id !== slotId) })
    })
  }

  function handleUnassignProject(projectId: string) {
    startTransition(async () => {
      await assignProjectToPod(projectId, null)
      onProjectUnassigned(projectId, pod.id)
    })
  }

  function handleSlotSaved(slot: PodSlotData) {
    // If slot.id already exists in pod.slots → edit; otherwise → add
    const exists = pod.slots.some(s => s.id === slot.id)
    if (exists) {
      onUpdated({ ...pod, slots: pod.slots.map(s => s.id === slot.id ? slot : s) })
    } else {
      onUpdated({ ...pod, slots: [...pod.slots, slot] })
    }
    setSlotDialogOpen(false)
    setEditingSlot(null)
  }

  function openAddSlot() {
    setEditingSlot(null)
    setSlotDialogOpen(true)
  }

  function openEditSlot(slot: PodSlotData) {
    setEditingSlot(slot)
    setSlotDialogOpen(true)
  }

  const dotColor = POD_TYPE_COLORS[pod.type] ?? "bg-gray-400"

  return (
    <>
      <div className="rounded-xl border border-sidebar-border bg-card shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-sidebar-border bg-sidebar/40">
          <span className={`size-2.5 rounded-full shrink-0 ${dotColor}`} />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm block truncate">{pod.name}</span>
            <span className="text-[10px] text-muted-foreground">{POD_TYPE_LABELS[pod.type] ?? pod.type}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {filledSlots.length}/{pod.slots.length} filled
            </Badge>
            {hasCapacityData && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {effectiveCapacityHours % 1 === 0 ? effectiveCapacityHours : effectiveCapacityHours.toFixed(1)}h/wk
              </Badge>
            )}
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7">
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    <Pencil className="size-4 mr-2" />Edit pod
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={openAddSlot}>
                    <UserPlus className="size-4 mr-2" />Add slot
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleDeletePod} className="text-destructive focus:text-destructive">
                    <Trash2 className="size-4 mr-2" />Delete pod
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Slots — table-style */}
        <div className="px-4 py-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Team</p>
          {pod.slots.length === 0 && (
            <p className="text-xs text-muted-foreground/40 italic">No slots defined yet</p>
          )}
          <div className="space-y-px">
            {pod.slots.map(slot => (
              <div
                key={slot.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 -mx-2 group transition-colors",
                  canManage && "hover:bg-muted/50 cursor-default"
                )}
              >
                {/* Avatar */}
                {slot.memberId ? (
                  <Avatar className="size-6 shrink-0">
                    <AvatarImage src={slot.memberImage ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {slot.memberName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="size-6 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0 flex items-center justify-center">
                    <span className="text-[9px] text-muted-foreground/40">?</span>
                  </div>
                )}

                {/* Role + member */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium truncate block">{slot.roleName}</span>
                  <span className={cn("text-[11px] truncate block", slot.memberId ? "text-muted-foreground" : "text-muted-foreground/50 italic")}>
                    {slot.memberName ?? "To be filled"}
                  </span>
                </div>

                {/* Allocation % badge — always visible when assigned */}
                {slot.memberId && (
                  <span className={cn(
                    "text-[10px] font-medium shrink-0 tabular-nums",
                    (slot.allocationPercent ?? 100) < 100 ? "text-amber-600" : "text-muted-foreground/50"
                  )}>
                    {slot.allocationPercent ?? 100}%
                  </span>
                )}

                {/* Actions — visible on hover */}
                {canManage && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => openEditSlot(slot)}
                          className="text-muted-foreground/40 hover:text-foreground p-0.5 rounded transition-colors"
                          aria-label="Edit slot"
                        >
                          <Pencil className="size-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Edit slot</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleRemoveSlot(slot.id)}
                          className="text-muted-foreground/40 hover:text-destructive p-0.5 rounded transition-colors"
                          aria-label="Remove slot"
                        >
                          <X className="size-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Remove slot</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            ))}
          </div>

          {canManage && (
            <button
              onClick={openAddSlot}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors mt-2 px-2"
            >
              <Plus className="size-3" />Add slot
            </button>
          )}
        </div>

        {/* Projects */}
        <div className="px-4 pb-3 pt-2 border-t border-sidebar-border">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Projects</p>
          {pod.projects.length === 0 && (
            <p className="text-xs text-muted-foreground/40 italic">No projects assigned</p>
          )}
          <div className="space-y-px">
            {pod.projects.map(project => {
              const hex = COLOR_HEX_MAP[project.color ?? "blue"] ?? COLOR_HEX_MAP["blue"]
              const statusLabel =
                project.status === "ACTIVE" ? "Active" :
                project.status === "TENTATIVE" ? "Pipeline" :
                project.status === "PAUSED" ? "Paused" :
                project.status === "COMPLETED" ? "Completed" :
                project.status === "ARCHIVED" ? "Archived" :
                project.status
              const statusColor =
                project.status === "ACTIVE" ? "text-emerald-600 dark:text-emerald-400" :
                project.status === "TENTATIVE" ? "text-violet-600 dark:text-violet-400" :
                project.status === "PAUSED" ? "text-amber-600 dark:text-amber-400" :
                "text-muted-foreground"
              return (
                <div key={project.id} className="flex items-center gap-2 group rounded-md px-2 py-1.5 -mx-2 hover:bg-muted/50 transition-colors">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium truncate block">{project.name}</span>
                    <span className="text-[11px] truncate block">
                      <span className={statusColor}>{statusLabel}</span>
                      {project.clientName && <span className="text-muted-foreground"> · {project.clientName}</span>}
                    </span>
                  </div>
                  {canManage && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleUnassignProject(project.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-opacity p-0.5 rounded"
                        >
                          <X className="size-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Unassign from pod</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <EditPodDialog
        open={editOpen}
        pod={pod}
        onUpdated={onUpdated}
        onClose={() => setEditOpen(false)}
      />
      {/* key forces remount when switching between add vs edit slot, resetting form state */}
      <AddSlotDialog
        key={editingSlot?.id ?? "__new__"}
        open={slotDialogOpen}
        podId={pod.id}
        slot={editingSlot ?? undefined}
        workspaceMembers={workspaceMembers}
        onSaved={handleSlotSaved}
        onClose={() => { setSlotDialogOpen(false); setEditingSlot(null) }}
      />
    </>
  )
}

"use client"

import { useState } from "react"
import { Plus, Grid3X3, AlertTriangle, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PodCard } from "./PodCard"
import { UnassignedPanel } from "./UnassignedPanel"
import { CreatePodDialog } from "./CreatePodDialog"
import type { PodData, UnassignedProject, WorkspaceMemberOption } from "./types"

interface PlanningViewProps {
  pods: PodData[]
  unassigned: UnassignedProject[]
  workspaceMembers: WorkspaceMemberOption[]
  memberRole: string
}

export function PlanningView({ pods: initialPods, unassigned: initialUnassigned, workspaceMembers, memberRole }: PlanningViewProps) {
  const [pods, setPods] = useState(initialPods)
  const [unassigned, setUnassigned] = useState(initialUnassigned)
  const [createOpen, setCreateOpen] = useState(false)

  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(memberRole)

  function handlePodCreated(pod: PodData) {
    setPods(prev => [...prev, pod])
    setCreateOpen(false)
  }

  function handlePodDeleted(podId: string) {
    setPods(prev => prev.filter(p => p.id !== podId))
  }

  function handlePodUpdated(updated: PodData) {
    setPods(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  function handleProjectAssigned(projectId: string, podId: string) {
    const project = unassigned.find(p => p.id === projectId)
    if (!project) return
    setUnassigned(prev => prev.filter(p => p.id !== projectId))
    setPods(prev => prev.map(p =>
      p.id === podId
        ? { ...p, projects: [...p.projects, { ...project }] }
        : p
    ))
  }

  function handleProjectUnassigned(projectId: string, fromPodId: string) {
    const pod = pods.find(p => p.id === fromPodId)
    const project = pod?.projects.find(p => p.id === projectId)
    if (!project) return
    setPods(prev => prev.map(p =>
      p.id === fromPodId
        ? { ...p, projects: p.projects.filter(pr => pr.id !== projectId) }
        : p
    ))
    setUnassigned(prev => [...prev, project])
  }

  const deliveryPods = pods.filter(p => p.type === "DELIVERY")
  const supportPods = pods.filter(p => p.type === "SUPPORT")
  const sharedPods = pods.filter(p => p.type === "SHARED_SERVICES")
  const noPods = pods.length === 0

  const totalSlots = pods.flatMap(p => p.slots).length
  const openSlots = pods.flatMap(p => p.slots).filter(s => !s.memberId).length

  return (
    <div className="flex flex-col min-h-full">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 flex h-[46px] items-center gap-3 border-b border-sidebar-border bg-background/95 backdrop-blur px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Grid3X3 className="size-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Pods</span>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 tabular-nums">{pods.length}</span>
        </div>
        <div className="flex-1" />
        {canManage && (
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />New Pod
          </Button>
        )}
      </div>

      {/* Summary bar */}
      {!noPods && (
        <div className="flex items-center gap-6 px-4 md:px-8 py-2 border-b border-sidebar-border bg-sidebar/20 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Grid3X3 className="size-3.5" />
            <span><span className="font-medium text-foreground tabular-nums">{pods.length}</span> pods</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${openSlots > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
            {openSlots > 0 && <AlertTriangle className="size-3.5" />}
            <span>
              <span className="font-medium tabular-nums">{openSlots}</span> open slot{openSlots !== 1 ? "s" : ""}
              <span className="text-muted-foreground"> / {totalSlots} total</span>
            </span>
          </div>
          {unassigned.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400">
              <FolderOpen className="size-3.5" />
              <span><span className="font-medium tabular-nums">{unassigned.length}</span> unassigned project{unassigned.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}

      {/* Main content: pod grid (left) + unassigned sidebar (right) */}
      <div className="flex flex-1 min-h-0">
        {/* Pod grid */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-8 min-w-0">
          {noPods ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
              <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center border border-border">
                <Grid3X3 className="size-7 text-muted-foreground/40" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No pods yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">Create your first Delivery or Support pod to start organising your team and projects.</p>
              </div>
              {canManage && (
                <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
                  <Plus className="size-4" />Create first pod
                </Button>
              )}
            </div>
          ) : (
            <>
              {deliveryPods.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="size-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivery Pods</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{deliveryPods.length}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                    {deliveryPods.map(pod => (
                      <PodCard
                        key={pod.id}
                        pod={pod}
                        workspaceMembers={workspaceMembers}
                        canManage={canManage}
                        onUpdated={handlePodUpdated}
                        onDeleted={() => handlePodDeleted(pod.id)}
                        onProjectUnassigned={handleProjectUnassigned}
                      />
                    ))}
                  </div>
                </section>
              )}

              {supportPods.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="size-2 rounded-full bg-violet-500 shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Support Pods</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{supportPods.length}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                    {supportPods.map(pod => (
                      <PodCard
                        key={pod.id}
                        pod={pod}
                        workspaceMembers={workspaceMembers}
                        canManage={canManage}
                        onUpdated={handlePodUpdated}
                        onDeleted={() => handlePodDeleted(pod.id)}
                        onProjectUnassigned={handleProjectUnassigned}
                      />
                    ))}
                  </div>
                </section>
              )}

              {sharedPods.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shared Services</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{sharedPods.length}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                    {sharedPods.map(pod => (
                      <PodCard
                        key={pod.id}
                        pod={pod}
                        workspaceMembers={workspaceMembers}
                        canManage={canManage}
                        onUpdated={handlePodUpdated}
                        onDeleted={() => handlePodDeleted(pod.id)}
                        onProjectUnassigned={handleProjectUnassigned}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Unassigned projects — sticky right sidebar */}
        {unassigned.length > 0 && (
          <div className="w-72 shrink-0 border-l border-sidebar-border overflow-y-auto">
            <UnassignedPanel
              projects={unassigned}
              pods={pods}
              canManage={canManage}
              onAssigned={handleProjectAssigned}
            />
          </div>
        )}
      </div>

      <CreatePodDialog
        open={createOpen}
        onCreated={handlePodCreated}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  )
}

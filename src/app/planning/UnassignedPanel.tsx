"use client"

import { useState, useTransition, useMemo } from "react"
import { Search, ArrowUpDown, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { UnassignedProject, PodData } from "./types"
import { assignProjectToPod } from "@/app/actions/pods"
import { COLOR_HEX_MAP } from "@/lib/project-colors"

type SortKey = "client" | "status" | "name"

const STATUS_ORDER: Record<string, number> = {
  ACTIVE: 0, TENTATIVE: 1, PAUSED: 2, COMPLETED: 3, ARCHIVED: 4,
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-emerald-600 dark:text-emerald-400",
  TENTATIVE: "text-violet-600 dark:text-violet-400",
  PAUSED: "text-amber-600 dark:text-amber-400",
  COMPLETED: "text-muted-foreground",
  ARCHIVED: "text-muted-foreground",
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  TENTATIVE: "Pipeline",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
}

const SORT_LABELS: Record<SortKey, string> = {
  client: "Client",
  status: "Status",
  name: "Project name",
}

interface UnassignedPanelProps {
  projects: UnassignedProject[]
  pods: PodData[]
  canManage: boolean
  onAssigned: (projectId: string, podId: string) => void
}

export function UnassignedPanel({ projects, pods, canManage, onAssigned }: UnassignedPanelProps) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("client")
  const [assigning, setAssigning] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  if (projects.length === 0) return null

  function handleAssign(projectId: string) {
    const podId = assigning[projectId]
    if (!podId || podId === "__none__") return
    startTransition(async () => {
      await assignProjectToPod(projectId, podId)
      onAssigned(projectId, podId)
    })
  }

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const list = q
      ? projects.filter(p =>
          p.name.toLowerCase().includes(q) ||
          (p.clientName ?? "").toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q)
        )
      : [...projects]

    if (sortBy === "client") {
      list.sort((a, b) =>
        (a.clientName ?? "").localeCompare(b.clientName ?? "") || a.name.localeCompare(b.name)
      )
    } else if (sortBy === "status") {
      list.sort((a, b) =>
        (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99) || a.name.localeCompare(b.name)
      )
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [projects, search, sortBy])

  // Group by client when sorted by client
  const grouped = useMemo(() => {
    if (sortBy !== "client") return null
    const map = new Map<string, { clientName: string; projects: UnassignedProject[] }>()
    for (const p of filtered) {
      const key = p.clientName ?? "__none__"
      if (!map.has(key)) map.set(key, { clientName: p.clientName ?? "No client", projects: [] })
      map.get(key)!.projects.push(p)
    }
    return map
  }, [filtered, sortBy])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-sidebar-border bg-sidebar/40 shrink-0">
        <FolderOpen className="size-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold flex-1">Unassigned</span>
        <Badge variant="secondary" className="tabular-nums">{projects.length}</Badge>
      </div>

      <>
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-sidebar-border bg-sidebar/20 shrink-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="h-7 pl-8 text-xs bg-background"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 shrink-0">
                  <ArrowUpDown className="size-3" />
                  {SORT_LABELS[sortBy]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                  <DropdownMenuItem key={k} onSelect={() => setSortBy(k)} className={sortBy === k ? "font-medium" : ""}>
                    {SORT_LABELS[k]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {search && (
              <span className="text-xs text-muted-foreground shrink-0">
                {filtered.length} of {projects.length}
              </span>
            )}
          </div>

          {/* List — grouped by client or flat */}
          <div className="divide-y divide-sidebar-border overflow-y-auto flex-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No projects match &ldquo;{search}&rdquo;</p>
            )}

            {grouped
              ? Array.from(grouped.entries()).map(([key, { clientName, projects: group }]) => (
                  <div key={key}>
                    <div className="bg-sidebar/60 border-b border-sidebar-border px-4 py-1.5 text-xs font-medium text-muted-foreground">
                      {clientName}
                    </div>
                    {group.map(project => (
                      <ProjectRow
                        key={project.id}
                        project={project}
                        pods={pods}
                        canManage={canManage}
                        podValue={assigning[project.id] ?? "__none__"}
                        isPending={isPending}
                        onPodChange={v => setAssigning(a => ({ ...a, [project.id]: v }))}
                        onAssign={() => handleAssign(project.id)}
                      />
                    ))}
                  </div>
                ))
              : filtered.map(project => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    pods={pods}
                    canManage={canManage}
                    podValue={assigning[project.id] ?? "__none__"}
                    isPending={isPending}
                    onPodChange={v => setAssigning(a => ({ ...a, [project.id]: v }))}
                    onAssign={() => handleAssign(project.id)}
                  />
                ))
            }
          </div>
        </>
    </div>
  )
}

function ProjectRow({
  project, pods, canManage, podValue, isPending, onPodChange, onAssign,
}: {
  project: UnassignedProject
  pods: PodData[]
  canManage: boolean
  podValue: string
  isPending: boolean
  onPodChange: (v: string) => void
  onAssign: () => void
}) {
  const hex = COLOR_HEX_MAP[project.color ?? "blue"] ?? COLOR_HEX_MAP["blue"]
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: hex }} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{project.name}</span>
        <span className="text-xs">
          <span className={STATUS_COLORS[project.status] ?? "text-muted-foreground"}>{STATUS_LABELS[project.status] ?? project.status}</span>
          {project.clientName && (
            <span className="text-muted-foreground"> · {project.clientName}</span>
          )}
        </span>
      </div>
      {canManage && pods.length > 0 && (
        <div className="flex items-center gap-2 shrink-0">
          <Select value={podValue} onValueChange={onPodChange}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue placeholder="Select pod…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Select pod…</SelectItem>
              {pods.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2"
            disabled={!podValue || podValue === "__none__" || isPending}
            onClick={onAssign}
          >
            Assign
          </Button>
        </div>
      )}
    </div>
  )
}

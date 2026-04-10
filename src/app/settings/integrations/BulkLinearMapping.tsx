"use client"

import { useState, useTransition, useMemo } from "react"
import { Search, CheckSquare, Square, Link2, Link2Off } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { bulkMapLinearTeam } from "@/app/actions/projects"

export type ProjectMappingRow = {
  id: string
  name: string
  clientName: string | null
  linearTeamId: string | null
  linearTeamName: string | null
  linearTeamKey: string | null
}

export type LinearTeamOption = {
  id: string
  name: string
  key: string
}

interface Props {
  projects: ProjectMappingRow[]
  linearTeams: LinearTeamOption[]
}

export function BulkLinearMapping({ projects, linearTeams }: Props) {
  const [search, setSearch] = useState("")
  const [targetTeamId, setTargetTeamId] = useState<string>("__none__")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ count: number; teamName: string } | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return projects
    return projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.clientName ?? "").toLowerCase().includes(q) ||
      (p.linearTeamName ?? "").toLowerCase().includes(q)
    )
  }, [projects, search])

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(p => p.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleApply() {
    if (selected.size === 0) return
    const teamId = targetTeamId === "__none__" ? null : targetTeamId
    const teamName = teamId ? (linearTeams.find(t => t.id === teamId)?.name ?? "None") : "None"
    startTransition(async () => {
      await bulkMapLinearTeam(Array.from(selected), teamId)
      setResult({ count: selected.size, teamName })
      setSelected(new Set())
    })
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length
  const someSelected = selected.size > 0 && !allSelected

  return (
    <div className="space-y-4">
      {result && (
        <div className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
          ✓ Mapped {result.count} project{result.count !== 1 ? "s" : ""} to <strong>{result.teamName}</strong>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(new Set()) }}
            placeholder="Search projects or clients…"
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={targetTeamId} onValueChange={setTargetTeamId}>
          <SelectTrigger className="h-8 text-xs w-56 shrink-0">
            <SelectValue placeholder="Select target team…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Disconnect (remove mapping) —</SelectItem>
            {linearTeams.map(t => (
              <SelectItem key={t.id} value={t.id}>[{t.key}] {t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-8 text-xs shrink-0"
          disabled={selected.size === 0 || isPending}
          onClick={handleApply}
        >
          {isPending ? "Applying…" : `Apply to ${selected.size} project${selected.size !== 1 ? "s" : ""}`}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden text-sm">
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2 bg-muted/40 border-b border-border text-xs text-muted-foreground font-medium">
          <button onClick={toggleAll} className="shrink-0">
            {allSelected
              ? <CheckSquare className="size-4 text-primary" />
              : someSelected
              ? <CheckSquare className="size-4 text-primary/50" />
              : <Square className="size-4" />}
          </button>
          <span className="flex-1">Project</span>
          <span className="w-40 hidden sm:block">Client</span>
          <span className="w-36">Current mapping</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-8">No projects match &ldquo;{search}&rdquo;</div>
        )}
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {filtered.map(p => {
            const isSelected = selected.has(p.id)
            return (
              <div
                key={p.id}
                onClick={() => toggleOne(p.id)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}
              >
                <div className="shrink-0" onClick={e => { e.stopPropagation(); toggleOne(p.id) }}>
                  {isSelected
                    ? <CheckSquare className="size-4 text-primary" />
                    : <Square className="size-4 text-muted-foreground/40" />}
                </div>
                <span className="flex-1 font-medium truncate">{p.name}</span>
                <span className="w-40 hidden sm:block text-muted-foreground truncate text-xs">
                  {p.clientName ?? "—"}
                </span>
                <div className="w-36 shrink-0">
                  {p.linearTeamId ? (
                    <Badge variant="secondary" className="text-[10px] gap-1 font-mono">
                      <Link2 className="size-2.5" />
                      [{p.linearTeamKey}] {p.linearTeamName}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground/50 flex items-center gap-1">
                      <Link2Off className="size-3" />Not mapped
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-t border-border text-xs text-muted-foreground">
          <span>{selected.size} selected of {filtered.length} shown ({projects.length} total)</span>
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="hover:text-foreground transition-colors">
              Clear selection
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

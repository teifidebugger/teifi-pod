"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Link2, Link2Off, ChevronRight, Loader2, ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateProjectLinearTeam } from "@/app/actions/workspace"
import type { LinearProjectInfo } from "@/lib/linear"

interface LinearTeamOption {
  id: string
  name: string
  key: string
}

interface Props {
  projectId: string
  currentTeamId: string | null
  currentTeamName: string | null
  currentTeamKey: string | null
  currentProjectId: string | null
  currentProjectName: string | null
  linearTeams: LinearTeamOption[]
}

export function LinearMappingForm({
  projectId,
  currentTeamId,
  currentTeamName,
  currentTeamKey,
  currentProjectId,
  currentProjectName,
  linearTeams,
}: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState(currentTeamId ?? "")
  const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId ?? "")
  const [selectedProjectName, setSelectedProjectName] = useState(currentProjectName ?? "")
  const [linearProjects, setLinearProjects] = useState<LinearProjectInfo[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [teamPopoverOpen, setTeamPopoverOpen] = useState(false)
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false)

  // Fetch Linear projects whenever selected team changes
  useEffect(() => {
    if (!selectedTeamId) {
      setLinearProjects([])
      setSelectedProjectId("")
      setSelectedProjectName("")
      return
    }
    setLoadingProjects(true)
    fetch(`/api/linear/projects?teamId=${selectedTeamId}`)
      .then(r => r.ok ? r.json() : [])
      .then((projects: LinearProjectInfo[]) => setLinearProjects(projects))
      .catch(() => setLinearProjects([]))
      .finally(() => setLoadingProjects(false))
  }, [selectedTeamId])

  function handleTeamChange(teamId: string) {
    setSelectedTeamId(teamId)
    setSelectedProjectId("")
    setSelectedProjectName("")
  }

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId)
    const proj = linearProjects.find(p => p.id === projectId)
    setSelectedProjectName(proj?.name ?? "")
  }

  const selectedTeam = linearTeams.find(t => t.id === selectedTeamId)
  const selectedProject = linearProjects.find(p => p.id === selectedProjectId)
  const isDirty =
    selectedTeamId !== (currentTeamId ?? "") ||
    selectedProjectId !== (currentProjectId ?? "")

  return (
    <form
      action={updateProjectLinearTeam}
      onSubmit={() => startTransition(() => {})}
      className="space-y-4"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="linearTeamId" value={selectedTeamId} />
      <input type="hidden" name="linearProjectId" value={selectedProjectId} />
      <input type="hidden" name="linearProjectName" value={selectedProjectName} />

      {/* Team picker */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Linear Team</label>
        <Popover open={teamPopoverOpen} onOpenChange={setTeamPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={teamPopoverOpen}
              className="w-full justify-between font-normal"
            >
              {selectedTeam ? (
                <span>
                  <span className="font-mono text-xs text-muted-foreground mr-1.5">[{selectedTeam.key}]</span>
                  {selectedTeam.name}
                </span>
              ) : (
                <span className="text-muted-foreground italic">No mapping (disconnect)</span>
              )}
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search team…" />
              <CommandList>
                <CommandEmpty>No team found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__none__"
                    onSelect={() => { handleTeamChange(""); setTeamPopoverOpen(false) }}
                  >
                    <Check className={cn("mr-2 size-4", !selectedTeamId ? "opacity-100" : "opacity-0")} />
                    <span className="text-muted-foreground italic">No mapping (disconnect)</span>
                  </CommandItem>
                  {linearTeams.map(t => (
                    <CommandItem
                      key={t.id}
                      value={`${t.key} ${t.name}`}
                      onSelect={() => { handleTeamChange(t.id); setTeamPopoverOpen(false) }}
                    >
                      <Check className={cn("mr-2 size-4", selectedTeamId === t.id ? "opacity-100" : "opacity-0")} />
                      <span className="font-mono text-xs text-muted-foreground mr-1.5">[{t.key}]</span>
                      {t.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {linearTeams.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No teams found. Make sure your Linear account has access to at least one team.
          </p>
        )}
      </div>

      {/* Project picker — only when team is selected */}
      {selectedTeamId && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <label className="text-sm font-medium">
              Linear Project <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Scope timer issues to a specific project within [{selectedTeam?.key}] {selectedTeam?.name}.
            Leave blank to show all team issues.
          </p>
          {loadingProjects ? (
            <div className="flex items-center gap-2 h-9 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Loading projects…
            </div>
          ) : (
            <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={projectPopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedProject ? (
                    <span>{selectedProject.name}</span>
                  ) : (
                    <span className="text-muted-foreground italic">All issues in team</span>
                  )}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search project…" />
                  <CommandList>
                    <CommandEmpty>No project found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="__none__"
                        onSelect={() => { handleProjectChange(""); setProjectPopoverOpen(false) }}
                      >
                        <Check className={cn("mr-2 size-4", !selectedProjectId ? "opacity-100" : "opacity-0")} />
                        <span className="text-muted-foreground italic">All issues in team</span>
                      </CommandItem>
                      {linearProjects.map(p => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={() => { handleProjectChange(p.id); setProjectPopoverOpen(false) }}
                        >
                          <Check className={cn("mr-2 size-4", selectedProjectId === p.id ? "opacity-100" : "opacity-0")} />
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
          {!loadingProjects && linearProjects.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No projects found in this team — issues will not be scoped.
            </p>
          )}
        </div>
      )}

      {/* Current mapping summary */}
      {(currentTeamId || selectedTeamId) && (
        <div className="rounded-md bg-muted/30 border border-border px-3 py-2 text-xs space-y-1">
          <p className="font-medium text-muted-foreground">Mapping preview</p>
          <div className="flex items-center gap-1.5">
            {selectedTeamId ? (
              <>
                <Link2 className="size-3 text-green-500" />
                <span>
                  <Badge variant="secondary" className="font-mono text-[10px] mr-1">
                    {selectedTeam?.key ?? currentTeamKey}
                  </Badge>
                  {selectedTeam?.name ?? currentTeamName}
                  {selectedProjectId && selectedProjectName && (
                    <span className="text-muted-foreground"> → <strong>{selectedProjectName}</strong></span>
                  )}
                  {!selectedProjectId && (
                    <span className="text-muted-foreground"> → all team issues</span>
                  )}
                </span>
              </>
            ) : (
              <>
                <Link2Off className="size-3 text-muted-foreground" />
                <span className="text-muted-foreground">No mapping — disconnected</span>
              </>
            )}
          </div>
        </div>
      )}

      <Button type="submit" size="sm" disabled={isPending || !isDirty}>
        {isPending ? "Saving…" : "Save Mapping"}
      </Button>
    </form>
  )
}

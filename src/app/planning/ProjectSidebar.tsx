"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProjectCard } from "./ProjectCard"
import { CreatePipelineDialog } from "./CreatePipelineDialog"
import type { PlanProject, SimulationBlock } from "./types"

interface ProjectSidebarProps {
  activeProjects: PlanProject[]
  pipelineProjects: PlanProject[]
  blocks: SimulationBlock[]
  clients: { id: string; name: string }[]
  onProjectCreated: (project: PlanProject) => void
}

export function ProjectSidebar({ activeProjects, pipelineProjects, blocks, clients, onProjectCreated }: ProjectSidebarProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const placedProjectIds = new Set(blocks.map(b => b.projectId))

  return (
    <div className="w-[280px] shrink-0 border-r flex flex-col overflow-hidden">
      <Tabs defaultValue="pipeline" className="flex flex-col flex-1 overflow-hidden">
        <div className="px-3 pt-3 pb-0 border-b">
          <TabsList className="w-full h-8">
            <TabsTrigger value="live" className="flex-1 text-xs">Live ({activeProjects.length})</TabsTrigger>
            <TabsTrigger value="pipeline" className="flex-1 text-xs">Pipeline ({pipelineProjects.length})</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="live" className="flex-1 overflow-y-auto p-2 space-y-1.5 mt-0">
          {activeProjects.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No active projects</p>
          )}
          {activeProjects.map(p => (
            <ProjectCard key={p.id} project={p} isInGrid={placedProjectIds.has(p.id)} />
          ))}
        </TabsContent>
        <TabsContent value="pipeline" className="flex-1 overflow-y-auto p-2 space-y-1.5 mt-0">
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-3.5" />New pipeline project
          </Button>
          {pipelineProjects.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No pipeline projects yet</p>
          )}
          {pipelineProjects.map(p => (
            <ProjectCard key={p.id} project={p} isInGrid={placedProjectIds.has(p.id)} />
          ))}
        </TabsContent>
      </Tabs>
      <CreatePipelineDialog
        open={createOpen}
        clients={clients}
        onCreated={onProjectCreated}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  )
}

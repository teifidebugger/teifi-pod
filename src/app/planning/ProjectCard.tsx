"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import type { PlanProject } from "./types"
import { PROJECT_COLOR_CLASSES } from "@/lib/project-colors"
import { Badge } from "@/components/ui/badge"

interface ProjectCardProps {
  project: PlanProject
  isInGrid: boolean
}

export function ProjectCard({ project, isInGrid }: ProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `project-${project.id}`,
    data: { type: "project", projectId: project.id },
  })
  const colorDot = project.color ? (PROJECT_COLOR_CLASSES[project.color] ?? "bg-blue-400") : "bg-blue-400"
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-2 text-sm cursor-grab hover:bg-accent transition-colors group"
    >
      <div {...listeners} {...attributes} suppressHydrationWarning className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab">
        <GripVertical className="size-3.5" />
      </div>
      <div className={`size-2 rounded-full shrink-0 ${colorDot}`} />
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium">{project.name}</p>
        {project.clientName && <p className="truncate text-xs text-muted-foreground">{project.clientName}</p>}
      </div>
      {isInGrid && (
        <Badge variant="secondary" className="text-[10px] px-1 py-0 shrink-0">Placed</Badge>
      )}
    </div>
  )
}

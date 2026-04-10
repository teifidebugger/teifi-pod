"use client"

import { X } from "lucide-react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { PROJECT_COLOR_CLASSES } from "@/lib/project-colors"

interface BlockOverlayProps {
  block: { id: string; projectId: string }
  projectName: string
  projectColor: string | null
  hoursThisWeek: number
  onRemove: () => void
}

export function BlockOverlay({ block, projectName, projectColor, hoursThisWeek, onRemove }: BlockOverlayProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: { type: "block", blockId: block.id },
  })
  const colorClass = projectColor ? (PROJECT_COLOR_CLASSES[projectColor] ?? "bg-blue-100 text-blue-800 border-blue-300") : "bg-blue-100 text-blue-800 border-blue-300"
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }}
      className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium cursor-grab select-none max-w-full ${colorClass}`}
    >
      <span className="truncate flex-1">{projectName}</span>
      {hoursThisWeek > 0 && <span className="shrink-0 tabular-nums">{hoursThisWeek}h</span>}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        className="shrink-0 rounded hover:bg-black/10 p-0.5"
        aria-label="Remove"
      >
        <X className="size-3" />
      </button>
    </div>
  )
}

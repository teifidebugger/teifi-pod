"use client"

import { useState } from "react"
import { ChevronRight, CheckCircle2, Circle, Link2, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { TeifiTask, TeifiProject, Client } from "@prisma/client"
import Link from "next/link"
import { TaskForm } from "./TaskForm"

type ProjectWithClient = TeifiProject & { client: Client | null }

function fmtHours(seconds: number) {
    const h = seconds / 3600
    return h > 0 ? `${h.toFixed(1)}h` : "—"
}

interface Props {
    projectId: string
    projectName: string
    clientName: string
    tasks: (TeifiTask & { trackedSeconds: number })[]
    totalSeconds: number
    openCount: number
    projects: ProjectWithClient[]
}

export function TaskGroupSection({
    projectId,
    projectName,
    clientName,
    tasks,
    totalSeconds,
    openCount,
    projects,
}: Props) {
    const [open, setOpen] = useState(openCount > 0)
    const completedCount = tasks.length - openCount

    return (
        <>
            {/* Group header row */}
            <TableRow
                className="bg-muted/40 hover:bg-muted/50 border-border/40 cursor-pointer select-none transition-colors"
                onClick={() => setOpen((v) => !v)}
            >
                <TableCell colSpan={5} className="py-2 px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ChevronRight
                                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ${open ? "rotate-90" : ""}`}
                            />
                            <Link
                                href={`/projects/${projectId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs font-medium text-foreground/80 hover:text-foreground transition-colors"
                            >
                                {projectName}
                            </Link>
                            <span className="text-xs text-muted-foreground">{clientName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                                {openCount > 0 ? (
                                    <>
                                        <span className="text-foreground/70 font-medium">{openCount}</span>{" "}
                                        open
                                        {completedCount > 0 && <> · {completedCount} done</>}
                                    </>
                                ) : (
                                    <span className="text-muted-foreground/60">{tasks.length} completed</span>
                                )}
                            </span>
                            <span className="text-xs text-muted-foreground">{fmtHours(totalSeconds)} tracked</span>
                            <span onClick={(e) => e.stopPropagation()}>
                                <TaskForm mode="create" projects={projects} defaultProjectId={projectId}>
                                    <button
                                        type="button"
                                        title={`Add task to ${projectName}`}
                                        className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </TaskForm>
                            </span>
                        </div>
                    </div>
                </TableCell>
            </TableRow>

            {/* Task rows — only when expanded */}
            {open &&
                tasks.map((task) => (
                    <TableRow
                        key={task.id}
                        className={`border-border/40 hover:bg-muted/20 transition-colors ${task.completed ? "opacity-50" : ""}`}
                    >
                        <TableCell className="py-3">
                            <div className="flex items-start gap-2.5">
                                {task.completed ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                ) : (
                                    <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                )}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span
                                            className={`text-sm font-medium leading-tight ${
                                                task.completed ? "line-through text-muted-foreground" : "text-foreground"
                                            }`}
                                        >
                                            {task.name}
                                        </span>
                                        {task.linearIssueId && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] h-4 px-1.5 font-normal border-border/60 text-muted-foreground gap-0.5"
                                            >
                                                <Link2 className="h-2.5 w-2.5" />
                                                Linear
                                            </Badge>
                                        )}
                                    </div>
                                    {task.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                            {task.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </TableCell>

                        <TableCell className="py-3">
                            <Badge
                                variant="outline"
                                className={`text-[10px] h-4 px-1.5 font-normal border-border/60 ${
                                    task.completed
                                        ? "text-muted-foreground"
                                        : "text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30"
                                }`}
                            >
                                {task.completed ? "Completed" : "Open"}
                            </Badge>
                        </TableCell>

                        <TableCell className="py-3">
                            <span className="text-xs text-muted-foreground">
                                {task.isBillable ? "Billable" : "Non-billable"}
                            </span>
                        </TableCell>

                        <TableCell className="py-3 text-right">
                            <span className="text-sm font-medium text-foreground tabular-nums">
                                {fmtHours(task.trackedSeconds)}
                            </span>
                        </TableCell>

                        <TableCell className="py-3 text-right">
                            <TaskForm mode="edit" task={task} projects={projects} />
                        </TableCell>
                    </TableRow>
                ))}
        </>
    )
}

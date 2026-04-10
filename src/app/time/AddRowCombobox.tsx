"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Plus, ChevronRight } from "lucide-react"

export interface ProjectWithTasks {
    id: string
    name: string
    code?: string | null
    client?: { name: string } | null
    tasks: { id: string; name: string }[]
}

export interface AddedRow {
    projectId: string
    projectName: string
    clientName: string | null
    taskId: string | null
    taskName: string | null
}

interface Props {
    projects: ProjectWithTasks[]
    onAdd: (row: AddedRow) => void
    disabled?: boolean
}

export function AddRowCombobox({ projects, onAdd, disabled }: Props) {
    const [open, setOpen] = useState(false)
    const [selectedProject, setSelectedProject] = useState<ProjectWithTasks | null>(null)
    const [step, setStep] = useState<"project" | "task">("project")

    function reset() {
        setSelectedProject(null)
        setStep("project")
    }

    function handleOpenChange(v: boolean) {
        setOpen(v)
        if (!v) reset()
    }

    function selectProject(p: ProjectWithTasks) {
        if (p.tasks.length <= 1) {
            const task = p.tasks[0] ?? null
            onAdd({ projectId: p.id, projectName: p.name, clientName: p.client?.name ?? null, taskId: task?.id ?? null, taskName: task?.name ?? null })
            setOpen(false)
            reset()
        } else {
            setSelectedProject(p)
            setStep("task")
        }
    }

    function selectTask(t: { id: string; name: string } | null) {
        if (!selectedProject) return
        onAdd({
            projectId: selectedProject.id,
            projectName: selectedProject.name,
            clientName: selectedProject.client?.name ?? null,
            taskId: t?.id ?? null,
            taskName: t?.name ?? null,
        })
        setOpen(false)
        reset()
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground h-8"
                    disabled={disabled}
                >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add row
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-64" align="start">
                {step === "project" && (
                    <Command>
                        <CommandInput placeholder="Search project…" autoFocus />
                        <CommandList>
                            <CommandEmpty>No projects found.</CommandEmpty>
                            <CommandGroup>
                                {projects.map(p => (
                                    <CommandItem
                                        key={p.id}
                                        value={`${p.code ?? ""} ${p.name} ${p.client?.name ?? ""}`}
                                        onSelect={() => selectProject(p)}
                                        className="flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <div className="flex-1 min-w-0">
                                            {p.client && <div className="text-[10px] text-muted-foreground leading-none mb-0.5">{p.client.name}</div>}
                                            <div className="flex items-center gap-1 truncate">
                                                {p.code && <span className="font-mono text-xs text-muted-foreground shrink-0">[{p.code}]</span>}
                                                <span className="truncate">{p.name}</span>
                                            </div>
                                        </div>
                                        {p.tasks.length > 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                )}
                {step === "task" && selectedProject && (
                    <Command>
                        <CommandInput placeholder="Search task…" autoFocus />
                        <CommandList>
                            <CommandEmpty>No tasks found.</CommandEmpty>
                            <CommandGroup heading={selectedProject.name}>
                                {selectedProject.tasks.map(t => (
                                    <CommandItem
                                        key={t.id}
                                        value={t.name}
                                        onSelect={() => selectTask(t)}
                                        className="cursor-pointer"
                                    >
                                        {t.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                )}
            </PopoverContent>
        </Popover>
    )
}

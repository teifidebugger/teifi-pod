"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateProjectStatus, deleteProject, duplicateProject } from "@/app/actions/projects"
import { ProjectForm } from "../ProjectForm"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Archive, ArchiveRestore, Trash2, Loader2, Copy } from "lucide-react"
import { toast } from "sonner"

interface ProjectData {
    id: string
    name: string
    code: string | null
    description: string | null
    status: string
    billingType: string
    billBy: string
    hourlyRateCents: number | null
    budgetHours: number | null
    budgetCents: number | null
    feeCents: number | null
    budgetBy: string
    costBudgetCents: number | null
    costBudgetIncludeExpenses: boolean
    notifyWhenOverBudget: boolean
    overBudgetNotificationPercent: number
    color: string
    clientId: string | null
    startsOn: Date | string | null
    endsOn: Date | string | null
    budgetIsMonthly: boolean
    showBudgetToAll: boolean
    managerId: string | null
}

interface ClientOption {
    id: string
    name: string
}

interface ManagerOption {
    id: string
    name: string | null
    email: string
    role: string
}

interface Props {
    project: ProjectData
    clients: ClientOption[]
    managers?: ManagerOption[]
}

export function ProjectDetailActions({ project, clients, managers }: Props) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    function handleStatusChange(status: string) {
        startTransition(async () => {
            try {
                await updateProjectStatus(project.id, status)
                toast.success(status === "ARCHIVED" ? "Project archived" : "Project unarchived")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to update status")
            }
        })
    }

    function handleDuplicate() {
        startTransition(async () => {
            try {
                const newId = await duplicateProject(project.id)
                toast.success("Project duplicated")
                router.push(`/projects/${newId}`)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to duplicate project")
            }
        })
    }

    function handleDelete() {
        if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return
        startTransition(async () => {
            const fd = new FormData()
            fd.set("id", project.id)
            try {
                await deleteProject(fd)
                toast.success("Project deleted")
                router.push("/projects")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to delete project")
            }
        })
    }

    return (
        <div className="flex items-center gap-2">
            <ProjectForm project={project} clients={clients} managers={managers} mode="edit">
                <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1.5" />
                    Edit Project
                </Button>
            </ProjectForm>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={pending}>
                        {pending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <MoreHorizontal className="w-4 h-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDuplicate}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                    </DropdownMenuItem>
                    {project.status === "ARCHIVED" ? (
                        <DropdownMenuItem onClick={() => handleStatusChange("ACTIVE")}>
                            <ArchiveRestore className="w-4 h-4 mr-2" />
                            Unarchive
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={() => handleStatusChange("ARCHIVED")}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

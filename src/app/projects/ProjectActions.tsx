"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateProjectStatus, deleteProject, duplicateProject, activateProject } from "@/app/actions/projects"
import { ProjectForm } from "./ProjectForm"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Settings,
    Archive,
    ArchiveRestore,
    Trash2,
    MoreHorizontal,
    Pencil,
    Copy,
    CirclePlay,
    Link2,
} from "lucide-react"
import { toast } from "sonner"
import { LinearMappingForm } from "./[id]/settings/LinearMappingForm"

interface ProjectActionsProject {
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

interface LinearTeamOption {
    id: string
    name: string
    key: string
}

interface ProjectActionsProps {
    project: ProjectActionsProject & {
        linearTeamId?: string | null
        linearProjectId?: string | null
        linearProjectName?: string | null
        linearTeam?: { key: string; name: string } | null
    }
    clients: ClientOption[]
    managers?: ManagerOption[]
    linearTeams?: LinearTeamOption[]
}

export function ProjectActions({ project, clients, managers, linearTeams }: ProjectActionsProps) {
    const router = useRouter()
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [linearOpen, setLinearOpen] = useState(false)
    const [duplicating, setDuplicating] = useState(false)
    const [activating, setActivating] = useState(false)
    const isArchived = project.status === "ARCHIVED"
    const isTentative = project.status === "TENTATIVE"

    async function handleArchiveToggle() {
        try {
            const newStatus = isArchived ? "ACTIVE" : "ARCHIVED"
            await updateProjectStatus(project.id, newStatus)
            toast.success(isArchived ? "Project unarchived" : "Project archived")
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to update status")
        }
    }

    async function handleDuplicate() {
        setDuplicating(true)
        try {
            const newId = await duplicateProject(project.id)
            toast.success("Project duplicated")
            router.push(`/projects/${newId}`)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to duplicate project")
        } finally {
            setDuplicating(false)
        }
    }

    async function handleActivate() {
        setActivating(true)
        try {
            await activateProject(project.id)
            toast.success("Project activated")
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to activate project")
        } finally {
            setActivating(false)
        }
    }

    async function handleDelete() {
        try {
            const formData = new FormData()
            formData.append("id", project.id)
            await deleteProject(formData)
            toast.success("Project deleted")
            setDeleteOpen(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to delete project")
            setDeleteOpen(false)
        }
    }

    return (
        <>
            <TooltipProvider delayDuration={300}>
                <div className="flex items-center gap-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setEditOpen(true)}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Edit</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => router.push(`/projects/${project.id}/settings`)}>
                                <Settings className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Settings</TooltipContent>
                    </Tooltip>

                    {linearTeams && linearTeams.length > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setLinearOpen(true)}>
                                    <Link2 className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Link Linear</TooltipContent>
                        </Tooltip>
                    )}

                    {/* Overflow: Duplicate, Activate/Archive, Delete */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={handleDuplicate} disabled={duplicating}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                            </DropdownMenuItem>
                            {isTentative && (
                                <DropdownMenuItem onSelect={handleActivate} disabled={activating}>
                                    <CirclePlay className="mr-2 h-4 w-4 text-violet-600" />
                                    Activate Project
                                </DropdownMenuItem>
                            )}
                            {!isTentative && (
                                <DropdownMenuItem onSelect={handleArchiveToggle}>
                                    {isArchived ? (
                                        <><ArchiveRestore className="mr-2 h-4 w-4" />Unarchive</>
                                    ) : (
                                        <><Archive className="mr-2 h-4 w-4" />Archive</>
                                    )}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TooltipProvider>

            {/* Edit dialog -- controlled via editOpen state */}
            <ProjectForm
                mode="edit"
                project={project}
                clients={clients}
                managers={managers}
            >
                <span
                    ref={(el) => {
                        if (el && editOpen) {
                            el.click()
                            setEditOpen(false)
                        }
                    }}
                    className="hidden"
                />
            </ProjectForm>

            {/* Linear mapping dialog */}
            {linearTeams && linearTeams.length > 0 && (
                <Dialog open={linearOpen} onOpenChange={setLinearOpen}>
                    <DialogContent className="sm:max-w-lg overflow-visible">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.03509 12.9431C3.24245 14.9227 4.10472 16.8468 5.62188 18.364C7.13904 19.8811 9.0631 20.7434 11.0428 20.9508L3.03509 12.9431Z" />
                                    <path d="M3 11.4938L12.4921 20.9858C13.2976 20.9407 14.0981 20.7879 14.8704 20.5273L3.4585 9.11548C3.19793 9.88771 3.0451 10.6883 3 11.4938Z" />
                                    <path d="M3.86722 8.10999L15.8758 20.1186C16.4988 19.8201 17.0946 19.4458 17.6493 18.9956L4.99021 6.33659C4.54006 6.89125 4.16573 7.487 3.86722 8.10999Z" />
                                    <path d="M5.66301 5.59517C9.18091 2.12137 14.8488 2.135 18.3498 5.63604C21.8508 9.13708 21.8645 14.8049 18.3907 18.3228L5.66301 5.59517Z" />
                                </svg>
                                Link Linear — {project.name}
                            </DialogTitle>
                            <DialogDescription>
                                Map this project to a Linear team to show issues in the timer.
                            </DialogDescription>
                        </DialogHeader>
                        <LinearMappingForm
                            projectId={project.id}
                            currentTeamId={project.linearTeamId ?? null}
                            currentTeamName={project.linearTeam?.name ?? null}
                            currentTeamKey={project.linearTeam?.key ?? null}
                            currentProjectId={project.linearProjectId ?? null}
                            currentProjectName={project.linearProjectName ?? null}
                            linearTeams={linearTeams}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete confirmation dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete project</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be undone.
                            Projects with time entries or tasks cannot be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

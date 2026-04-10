"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { assignProjectToMember, unassignProjectFromMember } from "@/app/actions/team"

type AssignedProject = {
    projectId: string
    name: string
    status: string
    billableRateCents: number | null
}

type Project = {
    id: string
    name: string
    status: string
}

export function ProjectsForm({ memberId, assignedProjects: initial, allProjects }: {
    memberId: string
    assignedProjects: AssignedProject[]
    allProjects: Project[]
}) {
    const [assigned, setAssigned] = useState(initial)
    const [selectedProjectId, setSelectedProjectId] = useState("__none__")
    const [isPending, startTransition] = useTransition()

    const unassigned = allProjects.filter(p => !assigned.some(a => a.projectId === p.id))

    function handleAssign() {
        if (selectedProjectId === "__none__") return
        const project = allProjects.find(p => p.id === selectedProjectId)!
        startTransition(async () => {
            try {
                await assignProjectToMember(memberId, selectedProjectId)
                setAssigned(prev => [...prev, {
                    projectId: selectedProjectId,
                    name: project.name,
                    status: project.status,
                    billableRateCents: null,
                }])
                setSelectedProjectId("__none__")
                toast.success(`Added to ${project.name}`)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to assign project")
            }
        })
    }

    function handleUnassign(projectId: string, name: string) {
        startTransition(async () => {
            try {
                await unassignProjectFromMember(memberId, projectId)
                setAssigned(prev => prev.filter(a => a.projectId !== projectId))
                toast.success(`Removed from ${name}`)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to remove assignment")
            }
        })
    }

    return (
        <div className="space-y-4">
            <Card className="border-sidebar-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Assigned Projects ({assigned.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {assigned.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                            Not assigned to any projects yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-sidebar-border/50">
                            {assigned.map(a => (
                                <div key={a.projectId} className="flex items-center gap-3 px-4 py-3 group hover:bg-sidebar/30 transition-colors">
                                    <span className="flex-1 text-sm font-medium truncate">{a.name}</span>
                                    <Badge
                                        variant={a.status === "ACTIVE" ? "default" : "secondary"}
                                        className="text-[10px] h-4 px-1.5 shrink-0"
                                    >
                                        {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                                    </Badge>
                                    <button
                                        type="button"
                                        onClick={() => handleUnassign(a.projectId, a.name)}
                                        disabled={isPending}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive disabled:opacity-30 shrink-0"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {unassigned.length > 0 && (
                <Card className="border-sidebar-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Add to Project
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select a project..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">— Select a project —</SelectItem>
                                    {unassigned.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleAssign}
                                disabled={isPending || selectedProjectId === "__none__"}
                            >
                                {isPending
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Plus className="h-3.5 w-3.5" />
                                }
                                Assign
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

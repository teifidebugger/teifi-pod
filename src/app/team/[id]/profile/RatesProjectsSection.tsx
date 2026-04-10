"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, DollarSign, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { updateMyRates } from "@/app/actions/profile"
import { updateMemberRates, assignProjectToMember, unassignProjectFromMember } from "@/app/actions/team"

function centsToDisplay(cents: number): string {
    return (cents / 100).toFixed(2)
}

function displayToCents(value: string): number {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return 0
    return Math.round(num * 100)
}

interface ProjectMemberRow {
    projectId: string
    projectName: string
    billingType: string
    billableRateCents: number | null
    status?: string
}

interface AllProject {
    id: string
    name: string
    status: string
}

interface RatesProjectsSectionProps {
    memberId: string
    isSelf: boolean
    isAdmin: boolean
    defaultBillableCents: number
    costRateCents: number
    projectMembers: ProjectMemberRow[]
    allProjects?: AllProject[]
}

export function RatesProjectsSection({
    memberId,
    isSelf,
    isAdmin,
    defaultBillableCents,
    costRateCents,
    projectMembers,
    allProjects,
}: RatesProjectsSectionProps) {
    if (!isSelf && !isAdmin) {
        return (
            <div className="rounded-md border border-dashed border-sidebar-border px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">Rate information is private.</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Only the member themselves or a workspace admin can view rates.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <RatesForm
                memberId={memberId}
                isSelf={isSelf}
                isAdmin={isAdmin}
                defaultBillableCents={defaultBillableCents}
                costRateCents={costRateCents}
            />

            <Separator className="border-sidebar-border" />

            {isAdmin && !isSelf && allProjects ? (
                <AdminProjectsForm
                    memberId={memberId}
                    assignedProjects={projectMembers.map(pm => ({
                        projectId: pm.projectId,
                        name: pm.projectName,
                        status: pm.status ?? "ACTIVE",
                        billableRateCents: pm.billableRateCents,
                    }))}
                    allProjects={allProjects}
                />
            ) : (
                <ProjectsReadOnly
                    projectMembers={projectMembers}
                    defaultBillableCents={defaultBillableCents}
                />
            )}
        </div>
    )
}

function RatesForm({
    memberId,
    isSelf,
    isAdmin,
    defaultBillableCents,
    costRateCents,
}: {
    memberId: string
    isSelf: boolean
    isAdmin: boolean
    defaultBillableCents: number
    costRateCents: number
}) {
    const [saving, setSaving] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        const fd = new FormData(e.currentTarget)

        try {
            if (isSelf) {
                await updateMyRates({
                    defaultBillableCents: displayToCents(fd.get("defaultBillable") as string),
                    costRateCents: displayToCents(fd.get("costRate") as string),
                })
            } else {
                await updateMemberRates(memberId, {
                    defaultBillableCents: displayToCents(fd.get("defaultBillable") as string),
                    costRateCents: displayToCents(fd.get("costRate") as string),
                })
            }
            toast.success("Rates updated")
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to save rates")
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Default rates</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Applied when a project has no per-person rate override
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <div className="space-y-1.5">
                        <Label htmlFor="defaultBillable" className="text-xs">Billable rate ($/hr)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                id="defaultBillable"
                                name="defaultBillable"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={centsToDisplay(defaultBillableCents)}
                                className="h-9 pl-7"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="costRate" className="text-xs">Cost rate ($/hr)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                id="costRate"
                                name="costRate"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={centsToDisplay(costRateCents)}
                                className="h-9 pl-7"
                            />
                        </div>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Cost rate is used internally for profitability reports and is not visible to clients.
                </p>
            </div>

            <div className="pt-0">
                <Button type="submit" disabled={saving} size="sm">
                    {saving && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                    Save rates
                </Button>
            </div>
        </form>
    )
}

function ProjectsReadOnly({
    projectMembers,
    defaultBillableCents,
}: {
    projectMembers: ProjectMemberRow[]
    defaultBillableCents: number
}) {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-foreground">Assigned projects</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Projects assigned by the workspace admin
                </p>
            </div>

            {projectMembers.length === 0 ? (
                <div className="rounded-md border border-dashed border-sidebar-border px-6 py-10 text-center">
                    <p className="text-sm text-muted-foreground">Not assigned to any projects yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Ask your workspace admin to assign you to a project.
                    </p>
                </div>
            ) : (
                <div className="rounded-md border border-sidebar-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/30 border-b border-sidebar-border">
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Project</th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Billing type</th>
                                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Rate ($/hr)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border/50">
                            {projectMembers.map((pm) => (
                                <tr key={pm.projectId} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-2.5 font-medium">{pm.projectName}</td>
                                    <td className="px-4 py-2.5">
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {pm.billingType.replace("_", " ").toLowerCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right tabular-nums">
                                        {pm.billableRateCents !== null ? (
                                            <span className="font-medium">
                                                ${centsToDisplay(pm.billableRateCents)}/hr
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">
                                                ${centsToDisplay(defaultBillableCents)}/hr (default)
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

type AssignedProject = {
    projectId: string
    name: string
    status: string
    billableRateCents: number | null
}

function AdminProjectsForm({
    memberId,
    assignedProjects: initial,
    allProjects,
}: {
    memberId: string
    assignedProjects: AssignedProject[]
    allProjects: AllProject[]
}) {
    const [assigned, setAssigned] = useState(initial)
    const [selectedProjectId, setSelectedProjectId] = useState("__none__")
    const [isPending, setIsPending] = useState(false)

    const unassigned = allProjects.filter(p => !assigned.some(a => a.projectId === p.id))

    async function handleAssign() {
        if (selectedProjectId === "__none__") return
        const project = allProjects.find(p => p.id === selectedProjectId)!
        setIsPending(true)
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
            toast.error(err instanceof Error ? err.message : "Failed to assign project")
        } finally {
            setIsPending(false)
        }
    }

    async function handleUnassign(projectId: string, name: string) {
        setIsPending(true)
        try {
            await unassignProjectFromMember(memberId, projectId)
            setAssigned(prev => prev.filter(a => a.projectId !== projectId))
            toast.success(`Removed from ${name}`)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to remove assignment")
        } finally {
            setIsPending(false)
        }
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
                                    <SelectItem value="__none__">-- Select a project --</SelectItem>
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

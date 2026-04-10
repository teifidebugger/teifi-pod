"use client"

import { useState } from "react"
import { createProject, updateProject, deleteProject } from "@/app/actions/projects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus, Edit, Trash2, Clock, DollarSign, Ban } from "lucide-react"
import { toast } from "sonner"
import { BillingType } from "@prisma/client"
import { COLOR_SWATCHES, type ColorKey } from "@/lib/project-colors"

interface WorkspaceMemberOption {
    id: string
    name: string | null
    email: string
    role: string
}

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

interface ProjectFormProps {
    project?: ProjectData
    clients: ClientOption[]
    managers?: WorkspaceMemberOption[]
    mode: "create" | "edit"
    children?: React.ReactNode
}

function formatDateValue(d: Date | string | null | undefined): string {
    if (!d) return ""
    const date = typeof d === "string" ? new Date(d) : d
    return date.toISOString().split("T")[0]
}

type ProjectTypeKey = "HOURLY" | "FIXED_FEE" | "NON_BILLABLE"

const PROJECT_TYPES: { key: ProjectTypeKey; title: string; subtitle: string; icon: React.ReactNode }[] = [
    {
        key: "HOURLY",
        title: "Time & Materials",
        subtitle: "Bill by the hour with billable rates",
        icon: <Clock className="w-5 h-5" />,
    },
    {
        key: "FIXED_FEE",
        title: "Fixed Fee",
        subtitle: "Bill a set price regardless of time tracked",
        icon: <DollarSign className="w-5 h-5" />,
    },
    {
        key: "NON_BILLABLE",
        title: "Non-Billable",
        subtitle: "Not billed to a client",
        icon: <Ban className="w-5 h-5" />,
    },
]

export function ProjectForm({ project, clients, managers, mode, children }: ProjectFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [billingType, setBillingType] = useState<ProjectTypeKey>((project?.billingType as ProjectTypeKey) || "HOURLY")
    const [billBy, setBillBy] = useState<string>(project?.billBy || "People")
    const [budgetBy, setBudgetBy] = useState<string>(project?.budgetBy || "project_hours")
    const [notifyWhenOverBudget, setNotifyWhenOverBudget] = useState<boolean>(project?.notifyWhenOverBudget || false)
    const [costBudgetIncludeExpenses, setCostBudgetIncludeExpenses] = useState<boolean>(project?.costBudgetIncludeExpenses || false)
    const [budgetIsMonthly, setBudgetIsMonthly] = useState<boolean>(project?.budgetIsMonthly || false)
    const [showBudgetToAll, setShowBudgetToAll] = useState<boolean>(project?.showBudgetToAll || false)
    const [color, setColor] = useState<ColorKey>((project?.color as ColorKey) || "orange")
    const [managerId, setManagerId] = useState<string>(project?.managerId || "__none__")
    const [projectStatus, setProjectStatus] = useState<string>(project?.status || "ACTIVE")
    const [clientId, setClientId] = useState<string>(project?.clientId || "__none__")

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        if (project) formData.append("id", project.id)
        // Append state-driven values
        formData.set("billingType", billingType)
        formData.set("billBy", billingType === "NON_BILLABLE" ? "none" : billBy)
        formData.set("budgetBy", budgetBy)
        formData.set("notifyWhenOverBudget", notifyWhenOverBudget ? "true" : "false")
        formData.set("costBudgetIncludeExpenses", costBudgetIncludeExpenses ? "true" : "false")
        formData.set("budgetIsMonthly", budgetIsMonthly ? "true" : "false")
        formData.set("showBudgetToAll", showBudgetToAll ? "true" : "false")
        formData.set("managerId", managerId === "__none__" ? "" : managerId)
        formData.set("clientId", clientId === "__none__" ? "" : clientId)
        formData.set("status", projectStatus)

        try {
            if (mode === "create") {
                await createProject(formData)
                toast.success("Project created")
            } else {
                await updateProject(formData)
                toast.success("Project updated")
            }
            setOpen(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to save project")
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!project) return
        if (!confirm("Are you sure you want to delete this project?")) return

        setDeleting(true)
        const formData = new FormData()
        formData.append("id", project.id)

        try {
            await deleteProject(formData)
            toast.success("Project deleted")
            setOpen(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to delete project")
        } finally {
            setDeleting(false)
        }
    }

    // Budget options vary by billing type
    const budgetOptions = billingType === "HOURLY"
        ? [
            { value: "none", label: "No budget" },
            { value: "project_hours", label: "Total project hours" },
            { value: "project_cost", label: "Total project fees" },
            { value: "task", label: "Hours per task" },
            { value: "person", label: "Hours per person" },
        ]
        : billingType === "FIXED_FEE"
            ? [
                { value: "none", label: "No budget" },
                { value: "project_hours", label: "Total project hours" },
                { value: "task", label: "Hours per task" },
                { value: "person", label: "Hours per person" },
            ]
            : [
                { value: "none", label: "No budget" },
                { value: "project_hours", label: "Total project hours" },
                { value: "task", label: "Hours per task" },
                { value: "person", label: "Hours per person" },
            ]

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant={mode === "create" ? "default" : "outline"} size={mode === "create" ? "default" : "sm"}>
                        {mode === "create" ? (
                            <><Plus className="w-4 h-4 mr-2" /> New Project</>
                        ) : (
                            <><Edit className="w-4 h-4" /></>
                        )}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "New Project" : "Edit Project"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create" ? "Add a new project to your workspace." : "Update project details and billing settings."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-6 pt-2">
                    <input type="hidden" name="color" value={color} />

                    {/* ── Section 1: Basics ── */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Basics</h3>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="clientId">Client</Label>
                            <Select value={clientId} onValueChange={setClientId}>
                                <SelectTrigger id="clientId">
                                    <SelectValue placeholder="No Client (Internal)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">No Client (Internal)</SelectItem>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="name">Project Name *</Label>
                                <Input id="name" name="name" defaultValue={project?.name} required placeholder="Website Redesign" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Project Code</Label>
                                <Input id="code" name="code" defaultValue={project?.code ?? ""} maxLength={10} placeholder="e.g. VNM" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startsOn">Start Date</Label>
                                <Input id="startsOn" name="startsOn" type="date" defaultValue={formatDateValue(project?.startsOn)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endsOn">End Date</Label>
                                <Input id="endsOn" name="endsOn" type="date" defaultValue={formatDateValue(project?.endsOn)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Notes</Label>
                            <Textarea id="description" name="description" defaultValue={project?.description ?? ""} placeholder="Optional project notes..." rows={2} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label>Color</Label>
                                    <span
                                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: COLOR_SWATCHES.find(s => s.key === color)?.hex }}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    {COLOR_SWATCHES.map(s => (
                                        <button
                                            key={s.key}
                                            type="button"
                                            onClick={() => setColor(s.key)}
                                            className={`w-7 h-7 rounded-full transition-all ${color === s.key ? "ring-2 ring-offset-2 ring-foreground scale-110" : "opacity-70 hover:opacity-100"}`}
                                            style={{ backgroundColor: s.hex }}
                                            title={s.key}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={projectStatus} onValueChange={setProjectStatus}>
                                    <SelectTrigger
                                        id="status"
                                        className={projectStatus === "TENTATIVE" ? "border-violet-400 text-violet-600 dark:border-violet-500 dark:text-violet-400" : ""}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="TENTATIVE">Pipeline (Estimate only)</SelectItem>
                                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* ── Section 2: Permissions ── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Permissions</h3>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        <RadioGroup
                            value={showBudgetToAll ? "everyone" : "admins"}
                            onValueChange={(v) => setShowBudgetToAll(v === "everyone")}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="admins" id="perm-admins" />
                                <Label htmlFor="perm-admins" className="font-normal cursor-pointer">
                                    Show project report to administrators and managers only
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="everyone" id="perm-everyone" />
                                <Label htmlFor="perm-everyone" className="font-normal cursor-pointer">
                                    Show project report to everyone on this project
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* ── Section 3: Project Type ── */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Project Type</h3>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        {projectStatus === "TENTATIVE" && (
                            <div className="rounded-md border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/30 px-4 py-3 text-sm text-violet-700 dark:text-violet-300">
                                This project is estimate-only. Time tracking is disabled until activated.
                            </div>
                        )}

                        {/* 3-card selector */}
                        <div className="grid grid-cols-3 gap-3">
                            {PROJECT_TYPES.map((pt) => {
                                const selected = billingType === pt.key
                                return (
                                    <button
                                        key={pt.key}
                                        type="button"
                                        onClick={() => {
                                            setBillingType(pt.key)
                                            if (pt.key === "NON_BILLABLE") {
                                                setBillBy("none")
                                            } else if (billBy === "none") {
                                                setBillBy("People")
                                            }
                                        }}
                                        className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                                            selected
                                                ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                                                : "border-border hover:border-muted-foreground/30"
                                        }`}
                                    >
                                        <div className={`mb-2 ${selected ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
                                            {pt.icon}
                                        </div>
                                        <div className="text-sm font-medium">{pt.title}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{pt.subtitle}</div>
                                        {selected && (
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-orange-100 dark:bg-orange-950/50 border-b-2 border-r-2 border-orange-500" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Sub-panel */}
                        <div className="rounded-lg border border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/20 p-4 space-y-4">
                            {/* Billable rates (T&M only) */}
                            {billingType === "HOURLY" && (
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Billable rates</Label>
                                    <Select value={billBy} onValueChange={setBillBy}>
                                        <SelectTrigger className="w-full bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No billable rate</SelectItem>
                                            <SelectItem value="People">Person billable rate</SelectItem>
                                            <SelectItem value="Project">Project hourly rate</SelectItem>
                                            <SelectItem value="Tasks">Task hourly rates</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {billBy === "Project" && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">$</span>
                                            <Input
                                                name="hourlyRate"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                defaultValue={project?.hourlyRateCents ? (project.hourlyRateCents / 100).toString() : ""}
                                                placeholder="150.00"
                                                className="w-32 bg-background"
                                            />
                                            <span className="text-xs text-muted-foreground">/ hour</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Fixed fee amount */}
                            {billingType === "FIXED_FEE" && (
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Project fee</Label>
                                    <p className="text-xs text-muted-foreground">Enter the amount you plan to invoice.</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">$</span>
                                        <Input
                                            name="feeCents"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            defaultValue={project?.feeCents ? (project.feeCents / 100).toString() : ""}
                                            placeholder="5000.00"
                                            className="w-40 bg-background"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Budget section (all types) */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Budget</Label>
                                <Select value={budgetBy} onValueChange={setBudgetBy}>
                                    <SelectTrigger className="w-full bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {budgetOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {budgetBy === "project_hours" && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            name="budgetHours"
                                            type="number"
                                            step="1"
                                            min="0"
                                            defaultValue={project?.budgetHours?.toString() || ""}
                                            placeholder="100"
                                            className="w-32 bg-background"
                                        />
                                        <span className="text-xs text-muted-foreground">hours</span>
                                    </div>
                                )}

                                {budgetBy === "project_cost" && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">$</span>
                                            <Input
                                                name="costBudgetCents"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                defaultValue={project?.costBudgetCents ? (project.costBudgetCents / 100).toString() : ""}
                                                placeholder="10000.00"
                                                className="w-40 bg-background"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="costBudgetIncludeExpenses"
                                                checked={costBudgetIncludeExpenses}
                                                onCheckedChange={(v) => setCostBudgetIncludeExpenses(!!v)}
                                            />
                                            <Label htmlFor="costBudgetIncludeExpenses" className="text-sm font-normal cursor-pointer">
                                                Include expenses in budget
                                            </Label>
                                        </div>
                                    </div>
                                )}

                                {budgetBy !== "none" && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="budgetIsMonthly"
                                                checked={budgetIsMonthly}
                                                onCheckedChange={(v) => setBudgetIsMonthly(!!v)}
                                            />
                                            <Label htmlFor="budgetIsMonthly" className="text-sm font-normal cursor-pointer">
                                                Budget resets every month
                                            </Label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Over-budget alerts */}
                            <div className="space-y-3 border-t border-orange-200 dark:border-orange-800/30 pt-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="notifyWhenOverBudget"
                                        checked={notifyWhenOverBudget}
                                        onCheckedChange={(v) => setNotifyWhenOverBudget(!!v)}
                                    />
                                    <Label htmlFor="notifyWhenOverBudget" className="text-sm font-normal cursor-pointer">
                                        Send alert if project exceeds budget threshold
                                    </Label>
                                </div>
                                {notifyWhenOverBudget && (
                                    <div className="flex items-center gap-2 pl-6">
                                        <span className="text-sm text-muted-foreground">Alert at</span>
                                        <Input
                                            name="overBudgetNotificationPercent"
                                            type="number"
                                            step="1"
                                            min="1"
                                            max="100"
                                            defaultValue={project?.overBudgetNotificationPercent?.toString() || "80"}
                                            placeholder="80"
                                            className="h-8 w-20 bg-background"
                                        />
                                        <span className="text-sm text-muted-foreground">% of budget</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Section 4: Manager ── */}
                    {managers && managers.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Project Manager</h3>
                                <div className="h-px flex-1 bg-border" />
                            </div>
                            <Select value={managerId} onValueChange={setManagerId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Assign a project manager" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">No project manager</SelectItem>
                                    {managers.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name || m.email} ({m.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter className="pt-4 flex items-center justify-between sm:justify-between">
                        {mode === "edit" ? (
                            <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={deleting || loading} className="mr-auto">
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Delete
                            </Button>
                        ) : <div />}

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading || deleting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || deleting}>
                                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Save Project
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

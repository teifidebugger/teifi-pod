"use client"

import { useState, useTransition, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { createAllocation, updateAllocation, deleteAllocation, convertPlaceholderAllocation } from "@/app/actions/allocations"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, Trash2, UserCheck, HelpCircle } from "lucide-react"
import type { ScheduleRow } from "./page"

type Project = { id: string; name: string; isTentative?: boolean }

function countWorkingDays(
    start: string,
    end: string,
    holidayDates: string[] = [],
    memberTimeOffDates: string[] = [],
): number {
    if (!start || !end || end < start) return 0
    const holidays = new Set(holidayDates)
    const timeOff = new Set(memberTimeOffDates)
    const s = new Date(start + "T00:00:00")
    const e = new Date(end + "T00:00:00")
    let count = 0
    const cur = new Date(s)
    while (cur <= e) {
        const dow = cur.getDay()
        if (dow !== 0 && dow !== 6) {
            const dateStr = cur.toISOString().slice(0, 10)
            if (!holidays.has(dateStr) && !timeOff.has(dateStr)) {
                count++
            }
        }
        cur.setDate(cur.getDate() + 1)
    }
    return count
}

type AllocationDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    rows: ScheduleRow[]
    projects: Project[]
    defaultRowId?: string
    defaultProjectId?: string
    defaultStartDate?: string
    defaultEndDate?: string
    holidays?: string[]
    memberTimeOff?: Record<string, string[]>
}

export function AllocationDialog({
    open,
    onOpenChange,
    rows,
    projects,
    defaultRowId,
    defaultProjectId,
    defaultStartDate,
    defaultEndDate,
    holidays = [],
    memberTimeOff = {},
}: AllocationDialogProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selectedRowId, setSelectedRowId] = useState(defaultRowId ?? "")
    const [projectId, setProjectId] = useState(defaultProjectId ?? "")
    const [startDate, setStartDate] = useState(defaultStartDate ?? "")
    const [endDate, setEndDate] = useState(defaultEndDate ?? defaultStartDate ?? "")
    const [hoursPerDay, setHoursPerDay] = useState("8")
    const [type, setType] = useState<"SOFT" | "HARD">("SOFT")
    const [notes, setNotes] = useState("")

    const selectedRow = rows.find((r) => r.id === selectedRowId)
    const dailyCapacity = (selectedRow?.weeklyCapacityHours ?? 0) / 5
    const parsedHpd = parseFloat(hoursPerDay) || 0
    const capacityPct = dailyCapacity > 0 ? Math.round((parsedHpd / dailyCapacity) * 100) : null
    const memberDaysOff = selectedRowId ? (memberTimeOff[selectedRowId] ?? []) : []
    const workingDays = countWorkingDays(startDate, endDate, holidays, memberDaysOff)
    const totalHours = workingDays > 0 ? parsedHpd * workingDays : null

    const placeholderRows = rows.filter((r) => r.kind === "placeholder")
    const memberRows = rows.filter((r) => r.kind === "member")

    // Sync state whenever the dialog opens with new defaults (e.g. after drag-to-create)
    useEffect(() => {
        if (open) {
            setSelectedRowId(defaultRowId ?? "")
            setProjectId(defaultProjectId ?? "")
            setStartDate(defaultStartDate ?? "")
            setEndDate(defaultEndDate ?? defaultStartDate ?? "")
            setHoursPerDay("8")
            setType("SOFT")
            setNotes("")
        }
    }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

    function reset() {
        setSelectedRowId(defaultRowId ?? "")
        setProjectId(defaultProjectId ?? "")
        setStartDate(defaultStartDate ?? "")
        setEndDate(defaultEndDate ?? defaultStartDate ?? "")
        setHoursPerDay("8")
        setType("SOFT")
        setNotes("")
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedRowId || !projectId || !startDate || !endDate) {
            toast.error("Please fill in all required fields")
            return
        }
        const row = rows.find((r) => r.id === selectedRowId)
        if (!row) return

        startTransition(async () => {
            try {
                await createAllocation({
                    memberId: row.kind === "member" ? row.id : undefined,
                    placeholderId: row.kind === "placeholder" ? row.id : undefined,
                    projectId,
                    startDate,
                    endDate,
                    hoursPerDay: parseFloat(hoursPerDay) || 8,
                    type,
                    notes: notes || undefined,
                })
                toast.success("Allocation created")
                router.refresh()
                reset()
                onOpenChange(false)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to create allocation")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {selectedRow ? `${selectedRow.name}'s assignment` : "New Allocation"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="assignee">Assign To *</Label>
                        <Select value={selectedRowId} onValueChange={setSelectedRowId}>
                            <SelectTrigger id="assignee">
                                <SelectValue placeholder="Select person or placeholder..." />
                            </SelectTrigger>
                            <SelectContent>
                                {placeholderRows.length > 0 && (
                                    <SelectGroup>
                                        <SelectLabel className="flex items-center gap-1.5">
                                            <HelpCircle className="h-3 w-3 text-amber-500" />
                                            Placeholders
                                        </SelectLabel>
                                        {placeholderRows.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                <span className="text-amber-600 dark:text-amber-400 mr-1">?</span>
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}
                                {placeholderRows.length > 0 && memberRows.length > 0 && (
                                    <Separator className="my-1" />
                                )}
                                <SelectGroup>
                                    {placeholderRows.length > 0 && (
                                        <SelectLabel>Team Members</SelectLabel>
                                    )}
                                    {memberRows.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project">Project *</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger id="project">
                                <SelectValue placeholder="Select project..." />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}{p.isTentative ? " (Pipeline)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date *</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date *</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="hoursPerDay">Hours / Day</Label>
                            <Input
                                id="hoursPerDay"
                                type="number"
                                min="0.5"
                                max="24"
                                step="0.5"
                                value={hoursPerDay}
                                onChange={(e) => setHoursPerDay(e.target.value)}
                            />
                            {selectedRow && parsedHpd > 0 && dailyCapacity > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {parsedHpd}h/d &middot; {capacityPct}% of {dailyCapacity}h capacity
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Total Hours</Label>
                            <div className="h-9 flex items-center px-3 rounded-md border border-input bg-muted/50 text-sm font-medium">
                                {totalHours !== null ? `${totalHours}h` : "—"}
                            </div>
                            {workingDays > 0 && totalHours !== null && (
                                <p className="text-xs text-muted-foreground">
                                    {totalHours}h across {workingDays} working day{workingDays !== 1 ? "s" : ""}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Allocation Type</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={type === "SOFT" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setType("SOFT")}
                                className="flex-1"
                            >
                                Soft (Tentative)
                            </Button>
                            <Button
                                type="button"
                                variant={type === "HARD" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setType("HARD")}
                                className="flex-1"
                            >
                                Hard (Confirmed)
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Optional notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                            {isPending ? "Creating..." : "Create Allocation"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

type EditAllocationDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    allocation: {
        id: string
        rowId: string
        memberId: string | null
        placeholderId: string | null
        projectId: string
        startDate: string
        endDate: string
        hoursPerDay: number
        type: "SOFT" | "HARD"
        notes: string | null
    }
    rows: ScheduleRow[]
    projects: Project[]
    holidays?: string[]
    memberTimeOff?: Record<string, string[]>
}

export function EditAllocationDialog({
    open,
    onOpenChange,
    allocation,
    rows,
    projects,
    holidays = [],
    memberTimeOff = {},
}: EditAllocationDialogProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isDeleting, startDeleteTransition] = useTransition()
    const [isConverting, startConvertTransition] = useTransition()
    const [selectedRowId, setSelectedRowId] = useState(allocation.rowId)
    const [projectId, setProjectId] = useState(allocation.projectId)
    const [startDate, setStartDate] = useState(allocation.startDate)
    const [endDate, setEndDate] = useState(allocation.endDate)
    const [hoursPerDay, setHoursPerDay] = useState(String(allocation.hoursPerDay))
    const [type, setType] = useState<"SOFT" | "HARD">(allocation.type)
    const [notes, setNotes] = useState(allocation.notes ?? "")
    const [showReassign, setShowReassign] = useState(false)
    const [reassignMemberId, setReassignMemberId] = useState("")

    const selectedRow = rows.find((r) => r.id === selectedRowId)
    const dailyCapacity = (selectedRow?.weeklyCapacityHours ?? 0) / 5
    const parsedHpd = parseFloat(hoursPerDay) || 0
    const capacityPct = dailyCapacity > 0 ? Math.round((parsedHpd / dailyCapacity) * 100) : null
    const editMemberDaysOff = selectedRowId ? (memberTimeOff[selectedRowId] ?? []) : []
    const workingDays = countWorkingDays(startDate, endDate, holidays, editMemberDaysOff)
    const totalHours = workingDays > 0 ? parsedHpd * workingDays : null

    const isPlaceholderAllocation = !!allocation.placeholderId
    const placeholderRows = rows.filter((r) => r.kind === "placeholder")
    const memberRows = rows.filter((r) => r.kind === "member")

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const row = rows.find((r) => r.id === selectedRowId)
        if (!row) return

        startTransition(async () => {
            try {
                await updateAllocation(allocation.id, {
                    memberId: row.kind === "member" ? row.id : undefined,
                    placeholderId: row.kind === "placeholder" ? row.id : undefined,
                    projectId,
                    startDate,
                    endDate,
                    hoursPerDay: parseFloat(hoursPerDay) || 8,
                    type,
                    notes: notes || undefined,
                })
                toast.success("Allocation updated")
                router.refresh()
                onOpenChange(false)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to update allocation")
            }
        })
    }

    function handleDelete() {
        startDeleteTransition(async () => {
            try {
                await deleteAllocation(allocation.id)
                toast.success("Allocation deleted")
                router.refresh()
                onOpenChange(false)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to delete allocation")
            }
        })
    }

    function handleReassign() {
        if (!reassignMemberId) {
            toast.error("Please select a team member")
            return
        }
        startConvertTransition(async () => {
            try {
                await convertPlaceholderAllocation(allocation.id, reassignMemberId)
                toast.success("Allocation reassigned to team member")
                router.refresh()
                onOpenChange(false)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to reassign allocation")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {selectedRow ? `${selectedRow.name}'s assignment` : "Edit Allocation"}
                    </DialogTitle>
                </DialogHeader>

                {/* Reassign panel for placeholder allocations */}
                {isPlaceholderAllocation && showReassign && (
                    <div className="rounded-lg border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                            <UserCheck className="h-4 w-4" />
                            Reassign to Team Member
                        </div>
                        <Select value={reassignMemberId} onValueChange={setReassignMemberId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select team member..." />
                            </SelectTrigger>
                            <SelectContent>
                                {memberRows.map((r) => (
                                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setShowReassign(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleReassign}
                                disabled={isConverting || !reassignMemberId}
                            >
                                {isConverting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                                {isConverting ? "Reassigning..." : "Reassign"}
                            </Button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-assignee">Assign To</Label>
                        <Select value={selectedRowId} onValueChange={setSelectedRowId}>
                            <SelectTrigger id="edit-assignee">
                                <SelectValue placeholder="Select person or placeholder..." />
                            </SelectTrigger>
                            <SelectContent>
                                {placeholderRows.length > 0 && (
                                    <SelectGroup>
                                        <SelectLabel className="flex items-center gap-1.5">
                                            <HelpCircle className="h-3 w-3 text-amber-500" />
                                            Placeholders
                                        </SelectLabel>
                                        {placeholderRows.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                <span className="text-amber-600 dark:text-amber-400 mr-1">?</span>
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}
                                {placeholderRows.length > 0 && memberRows.length > 0 && (
                                    <Separator className="my-1" />
                                )}
                                <SelectGroup>
                                    {placeholderRows.length > 0 && (
                                        <SelectLabel>Team Members</SelectLabel>
                                    )}
                                    {memberRows.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-project">Project</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger id="edit-project">
                                <SelectValue placeholder="Select project..." />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}{p.isTentative ? " (Pipeline)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="edit-startDate">Start Date</Label>
                            <Input
                                id="edit-startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-endDate">End Date</Label>
                            <Input
                                id="edit-endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="edit-hoursPerDay">Hours / Day</Label>
                            <Input
                                id="edit-hoursPerDay"
                                type="number"
                                min="0.5"
                                max="24"
                                step="0.5"
                                value={hoursPerDay}
                                onChange={(e) => setHoursPerDay(e.target.value)}
                            />
                            {selectedRow && parsedHpd > 0 && dailyCapacity > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {parsedHpd}h/d &middot; {capacityPct}% of {dailyCapacity}h capacity
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Total Hours</Label>
                            <div className="h-9 flex items-center px-3 rounded-md border border-input bg-muted/50 text-sm font-medium">
                                {totalHours !== null ? `${totalHours}h` : "—"}
                            </div>
                            {workingDays > 0 && totalHours !== null && (
                                <p className="text-xs text-muted-foreground">
                                    {totalHours}h across {workingDays} working day{workingDays !== 1 ? "s" : ""}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Allocation Type</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={type === "SOFT" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setType("SOFT")}
                                className="flex-1"
                            >
                                Soft (Tentative)
                            </Button>
                            <Button
                                type="button"
                                variant={type === "HARD" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setType("HARD")}
                                className="flex-1"
                            >
                                Hard (Confirmed)
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-notes">Notes</Label>
                        <Textarea
                            id="edit-notes"
                            placeholder="Optional notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <DialogFooter className="flex-row justify-between">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                disabled={isDeleting || isPending || isConverting}
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                                {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                            {isPlaceholderAllocation && !showReassign && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowReassign(true)}
                                    disabled={isPending || isDeleting}
                                >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Reassign to Person
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending || isDeleting || isConverting}>
                                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                                {isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

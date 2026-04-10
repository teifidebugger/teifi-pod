"use client"

import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { Square, Trash2, Loader2, Pencil } from "lucide-react"
import { stopTimer, deleteTimeEntry, updateTimeEntry } from "@/app/actions/time"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export function StopTimerButton({ entryId }: { entryId: string }) {
    const [pending, startTransition] = useTransition()

    function handleStop() {
        startTransition(async () => {
            try {
                await stopTimer(entryId)
                toast.success("Timer stopped")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to stop timer")
            }
        })
    }

    return (
        <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={handleStop}
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30 h-7 px-2 text-xs gap-1"
        >
            {pending
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Square className="h-3 w-3" />
            }
            Stop
        </Button>
    )
}

export function DeleteEntryButton({ entryId, isLocked }: { entryId: string, isLocked?: boolean }) {
    const [open, setOpen] = useState(false)
    const [pending, startTransition] = useTransition()

    function handleConfirm() {
        startTransition(async () => {
            try {
                await deleteTimeEntry(entryId)
                toast.success("Entry deleted")
                setOpen(false)
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to delete entry")
            }
        })
    }

    return (
        <>
            <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setOpen(true)}
                disabled={isLocked}
                className={`h-7 w-7 text-muted-foreground ${isLocked ? "opacity-30 cursor-not-allowed" : "hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"}`}
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[360px]">
                    <DialogHeader>
                        <DialogTitle>Delete time entry?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        This will permanently remove this time entry. This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={pending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirm}
                            disabled={pending}
                        >
                            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

interface EditEntryButtonProps {
    entryId: string
    entry: {
        description: string | null
        date: string
        durationSeconds: number
        projectId: string
        isBillable: boolean
        isLocked?: boolean
    }
    projects: { id: string; name: string }[]
}

export function EditEntryButton({ entryId, entry, projects }: EditEntryButtonProps) {
    const [open, setOpen] = useState(false)
    const [pending, startTransition] = useTransition()

    const [date, setDate] = useState(entry.date)
    const [durationHours, setDurationHours] = useState((entry.durationSeconds / 3600).toFixed(2))
    const [description, setDescription] = useState(entry.description ?? "")
    const [projectId, setProjectId] = useState(entry.projectId)
    const [isBillable, setIsBillable] = useState(entry.isBillable)

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        startTransition(async () => {
            try {
                await updateTimeEntry(entryId, {
                    description,
                    date,
                    durationHours: parseFloat(durationHours) || 0,
                    projectId,
                    isBillable,
                })
                toast.success("Entry updated")
                setOpen(false)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to update entry")
            }
        })
    }

    return (
        <>
            <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setOpen(true)}
                disabled={entry.isLocked}
                className={`h-7 w-7 text-muted-foreground ${entry.isLocked ? "opacity-30 cursor-not-allowed" : "hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"}`}
            >
                <Pencil className="h-3.5 w-3.5" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Edit Time Entry</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-date">Date</Label>
                                <Input
                                    id="edit-date"
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-duration">Duration (hours)</Label>
                                <Input
                                    id="edit-duration"
                                    type="number"
                                    step="0.25"
                                    min="0.01"
                                    value={durationHours}
                                    onChange={e => setDurationHours(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-description">Description</Label>
                            <Input
                                id="edit-description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="What did you work on?"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-project">Project</Label>
                            <Select value={projectId} onValueChange={setProjectId} required>
                                <SelectTrigger id="edit-project">
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="edit-billable"
                                checked={isBillable}
                                onCheckedChange={v => setIsBillable(!!v)}
                            />
                            <Label htmlFor="edit-billable" className="cursor-pointer">Billable</Label>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={pending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={pending}>
                                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                                Save changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

"use client"

import { useState, useTransition } from "react"
import { createTask, updateTask, deleteTask } from "@/app/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Task {
    id: string
    name: string
    description: string | null
    completed: boolean
    isBillable: boolean
    hourlyRateCents: number | null
}

interface Props {
    projectId: string
    task?: Task
    mode: "create" | "edit"
}

export function TaskActions({ projectId, task, mode }: Props) {
    const [open, setOpen] = useState(false)
    const [pending, startTransition] = useTransition()
    const [deleting, setDeleting] = useState(false)
    const [isBillable, setIsBillable] = useState(task?.isBillable ?? true)

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        formData.set("projectId", projectId)
        if (task) formData.set("id", task.id)
        formData.set("isBillable", isBillable ? "true" : "false")

        startTransition(async () => {
            try {
                if (mode === "create") {
                    await createTask(formData)
                    toast.success("Task created")
                } else {
                    await updateTask(formData)
                    toast.success("Task updated")
                }
                setOpen(false)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to save task")
            }
        })
    }

    async function handleDelete() {
        if (!task) return
        if (!confirm("Delete this task? This cannot be undone.")) return
        setDeleting(true)
        const fd = new FormData()
        fd.set("id", task.id)
        try {
            await deleteTask(fd)
            toast.success("Task deleted")
            setOpen(false)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to delete task")
        } finally {
            setDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button size="sm" variant="outline">
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add Task
                    </Button>
                ) : (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "New Task" : "Edit Task"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Task Name *</Label>
                        <Input id="name" name="name" required defaultValue={task?.name} placeholder="e.g. Design review" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" defaultValue={task?.description ?? ""} placeholder="Optional" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                        <Input
                            id="hourlyRate"
                            name="hourlyRate"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={task?.hourlyRateCents ? (task.hourlyRateCents / 100).toString() : ""}
                            placeholder="Task-specific rate (optional)"
                        />
                        <p className="text-xs text-muted-foreground">Used when project bills by task rates.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="isBillable"
                            checked={isBillable}
                            onCheckedChange={(v) => setIsBillable(!!v)}
                        />
                        <Label htmlFor="isBillable" className="font-normal">Billable</Label>
                    </div>
                    {mode === "edit" && (
                        <div className="flex items-center gap-2">
                            <Checkbox id="completed" name="completed" defaultChecked={task?.completed} />
                            <Label htmlFor="completed" className="font-normal">Mark as completed</Label>
                        </div>
                    )}
                    <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between">
                        {mode === "edit" ? (
                            <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={deleting || pending}>
                                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </Button>
                        ) : <div />}
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending || deleting}>
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={pending || deleting}>
                                {pending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                                {mode === "create" ? "Create" : "Save"}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

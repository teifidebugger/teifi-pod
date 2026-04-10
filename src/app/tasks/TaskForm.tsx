"use client"

import { useState } from "react"
import { createTask, updateTask, deleteTask } from "@/app/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { TeifiTask, TeifiProject, Client } from "@prisma/client"

type ProjectWithClient = TeifiProject & { client: Client | null }

interface TaskFormProps {
    task?: TeifiTask
    projects: ProjectWithClient[]
    mode: "create" | "edit"
    children?: React.ReactNode
    defaultProjectId?: string
}

export function TaskForm({ task, projects, mode, children, defaultProjectId }: TaskFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [projectId, setProjectId] = useState(task?.projectId || defaultProjectId || "")
    const [completed, setCompleted] = useState(task?.completed ?? false)

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        if (task) formData.append("id", task.id)
        formData.set("projectId", projectId)
        if (mode === "edit") formData.set("completed", String(completed))

        try {
            if (mode === "create") {
                await createTask(formData)
                toast.success("Task created")
            } else {
                await updateTask(formData)
                toast.success("Task updated")
            }
            setOpen(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to save task")
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!task) return
        if (!confirm("Are you sure you want to delete this task? Tasks with tracked time cannot be deleted.")) return

        setDeleting(true)
        const formData = new FormData()
        formData.append("id", task.id)

        try {
            await deleteTask(formData)
            toast.success("Task deleted")
            setOpen(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to delete task")
        } finally {
            setDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant={mode === "create" ? "default" : "outline"} size={mode === "create" ? "default" : "sm"} aria-label={mode === "edit" ? "Edit task" : undefined}>
                        {mode === "create" ? (
                            <><Plus className="w-4 h-4 mr-2" /> New Task</>
                        ) : (
                            <Edit className="w-4 h-4" />
                        )}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Create Task" : "Edit Task"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create" ? "Add a new manual task to a project." : "Update task details or mark complete."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Task Name *</Label>
                        <Input id="name" name="name" defaultValue={task?.name} required placeholder="E.g. Homepage Design" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea id="description" name="description" defaultValue={task?.description || ""} placeholder="Add any details..." className="resize-none" rows={3} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="projectId">Project *</Label>
                        <Select value={projectId} onValueChange={setProjectId} required>
                            <SelectTrigger id="projectId">
                                <SelectValue placeholder="Select a project..." />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.client ? `${p.client.name} — ` : "Internal — "} {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {mode === "edit" && (
                        <div className="flex items-center gap-2 pt-2">
                            <Checkbox
                                id="completed"
                                checked={completed}
                                onCheckedChange={(v) => setCompleted(v === true)}
                            />
                            <Label htmlFor="completed" className="font-normal cursor-pointer">Mark as completed</Label>
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
                                Save Task
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

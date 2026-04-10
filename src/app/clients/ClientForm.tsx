"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient, updateClient, deleteClient, archiveClient, unarchiveClient } from "@/app/actions/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Plus, Edit, Trash2, Archive, ArchiveRestore } from "lucide-react"
import { toast } from "sonner"
import { Client } from "@prisma/client"

interface ClientFormProps {
    client?: Client
    mode: "create" | "edit"
    asChild?: boolean
    children?: React.ReactNode
}

export function ClientForm({ client, mode, asChild, children }: ClientFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [archiving, setArchiving] = useState(false)

    const isArchived = !!client?.archivedAt

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        if (client) formData.append("id", client.id)

        try {
            if (mode === "create") {
                await createClient(formData)
                toast.success("Client created")
            } else {
                await updateClient(formData)
                toast.success("Client updated")
            }
            setOpen(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : String(error) || "Failed to save client")
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!client) return
        if (!confirm("Are you sure you want to delete this client?")) return

        setDeleting(true)
        const formData = new FormData()
        formData.append("id", client.id)

        try {
            await deleteClient(formData)
            toast.success("Client deleted")
            setOpen(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : String(error) || "Failed to delete client")
        } finally {
            setDeleting(false)
        }
    }

    async function handleArchive() {
        if (!client) return
        setArchiving(true)
        try {
            if (isArchived) {
                await unarchiveClient(client.id)
                toast.success("Client restored")
            } else {
                await archiveClient(client.id)
                toast.success("Client archived")
            }
            setOpen(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : String(error) || "Failed to archive client")
        } finally {
            setArchiving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant={mode === "create" ? "default" : "outline"} size={mode === "create" ? "default" : "sm"}>
                        {mode === "create" ? (
                            <><Plus className="w-4 h-4 mr-2" /> New Client</>
                        ) : (
                            <><Edit className="w-4 h-4" /></>
                        )}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Create Client" : "Edit Client"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create" ? "Add a new client to your workspace." : "Update client details."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Client Name *</Label>
                        <Input id="name" name="name" defaultValue={client?.name} required placeholder="Acme Corp" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input id="email" name="email" type="email" defaultValue={client?.email || ""} placeholder="billing@acme.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" name="website" type="url" defaultValue={client?.website || ""} placeholder="https://acme.com" />
                    </div>

                    <DialogFooter className="pt-4 flex items-center justify-between sm:justify-between">
                        {mode === "edit" ? (
                            <div className="flex gap-2 mr-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleArchive}
                                    disabled={archiving || loading || deleting}
                                    className="text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950"
                                >
                                    {archiving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : isArchived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                                    {isArchived ? "Restore" : "Archive"}
                                </Button>
                                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={deleting || loading || archiving}>
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                    Delete
                                </Button>
                            </div>
                        ) : <div />}

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading || deleting || archiving}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || deleting || archiving}>
                                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Save Client
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

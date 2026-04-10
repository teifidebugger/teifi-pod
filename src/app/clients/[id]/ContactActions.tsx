"use client"

import { useState, useTransition } from "react"
import { createClientContact, updateClientContact, deleteClientContact } from "@/app/actions/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { ClientContact } from "@prisma/client"

// ─── Add Contact ──────────────────────────────────────────────────────────────

interface AddContactButtonProps {
    clientId: string
}

export function AddContactButton({ clientId }: AddContactButtonProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)

        startTransition(async () => {
            try {
                await createClientContact(clientId, {
                    firstName: fd.get("firstName") as string,
                    lastName: (fd.get("lastName") as string) || undefined,
                    title: (fd.get("title") as string) || undefined,
                    email: (fd.get("email") as string) || undefined,
                    phone: (fd.get("phone") as string) || undefined,
                })
                toast.success("Contact added")
                setOpen(false)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) || "Failed to add contact")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Contact</DialogTitle>
                    <DialogDescription>Add a new contact person for this client.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input id="firstName" name="firstName" required placeholder="Jane" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" name="lastName" placeholder="Smith" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" placeholder="CEO" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="jane@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Add Contact
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Edit Contact ─────────────────────────────────────────────────────────────

interface EditContactButtonProps {
    contact: ClientContact
}

export function EditContactButton({ contact }: EditContactButtonProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)

        startTransition(async () => {
            try {
                await updateClientContact(contact.id, {
                    firstName: fd.get("firstName") as string,
                    lastName: (fd.get("lastName") as string) || undefined,
                    title: (fd.get("title") as string) || undefined,
                    email: (fd.get("email") as string) || undefined,
                    phone: (fd.get("phone") as string) || undefined,
                })
                toast.success("Contact updated")
                setOpen(false)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) || "Failed to update contact")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="sr-only">Edit contact</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Contact</DialogTitle>
                    <DialogDescription>Update contact details.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input id="firstName" name="firstName" required defaultValue={contact.firstName} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" name="lastName" defaultValue={contact.lastName ?? ""} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" defaultValue={contact.title ?? ""} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" defaultValue={contact.email ?? ""} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" type="tel" defaultValue={contact.phone ?? ""} />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Delete Contact ───────────────────────────────────────────────────────────

interface DeleteContactButtonProps {
    contactId: string
}

export function DeleteContactButton({ contactId }: DeleteContactButtonProps) {
    const [isPending, startTransition] = useTransition()

    function handleDelete() {
        startTransition(async () => {
            try {
                await deleteClientContact(contactId)
                toast.success("Contact deleted")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) || "Failed to delete contact")
            }
        })
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="sr-only">Delete contact</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete contact?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. The contact will be permanently removed.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updatePokerSession, deletePokerSession } from "@/app/actions/estimation"

interface SessionActionsProps {
    sessionId: string
    sessionName: string
    description: string | null
    deckType: string
    isOwner: boolean
}

export function SessionActions({
    sessionId,
    sessionName,
    description,
    deckType,
    isOwner,
}: SessionActionsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentDeckType, setCurrentDeckType] = useState(deckType)

    if (!isOwner) return null

    function handleEdit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)
        const name = formData.get("name") as string
        const desc = formData.get("description") as string

        setError(null)
        startTransition(async () => {
            try {
                await updatePokerSession(sessionId, {
                    name,
                    description: desc || undefined,
                    deckType: currentDeckType,
                })
                setEditOpen(false)
                router.refresh()
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to update session")
            }
        })
    }

    function handleDelete() {
        startTransition(async () => {
            try {
                await deletePokerSession(sessionId)
                router.refresh()
            } catch {
                // session already gone or error — refresh anyway
                router.refresh()
            }
        })
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => e.preventDefault()}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Session actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
                    <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => setDeleteOpen(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Edit Session</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name">Session name <span className="text-destructive">*</span></Label>
                            <Input
                                id="edit-name"
                                name="name"
                                defaultValue={sessionName}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-description">
                                Description <span className="text-muted-foreground text-xs">(optional)</span>
                            </Label>
                            <Textarea
                                id="edit-description"
                                name="description"
                                defaultValue={description ?? ""}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-deckType">Deck type</Label>
                            <Select value={currentDeckType} onValueChange={setCurrentDeckType}>
                                <SelectTrigger id="edit-deckType">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fibonacci">Fibonacci (1, 2, 3, 5, 8, 13…)</SelectItem>
                                    <SelectItem value="tshirt">T-Shirt (XS, S, M, L, XL)</SelectItem>
                                    <SelectItem value="powers_of_2">Powers of 2 (1, 2, 4, 8, 16…)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Saving…" : "Save"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete AlertDialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &ldquo;{sessionName}&rdquo; and all its rounds and votes. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

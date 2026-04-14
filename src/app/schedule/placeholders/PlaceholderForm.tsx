"use client"

import { useState, useTransition, useRef, useEffect, type KeyboardEvent } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createPlaceholder, updatePlaceholder, archivePlaceholder, restorePlaceholder, deletePlaceholder } from "@/app/actions/placeholders"
import { convertPlaceholderToMember } from "@/app/actions/roles"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Plus, Pencil, Archive, RotateCcw, Trash2, HelpCircle, MoreHorizontal, UserCheck, X } from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract up to 2 uppercase initials from a placeholder name.
 *  "Frontend Dev 2" → "FD", "QA Engineer" → "QA", "Designer" → "DE"
 */
function placeholderInitials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return "?"
    if (words.length === 1) {
        // Single word: take first two consonant/letters or just first 2 chars
        return words[0].substring(0, 2).toUpperCase()
    }
    // Multi-word: first letter of first two meaningful words (skip numbers)
    const meaningful = words.filter((w) => /[a-zA-Z]/.test(w[0]))
    if (meaningful.length >= 2) {
        return (meaningful[0][0] + meaningful[1][0]).toUpperCase()
    }
    return meaningful[0].substring(0, 2).toUpperCase()
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Placeholder = {
    id: string
    name: string
    roles: string[]
    weeklyCapacityHours: number
    archivedAt: string | null
    allocationCount: number
}

type MemberOption = {
    id: string
    name: string | null
    email: string
}

// ─── TagChipInput ─────────────────────────────────────────────────────────────

function TagChipInput({
    value,
    onChange,
    availableRoles,
    placeholder = "Type and press Enter...",
}: {
    value: string[]
    onChange: (roles: string[]) => void
    availableRoles: string[]
    placeholder?: string
}) {
    const [inputValue, setInputValue] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close suggestions on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    const filteredSuggestions = availableRoles.filter(
        (r) => !value.includes(r) && r.toLowerCase().includes(inputValue.toLowerCase())
    )

    function addTag(tag: string) {
        const canonical = availableRoles.find((r) => r.toLowerCase() === tag.trim().toLowerCase())
        if (canonical && !value.includes(canonical)) {
            onChange([...value, canonical])
        }
        setInputValue("")
        setShowSuggestions(false)
        inputRef.current?.focus()
    }

    function removeTag(tag: string) {
        onChange(value.filter((v) => v !== tag))
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
            e.preventDefault()
            const exact = availableRoles.find((r) => r.toLowerCase() === inputValue.trim().toLowerCase())
            if (exact) {
                addTag(exact)
            } else if (filteredSuggestions.length === 1) {
                addTag(filteredSuggestions[0])
            }
        }
        if (e.key === "Backspace" && !inputValue && value.length > 0) {
            removeTag(value[value.length - 1])
        }
    }

    return (
        <div ref={containerRef} className="relative">
            <div
                className="flex flex-wrap gap-1.5 min-h-[40px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                onClick={() => inputRef.current?.focus()}
            >
                {value.map((tag) => (
                    <Badge
                        key={tag}
                        variant="outline"
                        className="border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 gap-1 h-6"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                removeTag(tag)
                            }}
                            className="ml-0.5 hover:text-amber-900 dark:hover:text-amber-100"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value)
                        setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ""}
                />
            </div>
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md max-h-40 overflow-y-auto">
                    {filteredSuggestions.map((role) => (
                        <button
                            key={role}
                            type="button"
                            className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                            onMouseDown={(e) => {
                                e.preventDefault()
                                addTag(role)
                            }}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── PlaceholderCard ──────────────────────────────────────────────────────────

function PlaceholderCard({
    placeholder,
    onEdit,
    availableRoles,
    members,
}: {
    placeholder: Placeholder
    onEdit: (p: Placeholder) => void
    availableRoles: string[]
    members: MemberOption[]
}) {
    const [isArchiving, startArchiveTransition] = useTransition()
    const [isRestoring, startRestoreTransition] = useTransition()
    const [isDeleting, startDeleteTransition] = useTransition()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [selectedMemberId, setSelectedMemberId] = useState("")
    const [isConverting, startConvertTransition] = useTransition()
    const isArchived = !!placeholder.archivedAt

    function handleArchive() {
        startArchiveTransition(async () => {
            try {
                await archivePlaceholder(placeholder.id)
                toast.success("Placeholder archived")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to archive")
            }
        })
    }

    function handleRestore() {
        startRestoreTransition(async () => {
            try {
                await restorePlaceholder(placeholder.id)
                toast.success("Placeholder restored")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to restore")
            }
        })
    }

    function handleDelete() {
        startDeleteTransition(async () => {
            try {
                await deletePlaceholder(placeholder.id)
                toast.success("Placeholder deleted")
                setDeleteDialogOpen(false)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to delete")
            }
        })
    }

    function handleConvert() {
        if (!selectedMemberId) {
            toast.error("Please select a team member")
            return
        }
        startConvertTransition(async () => {
            try {
                await convertPlaceholderToMember(placeholder.id, selectedMemberId)
                const member = members.find((m) => m.id === selectedMemberId)
                toast.success(`Placeholder converted to ${member?.name ?? member?.email ?? "member"}`)
                setAssignDialogOpen(false)
                setSelectedMemberId("")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to convert Placeholder")
            }
        })
    }

    return (
        <>
            <Card className={isArchived ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-amber-400 flex-shrink-0">
                                <AvatarFallback className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold tracking-wide">
                                    {placeholderInitials(placeholder.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">{placeholder.name}</CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {placeholder.weeklyCapacityHours}h/wk · {placeholder.allocationCount} allocation{placeholder.allocationCount !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                        {isArchived && (
                            <Badge variant="secondary" className="text-xs">Archived</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    {placeholder.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {placeholder.roles.map((role, i) => (
                                <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                >
                                    {role}
                                </Badge>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        {!isArchived && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(placeholder)}
                                >
                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAssignDialogOpen(true)}
                                >
                                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                                    Assign to Person
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="px-2">
                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(placeholder)}>
                                            <Pencil className="h-3.5 w-3.5 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleArchive} disabled={isArchiving}>
                                            <Archive className="h-3.5 w-3.5 mr-2" />
                                            {isArchiving ? "Archiving..." : "Archive"}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => setDeleteDialogOpen(true)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )}
                        {isArchived && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRestore}
                                    disabled={isRestoring}
                                >
                                    {isRestoring ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 mr-1" />}
                                    {isRestoring ? "Restoring..." : "Restore"}
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteDialogOpen(true)}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Delete confirmation AlertDialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete placeholder?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete {placeholder.name} and remove all {placeholder.allocationCount} of their scheduled allocations. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Assign to Person Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={(open) => {
                setAssignDialogOpen(open)
                if (!open) setSelectedMemberId("")
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign {placeholder.name} to a team member</DialogTitle>
                        <DialogDescription>
                            All {placeholder.allocationCount} scheduled allocation{placeholder.allocationCount !== 1 ? "s" : ""} will be reassigned to this person.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Team Member</Label>
                            <Select value={selectedMemberId || "__none__"} onValueChange={(v) => setSelectedMemberId(v === "__none__" ? "" : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__" disabled>Select a team member</SelectItem>
                                    {members.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name ?? m.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConvert} disabled={isConverting || !selectedMemberId}>
                            {isConverting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                            {isConverting ? "Assigning..." : "Assign"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// ─── PlaceholderFormDialog ────────────────────────────────────────────────────

type PlaceholderFormDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingPlaceholder?: Placeholder | null
    availableRoles: string[]
}

function PlaceholderFormDialog({ open, onOpenChange, editingPlaceholder, availableRoles }: PlaceholderFormDialogProps) {
    const [isPending, startTransition] = useTransition()
    const [name, setName] = useState(editingPlaceholder?.name ?? "")
    const [roles, setRoles] = useState<string[]>(editingPlaceholder?.roles ?? [])
    const [capacity, setCapacity] = useState(String(editingPlaceholder?.weeklyCapacityHours ?? 40))

    const isEditing = !!editingPlaceholder

    // Reset form when dialog opens with new data
    useEffect(() => {
        if (open) {
            setName(editingPlaceholder?.name ?? "")
            setRoles(editingPlaceholder?.roles ?? [])
            setCapacity(String(editingPlaceholder?.weeklyCapacityHours ?? 40))
        }
    }, [open, editingPlaceholder])

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) {
            toast.error("Name is required")
            return
        }

        const weeklyCapacityHours = parseFloat(capacity) || 40

        startTransition(async () => {
            try {
                if (isEditing) {
                    await updatePlaceholder(editingPlaceholder.id, { name: name.trim(), roles, weeklyCapacityHours })
                    toast.success("Placeholder updated")
                } else {
                    await createPlaceholder({ name: name.trim(), roles, weeklyCapacityHours })
                    toast.success("Placeholder created")
                }
                onOpenChange(false)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to save placeholder")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Placeholder" : "Add Placeholder"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ph-name">Name *</Label>
                        <Input
                            id="ph-name"
                            placeholder='e.g. "Backend Dev 2", "Design Lead"'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Guilds</Label>
                        <TagChipInput
                            value={roles}
                            onChange={setRoles}
                            availableRoles={availableRoles}
                            placeholder='Type a guild and press Enter...'
                        />
                        <p className="text-xs text-muted-foreground">
                            Skill tags to help identify what kind of person this slot needs.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ph-capacity">Weekly Capacity (hours)</Label>
                        <Input
                            id="ph-capacity"
                            type="number"
                            min="0.5"
                            max="168"
                            step="0.5"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                            {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Member"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── PlaceholderList (main export) ────────────────────────────────────────────

type PlaceholderListProps = {
    placeholders: Placeholder[]
    availableRoles: string[]
    members: MemberOption[]
}

export function PlaceholderList({ placeholders, availableRoles, members }: PlaceholderListProps) {
    const [formOpen, setFormOpen] = useState(false)
    const [editingPlaceholder, setEditingPlaceholder] = useState<Placeholder | null>(null)
    const [showArchived, setShowArchived] = useState(false)

    const active = placeholders.filter((p) => !p.archivedAt)
    const archived = placeholders.filter((p) => !!p.archivedAt)
    const displayed = showArchived ? [...active, ...archived] : active

    function handleEdit(p: Placeholder) {
        setEditingPlaceholder(p)
        setFormOpen(true)
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button onClick={() => { setEditingPlaceholder(null); setFormOpen(true) }}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Placeholder
                    </Button>
                    {archived.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowArchived(!showArchived)}
                        >
                            <Archive className="h-3.5 w-3.5 mr-1" />
                            {showArchived ? "Hide archived" : `View archived (${archived.length})`}
                        </Button>
                    )}
                </div>
            </div>

            {displayed.length === 0 ? (
                <div className="rounded-xl border border-sidebar-border bg-sidebar/30 p-12 text-center">
                    <HelpCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Placeholders yet</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
                        Placeholders are unfilled team member slots (e.g. &quot;Backend Dev 2&quot; or &quot;Design Lead&quot;) — schedule capacity before the real person is hired or assigned.
                    </p>
                    <Button onClick={() => { setEditingPlaceholder(null); setFormOpen(true) }}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Placeholder
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayed.map((p) => (
                        <PlaceholderCard
                            key={p.id}
                            placeholder={p}
                            onEdit={handleEdit}
                            availableRoles={availableRoles}
                            members={members}
                        />
                    ))}
                </div>
            )}

            <PlaceholderFormDialog
                open={formOpen}
                onOpenChange={(open) => {
                    setFormOpen(open)
                    if (!open) setEditingPlaceholder(null)
                }}
                editingPlaceholder={editingPlaceholder}
                availableRoles={availableRoles}
            />
        </>
    )
}

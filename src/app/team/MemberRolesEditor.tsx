"use client"

import { useState, useTransition, useRef, useEffect, type KeyboardEvent } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { updateMemberRoles } from "@/app/actions/roles"
import { toast } from "sonner"
import { Loader2, Pencil, X } from "lucide-react"

// ─── TagChipInput (shared pattern) ───────────────────────────────────────────

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
                    placeholder={value.length === 0 ? (availableRoles.length === 0 ? "No guilds in catalog yet" : placeholder) : ""}
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

// ─── MemberRolesEditor ───────────────────────────────────────────────────────

export function MemberRolesEditor({
    memberId,
    currentRoles,
    availableRoles,
}: {
    memberId: string
    currentRoles: string[]
    availableRoles: string[]
}) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [roles, setRoles] = useState<string[]>(currentRoles)
    const [isSaving, startTransition] = useTransition()

    function handleOpen() {
        setRoles(currentRoles)
        setDialogOpen(true)
    }

    function handleSave() {
        startTransition(async () => {
            try {
                await updateMemberRoles(memberId, roles)
                toast.success("Guilds updated")
                setDialogOpen(false)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to update guilds")
            }
        })
    }

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleOpen}
            >
                <Pencil className="h-3 w-3 mr-1" />
                Edit guilds
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Member Guilds</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <TagChipInput
                            value={roles}
                            onChange={setRoles}
                            availableRoles={availableRoles}
                            placeholder="Type a guild and press Enter..."
                        />
                        <p className="text-xs text-muted-foreground">
                            Select from the workspace guild catalog. Manage guilds at{" "}
                            <a href="/schedule/roles" className="underline hover:text-foreground">Schedule &rsaquo; Guilds</a>.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// ─── MemberRolesBadges (display only) ────────────────────────────────────────

export function MemberRolesBadges({ roles }: { roles: string[] }) {
    if (roles.length === 0) return null
    return (
        <span className="flex flex-wrap gap-1 mt-0.5">
            {roles.map((role) => (
                <Badge
                    key={role}
                    variant="outline"
                    className="text-[10px] h-4 px-1.5 border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                >
                    {role}
                </Badge>
            ))}
        </span>
    )
}

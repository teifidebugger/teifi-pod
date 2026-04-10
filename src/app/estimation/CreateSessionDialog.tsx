"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Plus, Check, ChevronsUpDown, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { createPokerSession } from "@/app/actions/estimation"

const DECK_HINTS: Record<string, string> = {
    fibonacci: "Classic: 1, 2, 3, 5, 8, 13, 21 — good for most teams",
    tshirt: "T-shirt sizing: XS, S, M, L, XL — great for relative sizing",
    powers_of_2: "Powers of two: 1, 2, 4, 8, 16, 32 — for technical teams",
}

interface Project {
    id: string
    name: string
    code: string | null
}

interface CreateSessionDialogProps {
    projects?: Project[]
    defaultProjectId?: string
    defaultProjectName?: string
}

export function CreateSessionDialog({
    projects = [],
    defaultProjectId,
    defaultProjectName,
}: CreateSessionDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [deckType, setDeckType] = useState("fibonacci")
    const [error, setError] = useState<string | null>(null)
    const [projectPickerOpen, setProjectPickerOpen] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId ?? "")
    const [sessionName, setSessionName] = useState(defaultProjectName ?? "")

    const selectedProject = projects.find((p) => p.id === selectedProjectId)

    function handleProjectSelect(projectId: string) {
        const project = projects.find((p) => p.id === projectId)
        setSelectedProjectId(projectId)
        if (project && !sessionName) setSessionName(project.name)
        setProjectPickerOpen(false)
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)
        formData.set("deckType", deckType)
        if (selectedProjectId) formData.set("projectId", selectedProjectId)

        setError(null)
        startTransition(async () => {
            try {
                const result = await createPokerSession(formData)
                setOpen(false)
                router.push(`/estimation/${result.id}`)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to create session")
            }
        })
    }

    function handleOpenChange(v: boolean) {
        setOpen(v)
        if (!v) {
            setError(null)
            setSelectedProjectId(defaultProjectId ?? "")
            setSessionName(defaultProjectName ?? "")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    New Session
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Estimation Session</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Project picker */}
                    {projects.length > 0 && (
                        <div className="space-y-1.5">
                            <Label>Project <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <Popover open={projectPickerOpen} onOpenChange={setProjectPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between font-normal"
                                    >
                                        {selectedProject ? (
                                            <span className="flex items-center gap-1.5 truncate">
                                                <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                {selectedProject.code && (
                                                    <span className="text-muted-foreground">[{selectedProject.code}]</span>
                                                )}
                                                {selectedProject.name}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">Select a project…</span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search projects…" />
                                        <CommandList>
                                            <CommandEmpty>No projects found.</CommandEmpty>
                                            <CommandGroup>
                                                {selectedProjectId && (
                                                    <CommandItem
                                                        value="__none__"
                                                        onSelect={() => {
                                                            setSelectedProjectId("")
                                                            setProjectPickerOpen(false)
                                                        }}
                                                        className="text-muted-foreground"
                                                    >
                                                        Clear selection
                                                    </CommandItem>
                                                )}
                                                {projects.map((p) => (
                                                    <CommandItem
                                                        key={p.id}
                                                        value={`${p.code ?? ""} ${p.name}`}
                                                        onSelect={() => handleProjectSelect(p.id)}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedProjectId === p.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {p.code && (
                                                            <span className="mr-1.5 text-xs text-muted-foreground">[{p.code}]</span>
                                                        )}
                                                        {p.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="name">Session name <span className="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. Sprint 42 Planning"
                            required
                            autoFocus
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="What are we estimating?"
                            rows={3}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="deckType">Deck type</Label>
                        <Select value={deckType} onValueChange={setDeckType}>
                            <SelectTrigger id="deckType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="fibonacci">Fibonacci (1, 2, 3, 5, 8, 13…)</SelectItem>
                                <SelectItem value="tshirt">T-Shirt (XS, S, M, L, XL)</SelectItem>
                                <SelectItem value="powers_of_2">Powers of 2 (1, 2, 4, 8, 16…)</SelectItem>
                            </SelectContent>
                        </Select>
                        {DECK_HINTS[deckType] && (
                            <p className="text-xs text-muted-foreground mt-1">{DECK_HINTS[deckType]}</p>
                        )}
                    </div>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Creating…" : "Create Session"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

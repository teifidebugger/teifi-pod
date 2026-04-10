"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { UserMinus, UserPlus, Pencil, Check, X } from "lucide-react"
import {
    assignMemberToProject,
    removeMemberFromProject,
    updateProjectMemberRate,
} from "@/app/actions/projects"
import { toast } from "sonner"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface UnassignedMember {
    id: string
    name: string | null
    email: string
    role: string
}

export interface AssignedMember {
    id: string // ProjectMember.id
    memberId: string // WorkspaceMember.id
    name: string | null
    email: string
    role: string
    billableRateCents: number | null
}

// ─── AssignMemberForm ───────────────────────────────────────────────────────

export function AssignMemberForm({
    projectId,
    unassigned,
}: {
    projectId: string
    unassigned: UnassignedMember[]
}) {
    const [selectedMemberId, setSelectedMemberId] = useState<string>("")
    const [rateInput, setRateInput] = useState("")
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    async function handleAssign() {
        if (!selectedMemberId) return
        setError(null)
        const rateCents =
            rateInput.trim() !== ""
                ? Math.round(parseFloat(rateInput) * 100)
                : null

        startTransition(async () => {
            try {
                await assignMemberToProject(projectId, selectedMemberId, rateCents)
                setSelectedMemberId("")
                setRateInput("")
                toast.success("Member assigned to project")
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to assign member")
            }
        })
    }

    if (unassigned.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                All workspace members are already assigned to this project.
            </p>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                    <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a member..." />
                        </SelectTrigger>
                        <SelectContent>
                            {unassigned.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    {m.name ?? m.email}{" "}
                                    <span className="text-muted-foreground text-xs">
                                        ({m.role})
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-36">
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Rate ($/hr)"
                        value={rateInput}
                        onChange={(e) => setRateInput(e.target.value)}
                    />
                </div>
                <Button
                    onClick={handleAssign}
                    disabled={!selectedMemberId || isPending}
                    size="default"
                    className="shrink-0"
                >
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Assign
                </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    )
}

// ─── RemoveMemberButton ─────────────────────────────────────────────────────

export function RemoveMemberButton({
    projectId,
    memberId,
    memberName,
}: {
    projectId: string
    memberId: string
    memberName: string
}) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleRemove() {
        setError(null)
        startTransition(async () => {
            try {
                await removeMemberFromProject(projectId, memberId)
                toast.success(`${memberName} removed from project`)
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to remove member")
            }
        })
    }

    return (
        <div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" disabled={isPending}>
                        <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove member from project?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove <strong>{memberName}</strong> from this project. They
                            will no longer see it in their timer. Existing time entries are
                            not affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </div>
    )
}

// ─── RateOverrideInput ──────────────────────────────────────────────────────

export function RateOverrideInput({
    projectId,
    memberId,
    currentRateCents,
}: {
    projectId: string
    memberId: string
    currentRateCents: number | null
}) {
    const [editing, setEditing] = useState(false)
    const [value, setValue] = useState(
        currentRateCents !== null ? (currentRateCents / 100).toFixed(2) : ""
    )
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleSave() {
        setError(null)
        const rateCents =
            value.trim() !== "" ? Math.round(parseFloat(value) * 100) : null

        startTransition(async () => {
            try {
                await updateProjectMemberRate(projectId, memberId, rateCents)
                toast.success("Rate updated")
                setEditing(false)
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to update rate")
            }
        })
    }

    function handleCancel() {
        setValue(currentRateCents !== null ? (currentRateCents / 100).toFixed(2) : "")
        setEditing(false)
        setError(null)
    }

    if (!editing) {
        return (
            <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground group"
                title="Click to edit rate"
            >
                {currentRateCents !== null
                    ? `$${(currentRateCents / 100).toFixed(2)}/hr`
                    : "Default rate"}
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
        )
    }

    return (
        <div className="flex items-center gap-1.5">
            <div className="relative">
                <Label className="sr-only">Billable rate</Label>
                <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Rate ($/hr)"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="h-7 w-28 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave()
                        if (e.key === "Escape") handleCancel()
                    }}
                />
            </div>
            <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                onClick={handleSave}
                disabled={isPending}
            >
                <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={handleCancel}
                disabled={isPending}
            >
                <X className="h-3.5 w-3.5" />
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    )
}

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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Pencil, Loader2, RefreshCw, BanIcon, RotateCcw, ChevronsUpDown, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { changeRole, removeMember } from "@/app/actions/team"
import { setMemberManager, updateMemberProfile, updateMemberRates, syncMembersFromLinear, setMemberDisabled } from "@/app/actions/team"
import { toast } from "sonner"

const ROLES = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "CONTRACTOR"] as const

export function MemberRoleSelect({ memberId, currentRole, isOwner, callerRole }: {
    memberId: string
    currentRole: string
    isOwner: boolean
    callerRole: string
}) {
    const [isPending, startTransition] = useTransition()
    const [pendingRole, setPendingRole] = useState<string | null>(null)
    const [displayRole, setDisplayRole] = useState(currentRole)

    function handleChange(newRole: string) {
        if (newRole === displayRole) return
        setPendingRole(newRole)
    }

    function handleConfirm() {
        if (!pendingRole) return
        const role = pendingRole
        setPendingRole(null)
        startTransition(async () => {
            try {
                await changeRole(memberId, role)
                setDisplayRole(role)
                toast.success(`Role updated to ${role.charAt(0) + role.slice(1).toLowerCase()}`)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to update role")
            }
        })
    }

    const availableRoles = callerRole === "OWNER" ? ROLES : ROLES.filter(r => r !== "OWNER")
    const label = (r: string) => r.charAt(0) + r.slice(1).toLowerCase()

    return (
        <>
            <Select value={displayRole} onValueChange={handleChange} disabled={isPending || isOwner}>
                <SelectTrigger className="h-8 text-xs w-36">
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}
                </SelectTrigger>
                <SelectContent>
                    {availableRoles.map((role) => (
                        <SelectItem key={role} value={role} className="text-xs">
                            {label(role)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <AlertDialog open={!!pendingRole} onOpenChange={open => { if (!open) setPendingRole(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Change role to {pendingRole ? label(pendingRole) : ""}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will change the member's role from{" "}
                            <span className="font-medium text-foreground">{label(displayRole)}</span> to{" "}
                            <span className="font-medium text-foreground">{pendingRole ? label(pendingRole) : ""}</span>.
                            This affects their access level immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export function ManagerSelect({ memberId, currentManagerId, members }: {
    memberId: string
    currentManagerId: string | null
    members: Array<{ id: string; name: string }>
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const options = members.filter(m => m.id !== memberId)
    const currentName = options.find(m => m.id === currentManagerId)?.name

    function handleSelect(value: string) {
        setOpen(false)
        const newManagerId = value === "__none__" ? null : value
        if (newManagerId === currentManagerId) return
        startTransition(async () => {
            try {
                await setMemberManager(memberId, newManagerId)
                toast.success(newManagerId ? "Manager assigned" : "Manager removed")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to set manager")
            }
        })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full justify-between text-xs font-normal"
                    disabled={isPending}
                >
                    <span className="truncate text-left">
                        {isPending ? "Saving…" : currentName ?? <span className="text-muted-foreground">— No manager —</span>}
                    </span>
                    {isPending
                        ? <Loader2 className="h-3 w-3 animate-spin shrink-0 ml-1" />
                        : <ChevronsUpDown className="h-3 w-3 shrink-0 ml-1 text-muted-foreground" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-56" align="start">
                <Command>
                    <CommandInput placeholder="Search member…" className="h-8 text-xs" />
                    <CommandList>
                        <CommandEmpty>No members found.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem value="__none__" onSelect={() => handleSelect("__none__")} className="text-xs text-muted-foreground">
                                <Check className={`h-3 w-3 mr-2 ${!currentManagerId ? "opacity-100" : "opacity-0"}`} />
                                — No manager —
                            </CommandItem>
                            {options.map(m => (
                                <CommandItem key={m.id} value={m.name} onSelect={() => handleSelect(m.id)} className="text-xs">
                                    <Check className={`h-3 w-3 mr-2 ${currentManagerId === m.id ? "opacity-100" : "opacity-0"}`} />
                                    {m.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

const displayRate = (cents: number) => (cents / 100).toFixed(2)
const parseCents = (val: string) => Math.round(parseFloat(val || "0") * 100)

export function EditProfileButton({ memberId, title, teamName, weeklyCapacityHours, defaultBillableCents, costRateCents }: {
    memberId: string
    title: string | null
    teamName: string | null
    weeklyCapacityHours: number
    defaultBillableCents: number
    costRateCents: number
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
            try {
                await updateMemberProfile(memberId, {
                    title: (fd.get("title") as string) || undefined,
                    teamName: (fd.get("teamName") as string) || undefined,
                })
                await updateMemberRates(memberId, {
                    weeklyCapacityHours: parseFloat((fd.get("weeklyCapacityHours") as string) || "40") || 40,
                    defaultBillableCents: parseCents(fd.get("defaultBillableCents") as string),
                    costRateCents: parseCents(fd.get("costRateCents") as string),
                })
                toast.success("Profile updated")
                setOpen(false)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to update profile")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="title">Job Title</Label>
                        <Input id="title" name="title" defaultValue={title ?? ""} placeholder="e.g. Senior Engineer" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="teamName">Team</Label>
                        <Input id="teamName" name="teamName" defaultValue={teamName ?? ""} placeholder="e.g. Engineering" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="weeklyCapacityHours">Weekly Capacity (hours)</Label>
                        <Input id="weeklyCapacityHours" name="weeklyCapacityHours" type="number" min="0.5" max="168" step="0.5" defaultValue={weeklyCapacityHours} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="defaultBillableCents">Default Billable Rate ($/hr)</Label>
                        <Input id="defaultBillableCents" name="defaultBillableCents" type="number" min="0" step="0.01" defaultValue={displayRate(defaultBillableCents)} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="costRateCents">Cost Rate — internal ($/hr)</Label>
                        <Input id="costRateCents" name="costRateCents" type="number" min="0" step="0.01" defaultValue={displayRate(costRateCents)} placeholder="0.00" />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={isPending}>
                            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function ManagerPermissions({ memberId, role, canManageProjects, canEditOthersTime, canSeeRates, canEditClients, canWithdrawApprovals }: {
    memberId: string
    role: string
    canManageProjects: boolean
    canEditOthersTime: boolean
    canSeeRates: boolean
    canEditClients: boolean
    canWithdrawApprovals: boolean
}) {
    if (role !== "MANAGER") return null

    const granted = [canManageProjects, canEditOthersTime, canSeeRates, canEditClients, canWithdrawApprovals].filter(Boolean).length

    return (
        <a
            href={`/team/${memberId}/profile?tab=permissions`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0 group"
        >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-semibold group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                {granted}
            </span>
            <span>/ 5 permissions</span>
        </a>
    )
}

export function RemoveMemberButton({ memberId }: { memberId: string }) {
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    function handleRemove() {
        startTransition(async () => {
            try {
                await removeMember(memberId)
                toast.success("Member removed from workspace")
                setOpen(false)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to remove member")
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={isPending}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove member?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove the member from the workspace. They will lose access to all projects and data.
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
    )
}

export function SyncFromLinearButton() {
    const [isPending, startTransition] = useTransition()

    function handleSync() {
        startTransition(async () => {
            try {
                const result = await syncMembersFromLinear()
                toast.success(`Synced: ${result.matched} of ${result.total} Linear members matched`)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Sync failed")
            }
        })
    }

    return (
        <Button variant="outline" size="sm" onClick={handleSync} disabled={isPending}>
            {isPending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <RefreshCw className="mr-2 h-4 w-4" />
            }
            Sync from Linear
        </Button>
    )
}

export function DisableMemberButton({ memberId, isDisabled }: { memberId: string; isDisabled: boolean }) {
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    function handleToggle() {
        startTransition(async () => {
            try {
                await setMemberDisabled(memberId, !isDisabled)
                toast.success(isDisabled ? "Member re-enabled" : "Member disabled")
                setOpen(false)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to update member status")
            }
        })
    }

    if (isDisabled) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-green-600"
                disabled={isPending}
                onClick={handleToggle}
                title="Re-enable member"
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            </Button>
        )
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-600" disabled={isPending} title="Disable member">
                    <BanIcon className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Disable member?</AlertDialogTitle>
                    <AlertDialogDescription>
                        The member will lose access but their historical data (time entries, allocations) will be retained. You can re-enable them at any time.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleToggle} className="bg-amber-600 text-white hover:bg-amber-700">
                        Disable
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

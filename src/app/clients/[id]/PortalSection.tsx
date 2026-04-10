"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    linkClientToLinearTeam,
    unlinkClientFromLinearTeam,
    deactivatePortalProfile,
    reactivatePortalProfile,
    updatePortalUserName,
    createPortalProfile,
    findUserByEmail,
    getLinearLabelsForTeam,
    updateTeamUatLabel,
    getLinearProjectsForTeam,
    updateTeamUatProject,
    updateTeamModuleLabels,
    createPortalUserWithPassword,
    getLinearWorkflowStatesWithMappings,
    saveUATStateMappings,
    resetUATStateMappings,
    createModuleLabel,
    updateModuleLabel,
    deleteModuleLabel,
    getTeamTransitions,
    updateTeamAllowedTransitions,
    updateTeamStaffTransitions,
    type LinearLabelNode,
    type LinearProject,
    type WorkflowStateWithMapping,
} from "@/app/actions/portal-admin"
import { invitePortalUser } from "@/app/actions/portal-invite"
import {
    createAnnouncement,
    toggleAnnouncement,
    deleteAnnouncement,
    type AnnouncementInput,
} from "@/app/actions/portal-announcements"
import { toast } from "sonner"
import {
    Loader2, Plus, X, Link2, Users, ExternalLink,
    Mail, Megaphone, Check, AlertTriangle, Info, Trash2, Eye, EyeOff, Tag, FolderOpen, UserPlus,
    ChevronDown, ChevronRight, LayoutDashboard, Pencil, Save, RotateCcw,
    ArrowRightLeft, ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    UAT_COLUMNS,
    mapStateToUATColumn,
    DEFAULT_CLIENT_TRANSITIONS,
    DEFAULT_STAFF_TRANSITIONS,
    CLIENT_FROM_COLUMNS,
    CLIENT_TO_COLUMNS,
    STAFF_FROM_COLUMNS,
    STAFF_TO_COLUMNS,
    type AllowedTransitions,
    type UATColumn,
} from "@/lib/uat-mapping"
import { TransitionRulesMatrix } from "@/components/portal/TransitionRulesMatrix"
import { Badge } from "@/components/ui/badge"


export type PortalTeam = { id: string; name: string; key: string }
export type PortalUser = {
    id: string
    isActive: boolean
    user: { id: string; name: string | null; email: string; image: string | null }
}
export type PortalAnnouncementRow = {
    id: string
    type: string
    title: string
    body: string | null
    buildId: string | null
    isActive: boolean
    expiresAt: Date | null
    createdAt: Date
}

interface PortalSectionProps {
    clientId: string
    linkedTeams: PortalTeam[]
    allWorkspaceTeams: PortalTeam[]
    portalUsers: PortalUser[]
    announcements: PortalAnnouncementRow[]
    teamSettings: Array<{
        linearTeamId: string
        uatLabelIds: string[]
        uatProjectIds: string[]
        portalModuleLabelIds: string[]
    }>
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({
    label,
    count,
    action,
}: {
    label: string
    count?: number
    action?: React.ReactNode
}) {
    return (
        <div className="flex items-center justify-between py-2 px-0">
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground/70 select-none">
                    {label}
                </span>
                {count !== undefined && (
                    <span className="text-[11px] font-medium text-muted-foreground/50 tabular-nums">
                        {count}
                    </span>
                )}
            </div>
            {action}
        </div>
    )
}

// ─── Setting Row ───────────────────────────────────────────────────────────────

function SettingRow({
    icon: Icon,
    label,
    hint,
    right,
    className,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    hint?: string
    right: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("flex items-center justify-between gap-3 py-2.5 px-3", className)}>
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center justify-center h-6 w-6 rounded-md bg-muted/60 shrink-0">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                    <span className="text-sm text-foreground leading-none">{label}</span>
                    {hint && (
                        <p className="text-xs text-muted-foreground/60 italic mt-0.5 leading-none">{hint}</p>
                    )}
                </div>
            </div>
            <div className="shrink-0 flex items-center gap-1">
                {right}
            </div>
        </div>
    )
}

// ─── Link Team Button ──────────────────────────────────────────────────────────

function LinkTeamButton({ clientId, allTeams, linkedTeamIds }: {
    clientId: string
    allTeams: PortalTeam[]
    linkedTeamIds: string[]
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const available = allTeams.filter(t => !linkedTeamIds.includes(t.id))

    function handleSelect(teamId: string) {
        setOpen(false)
        startTransition(async () => {
            try {
                await linkClientToLinearTeam(clientId, teamId)
                toast.success("Team linked to Client UAT Portal")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to link team")
            }
        })
    }

    if (available.length === 0) return null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isPending} className="h-7 text-xs gap-1.5 px-2.5 text-muted-foreground hover:text-foreground">
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    Link Team
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-56" align="end">
                <Command>
                    <CommandInput placeholder="Search teams…" className="h-8 text-xs" />
                    <CommandList>
                        <CommandEmpty>No teams available.</CommandEmpty>
                        <CommandGroup>
                            {available.map(team => (
                                <CommandItem key={team.id} value={team.name} onSelect={() => handleSelect(team.id)} className="text-xs">
                                    <span className="font-mono text-muted-foreground mr-2">{team.key}</span>
                                    {team.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// ─── Unlink Team Button ────────────────────────────────────────────────────────

function UnlinkTeamButton({ clientId, teamId, teamName }: { clientId: string; teamId: string; teamName: string }) {
    const [isPending, startTransition] = useTransition()

    return (
        <button
            onClick={() => startTransition(async () => {
                try {
                    await unlinkClientFromLinearTeam(clientId, teamId)
                    toast.success(`${teamName} unlinked`)
                } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to unlink team")
                }
            })}
            disabled={isPending}
            className="text-muted-foreground/40 hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10"
            title="Unlink team"
        >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        </button>
    )
}

// ─── Add Existing User ─────────────────────────────────────────────────────────

function AddExistingUserButton({ clientId }: { clientId: string }) {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState("")
    const [found, setFound] = useState<{ id: string; name: string | null; email: string } | null>(null)
    const [notFound, setNotFound] = useState(false)
    const [isPending, startTransition] = useTransition()

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        if (!email.trim()) return
        setFound(null)
        setNotFound(false)
        startTransition(async () => {
            try {
                const user = await findUserByEmail(email.trim())
                if (user) {
                    setFound(user)
                } else {
                    setNotFound(true)
                }
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Search failed")
            }
        })
    }

    function handleGrant() {
        if (!found) return
        startTransition(async () => {
            try {
                await createPortalProfile(found.id, clientId)
                toast.success(`Client UAT Portal access granted to ${found.name ?? found.email}`)
                handleClose()
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to grant access")
            }
        })
    }

    function handleClose() {
        setOpen(false)
        setEmail("")
        setFound(null)
        setNotFound(false)
    }

    return (
        <>
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setOpen(true)}>
                            <Plus className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">Add existing user</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Existing User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-1">
                        <p className="text-sm text-muted-foreground">
                            Grant Client UAT Portal access to a user who already has a Teifi account.
                        </p>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setFound(null); setNotFound(false) }}
                                required
                                autoFocus
                            />
                            <Button type="submit" variant="outline" size="sm" disabled={isPending}>
                                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
                            </Button>
                        </form>

                        {found && (
                            <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                                <div>
                                    <p className="text-sm font-medium">{found.name ?? found.email}</p>
                                    <p className="text-xs text-muted-foreground">{found.email}</p>
                                </div>
                                <Button size="sm" onClick={handleGrant} disabled={isPending}>
                                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                                    Grant Access
                                </Button>
                            </div>
                        )}

                        {notFound && (
                            <p className="text-sm text-muted-foreground/70 text-center">
                                No user found with that email. Use <span className="font-medium text-foreground">Invite User</span> to send them an invite link instead.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={handleClose}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// ─── Invite User ───────────────────────────────────────────────────────────────

function InviteUserButton({ clientId }: { clientId: string }) {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState("")
    const [isPending, startTransition] = useTransition()
    const [inviteLink, setInviteLink] = useState<string | null>(null)

    function handleInvite(e: React.FormEvent) {
        e.preventDefault()
        if (!email.trim()) return
        startTransition(async () => {
            try {
                const { token } = await invitePortalUser(email.trim(), clientId)
                const link = `${window.location.origin}/invite/portal/${token}`
                setInviteLink(link)
                toast.success("Invite created")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to create invite")
            }
        })
    }

    function handleClose() {
        setOpen(false)
        setEmail("")
        setInviteLink(null)
    }

    return (
        <>
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setOpen(true)}>
                            <Mail className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">Invite user by email</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Invite Client UAT Portal User</DialogTitle>
                    </DialogHeader>
                    {!inviteLink ? (
                        <form onSubmit={handleInvite} className="space-y-4 pt-1">
                            <div className="space-y-1.5">
                                <Label htmlFor="portal-invite-email">Email address</Label>
                                <Input
                                    id="portal-invite-email"
                                    type="email"
                                    placeholder="client@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                A 7-day invite link will be generated. Share it with the user to give them Client UAT Portal access.
                            </p>
                            <DialogFooter>
                                <Button type="button" variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
                                <Button type="submit" size="sm" disabled={isPending}>
                                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                    Generate Invite
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        <div className="space-y-4 pt-1">
                            <p className="text-sm text-muted-foreground">Share this link with <span className="font-medium text-foreground">{email}</span>:</p>
                            <div className="flex items-center gap-2">
                                <Input value={inviteLink} readOnly className="text-xs font-mono" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Copied!") }}
                                >
                                    Copy
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Link expires in 7 days.</p>
                            <DialogFooter>
                                <Button type="button" size="sm" onClick={handleClose}>Done</Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

// ─── Create User ───────────────────────────────────────────────────────────────

function CreateUserButton({ clientId }: { clientId: string }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isPending, startTransition] = useTransition()

    function handleClose() {
        setOpen(false)
        setName("")
        setEmail("")
        setPassword("")
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim() || !email.trim() || !password.trim()) return
        startTransition(async () => {
            try {
                await createPortalUserWithPassword(clientId, email.trim(), name.trim(), password)
                toast.success("Portal user created")
                handleClose()
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to create user")
            }
        })
    }

    return (
        <>
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setOpen(true)}>
                            <UserPlus className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">Create new portal user</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Portal User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                            <Label htmlFor="create-portal-name">Name</Label>
                            <Input
                                id="create-portal-name"
                                type="text"
                                placeholder="Jane Smith"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="create-portal-email">Email</Label>
                            <Input
                                id="create-portal-email"
                                type="email"
                                placeholder="client@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="create-portal-password">Password</Label>
                            <Input
                                id="create-portal-password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
                            <Button type="submit" size="sm" disabled={isPending}>
                                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                Create User
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

// ─── Deactivate User ───────────────────────────────────────────────────────────

function DeactivateUserButton({ profileId, userName }: { profileId: string; userName: string }) {
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10" disabled={isPending}>
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate Client UAT Portal access?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {userName} will lose access to this client&apos;s UAT Portal.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => startTransition(async () => {
                            try {
                                await deactivatePortalProfile(profileId)
                                toast.success(`${userName} deactivated`)
                                setOpen(false)
                            } catch (err: unknown) {
                                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to deactivate")
                            }
                        })}
                    >
                        Deactivate
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// ─── Edit User Button ──────────────────────────────────────────────────────────

function EditUserButton({ profileId, user }: { profileId: string; user: { name: string | null; email: string } }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(user.name ?? "")
    const [isPending, startTransition] = useTransition()

    function handleOpen() {
        setName(user.name ?? "")
        setOpen(true)
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return
        startTransition(async () => {
            try {
                await updatePortalUserName(profileId, name.trim())
                toast.success("User updated")
                setOpen(false)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to update")
            }
        })
    }

    return (
        <>
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/40 hover:text-foreground hover:bg-muted" onClick={handleOpen}>
                            <Pencil className="h-3 w-3" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Edit user</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Edit Portal User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                            <Label className="text-sm">Display name</Label>
                            <Input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Full name"
                                disabled={isPending}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm text-muted-foreground">Email</Label>
                            <Input value={user.email} disabled className="text-muted-foreground" />
                            <p className="text-[11px] text-muted-foreground">Email cannot be changed — used for login.</p>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
                            <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
                                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

// ─── Announcements Manager ─────────────────────────────────────────────────────

const ANNOUNCEMENT_ICONS = {
    info: Info,
    warning: AlertTriangle,
    system: Megaphone,
}

const ANNOUNCEMENT_COLORS = {
    info: "text-blue-500",
    warning: "text-amber-500",
    system: "text-violet-500",
}

function AnnouncementsManager({
    clientId,
    announcements,
    hideHeader,
    showCreate: showCreateProp,
    onShowCreateChange,
}: {
    clientId: string
    announcements: PortalAnnouncementRow[]
    hideHeader?: boolean
    showCreate?: boolean
    onShowCreateChange?: (v: boolean) => void
}) {
    const [internalShowCreate, setInternalShowCreate] = useState(false)
    const showCreate = showCreateProp !== undefined ? showCreateProp : internalShowCreate
    function setShowCreate(v: boolean) {
        setInternalShowCreate(v)
        onShowCreateChange?.(v)
    }
    const [isPending, startTransition] = useTransition()
    const [type, setType] = useState<"info" | "warning" | "system">("info")

    function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const data: AnnouncementInput = {
            clientId,
            type,
            title: (fd.get("title") as string).trim(),
            body: (fd.get("body") as string).trim() || undefined,
            buildId: (fd.get("buildId") as string).trim() || undefined,
            expiresAt: (fd.get("expiresAt") as string) || undefined,
        }
        if (!data.title) return

        startTransition(async () => {
            try {
                await createAnnouncement(data)
                toast.success("Announcement created")
                setShowCreate(false)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to create announcement")
            }
        })
    }

    const activeCount = announcements.filter(a => a.isActive).length

    return (
        <>
            {!hideHeader && (
                <SectionHeader
                    label="Announcements"
                    count={activeCount > 0 ? activeCount : undefined}
                    action={
                        <Button variant="ghost" size="sm" onClick={() => setShowCreate(true)} className="h-7 text-xs gap-1.5 px-2.5 text-muted-foreground hover:text-foreground">
                            <Plus className="h-3 w-3" />
                            New
                        </Button>
                    }
                />
            )}

            {announcements.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/40 px-4 py-5 text-center">
                    <Megaphone className="h-4 w-4 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground/50">No announcements yet.</p>
                </div>
            ) : (
                <div className="rounded-lg border border-border/50 overflow-hidden divide-y divide-border/40">
                    {announcements.map(ann => {
                        const Icon = ANNOUNCEMENT_ICONS[ann.type as keyof typeof ANNOUNCEMENT_ICONS] ?? Info
                        const color = ANNOUNCEMENT_COLORS[ann.type as keyof typeof ANNOUNCEMENT_COLORS] ?? "text-blue-500"
                        return (
                            <div
                                key={ann.id}
                                className={cn(
                                    "flex items-center justify-between gap-3 px-3 py-2.5",
                                    !ann.isActive && "opacity-50"
                                )}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-muted/60 shrink-0">
                                        <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm truncate leading-none">{ann.title}</p>
                                        {ann.buildId && (
                                            <span className="text-[10px] font-mono text-muted-foreground">{ann.buildId}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground/60 hover:text-foreground"
                                        title={ann.isActive ? "Deactivate" : "Activate"}
                                        onClick={() => startTransition(async () => {
                                            try {
                                                await toggleAnnouncement(ann.id, !ann.isActive)
                                            } catch (err: unknown) {
                                                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to toggle")
                                            }
                                        })}
                                    >
                                        {ann.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground/60 hover:text-destructive"
                                        onClick={() => startTransition(async () => {
                                            try {
                                                await deleteAnnouncement(ann.id)
                                                toast.success("Deleted")
                                            } catch (err: unknown) {
                                                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to delete")
                                            }
                                        })}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>New Announcement</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={v => setType(v as typeof type)}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="info">Info</SelectItem>
                                    <SelectItem value="warning">Warning</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ann-title">Title</Label>
                            <Input id="ann-title" name="title" placeholder="e.g. Scheduled maintenance tonight" required autoFocus />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ann-body">Body <span className="text-muted-foreground font-normal">(optional)</span></Label>
                            <Textarea id="ann-body" name="body" placeholder="Additional details…" rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="ann-build">Build ID <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                <Input id="ann-build" name="buildId" placeholder="v2.1.4" className="font-mono text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ann-expires">Expires <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                <Input id="ann-expires" name="expiresAt" type="date" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)} disabled={isPending}>Cancel</Button>
                            <Button type="submit" size="sm" disabled={isPending}>
                                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

// ─── UAT Label Picker (per-team) ───────────────────────────────────────────────

function UATLabelPicker({ clientId, teamId, uatLabelIds: initialLabelIds }: {
    clientId: string
    teamId: string
    uatLabelIds: string[]
}) {
    const [open, setOpen] = useState(false)
    const [labels, setLabels] = useState<LinearLabelNode[]>([])
    const [loadingLabels, setLoadingLabels] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>(initialLabelIds)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (initialLabelIds.length > 0 && labels.length === 0 && !loadingLabels) {
            setLoadingLabels(true)
            getLinearLabelsForTeam(teamId)
                .then(setLabels)
                .catch(() => setLabels([]))
                .finally(() => setLoadingLabels(false))
        }
    }, [])

    function handleOpen(newOpen: boolean) {
        setOpen(newOpen)
        if (newOpen && labels.length === 0 && !loadingLabels) {
            setLoadingLabels(true)
            getLinearLabelsForTeam(teamId)
                .then(setLabels)
                .catch(() => setLabels([]))
                .finally(() => setLoadingLabels(false))
        }
    }

    function toggleLabel(labelId: string) {
        const next = selectedIds.includes(labelId)
            ? selectedIds.filter(id => id !== labelId)
            : [...selectedIds, labelId]
        setSelectedIds(next)
        startTransition(async () => {
            try {
                await updateTeamUatLabel(clientId, teamId, next)
                toast.success(next.length > 0 ? "UAT labels updated" : "UAT label filter cleared")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to update UAT labels")
                setSelectedIds(selectedIds)
            }
        })
    }

    function clearAll() {
        setSelectedIds([])
        startTransition(async () => {
            try {
                await updateTeamUatLabel(clientId, teamId, [])
                toast.success("UAT label filter cleared")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to clear UAT labels")
            }
        })
    }

    const selectedLabels = labels.filter(l => selectedIds.includes(l.id))

    return (
        <div className="px-3 py-3 border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors">
            <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-muted/60 shrink-0">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                        <span className="text-sm font-medium text-foreground">Included Linear Labels</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Filter: only issues with these Linear labels appear in the portal. Select multiple to include them all.
                        </p>
                    </div>
                </div>

                <div className="ml-8 flex flex-wrap gap-1.5 items-center min-h-[28px]">
                    {selectedLabels.map(label => (
                        <div key={label.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50 text-xs shadow-sm">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                            {label.name}
                            <button
                                onClick={() => toggleLabel(label.id)}
                                className="ml-1 opacity-60 hover:opacity-100 hover:text-destructive transition-opacity focus:outline-none"
                                disabled={isPending}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    
                    <Popover open={open} onOpenChange={handleOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/50 hover:border-border/80">
                                <Plus className="h-3 w-3 mr-1" />
                                {selectedIds.length === 0 ? "Add label filter" : "Add more"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-64" align="start">
                            <Command>
                                <CommandInput placeholder="Search labels…" className="h-8 text-xs" />
                                <CommandList>
                                    {loadingLabels ? (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <>
                                            <CommandEmpty>No labels found.</CommandEmpty>
                                            <CommandGroup>
                                                {labels.map(label => {
                                                    const isSelected = selectedIds.includes(label.id)
                                                    return (
                                                        <CommandItem
                                                            key={label.id}
                                                            value={label.name}
                                                            onSelect={() => toggleLabel(label.id)}
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            className="text-xs"
                                                        >
                                                            <div className="flex items-center flex-1">
                                                                <span className="h-2 w-2 rounded-full shrink-0 mr-2" style={{ backgroundColor: label.color }} />
                                                                {label.name}
                                                            </div>
                                                            <div className="w-4 flex justify-end">
                                                                {isSelected && <Check className="h-3 w-3 text-primary" />}
                                                            </div>
                                                        </CommandItem>
                                                    )
                                                })}
                                            </CommandGroup>
                                            {selectedIds.length > 0 && (
                                                <CommandGroup>
                                                    <CommandItem value="__clear__" onSelect={() => { clearAll(); setOpen(false); }} className="text-xs text-muted-foreground justify-center">
                                                        <X className="h-3 w-3 mr-2" />
                                                        Clear all labels
                                                    </CommandItem>
                                                </CommandGroup>
                                            )}
                                        </>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-2" />}
                </div>
            </div>
        </div>
    )
}

// ─── UAT Project Picker (per-team) ─────────────────────────────────────────────

function UATProjectPicker({ clientId, teamId, uatProjectIds }: {
    clientId: string
    teamId: string
    uatProjectIds: string[]
}) {
    const [open, setOpen] = useState(false)
    const [projects, setProjects] = useState<LinearProject[]>([])
    const [loadingProjects, setLoadingProjects] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>(uatProjectIds)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (uatProjectIds.length > 0 && projects.length === 0 && !loadingProjects) {
            setLoadingProjects(true)
            getLinearProjectsForTeam(teamId)
                .then(setProjects)
                .catch(() => setProjects([]))
                .finally(() => setLoadingProjects(false))
        }
    }, [])

    function handleOpen(newOpen: boolean) {
        setOpen(newOpen)
        if (newOpen && projects.length === 0 && !loadingProjects) {
            setLoadingProjects(true)
            getLinearProjectsForTeam(teamId)
                .then(setProjects)
                .catch(() => setProjects([]))
                .finally(() => setLoadingProjects(false))
        }
    }

    function toggleProject(projectId: string) {
        const newIds = selectedIds.includes(projectId)
            ? selectedIds.filter(id => id !== projectId)
            : [...selectedIds, projectId]
        setSelectedIds(newIds)
        startTransition(async () => {
            try {
                await updateTeamUatProject(clientId, teamId, newIds)
                toast.success(newIds.length > 0 ? "Project filter updated" : "Project filter cleared")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to update project filter")
                setSelectedIds(selectedIds) // revert
            }
        })
    }

    function clearAll() {
        setSelectedIds([])
        startTransition(async () => {
            try {
                await updateTeamUatProject(clientId, teamId, [])
                toast.success("Project filter cleared")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to clear project filter")
            }
        })
    }

    const selectedProjects = projects.filter(p => selectedIds.includes(p.id))

    return (
        <div className="px-3 py-3 border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors">
            <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-muted/60 shrink-0">
                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                        <span className="text-sm font-medium text-foreground">Included Linear Projects</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Filter: only issues belonging to these Linear projects appear in the portal. Select multiple if needed.
                        </p>
                    </div>
                </div>

                <div className="ml-8 flex flex-wrap gap-1.5 items-center min-h-[28px]">
                    {selectedProjects.map(project => (
                        <div key={project.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50 text-xs shadow-sm">
                            {project.color ? (
                                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: project.color }} />
                            ) : (
                                <FolderOpen className="h-3 w-3 text-muted-foreground" />
                            )}
                            {project.name}
                            <button
                                onClick={() => toggleProject(project.id)}
                                className="ml-1 opacity-60 hover:opacity-100 hover:text-destructive transition-opacity focus:outline-none"
                                disabled={isPending}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    
                    <Popover open={open} onOpenChange={handleOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/50 hover:border-border/80">
                                <Plus className="h-3 w-3 mr-1" />
                                {selectedIds.length === 0 ? "Add project filter" : "Add more"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-72" align="start">
                            <Command>
                                <CommandInput placeholder="Search projects…" className="h-8 text-xs" />
                                <CommandList>
                                    {loadingProjects ? (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <>
                                            <CommandEmpty>No projects found.</CommandEmpty>
                                            <CommandGroup>
                                                {projects.map(project => {
                                                    const isSelected = selectedIds.includes(project.id)
                                                    return (
                                                        <CommandItem
                                                            key={project.id}
                                                            value={project.name}
                                                            onSelect={() => toggleProject(project.id)}
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            className="text-xs"
                                                        >
                                                            <div className="flex items-center flex-1 truncate">
                                                                {project.color ? (
                                                                    <span className="h-2 w-2 rounded-sm shrink-0 mr-2" style={{ backgroundColor: project.color }} />
                                                                ) : (
                                                                    <FolderOpen className="h-3 w-3 mr-2 text-muted-foreground shrink-0" />
                                                                )}
                                                                <span className="truncate">{project.name}</span>
                                                            </div>
                                                            <div className="w-4 flex justify-end shrink-0">
                                                                {isSelected && <Check className="h-3 w-3 text-primary" />}
                                                            </div>
                                                        </CommandItem>
                                                    )
                                                })}
                                            </CommandGroup>
                                            {selectedIds.length > 0 && (
                                                <CommandGroup>
                                                    <CommandItem value="__clear__" onSelect={() => { clearAll(); setOpen(false); }} className="text-xs text-muted-foreground justify-center">
                                                        <X className="h-3 w-3 mr-2" />
                                                        Clear all projects
                                                    </CommandItem>
                                                </CommandGroup>
                                            )}
                                        </>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-2" />}
                </div>
            </div>
        </div>
    )
}

// ─── Module Labels Picker (per-team) ──────────────────────────────────────────

// ─── Color Constants ──────────────────────────────────────────────────────────

const LABEL_COLOR_PRESETS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#10b981", "#3b82f6", "#8b5cf6", "#ec4899",
    "#6b7280", "#0ea5e9", "#f43f5e", "#84cc16",
]

// ─── Color Swatch Picker ──────────────────────────────────────────────────────

function ColorSwatch({ value, onChange, size = "md" }: { value: string; onChange: (c: string) => void; size?: "sm" | "md" }) {
    const [open, setOpen] = useState(false)
    const sz = size === "sm" ? "h-4 w-4" : "h-5 w-5"
    return (
        <div className="relative">
            <button
                type="button"
                className={`${sz} rounded-full border-2 border-background ring-1 ring-border shrink-0`}
                style={{ backgroundColor: value }}
                onClick={() => setOpen(o => !o)}
            />
            {open && (
                <div className="absolute left-0 top-6 z-20 bg-popover border border-border rounded-md p-2 shadow-lg grid grid-cols-6 gap-1">
                    {LABEL_COLOR_PRESETS.map(c => (
                        <button
                            key={c}
                            type="button"
                            className={`h-4 w-4 rounded-full border-2 transition-transform hover:scale-110 ${value === c ? "border-foreground" : "border-background"}`}
                            style={{ backgroundColor: c }}
                            onClick={() => { onChange(c); setOpen(false) }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Inline Add Label Form ────────────────────────────────────────────────────

function InlineAddLabelForm({
    name, color, onNameChange, onColorChange, onSubmit, onCancel, isPending, placeholder, className = "",
}: {
    name: string; color: string; onNameChange: (v: string) => void; onColorChange: (v: string) => void
    onSubmit: () => void; onCancel: () => void; isPending: boolean; placeholder?: string; className?: string
}) {
    return (
        <div className={`flex items-center gap-2 py-2 ${className}`}>
            <ColorSwatch value={color} onChange={onColorChange} size="sm" />
            <Input
                value={name}
                onChange={e => onNameChange(e.target.value)}
                onKeyDown={e => {
                    if (e.key === "Enter") onSubmit()
                    if (e.key === "Escape") onCancel()
                }}
                placeholder={placeholder ?? "Label name..."}
                className="h-6 text-xs flex-1"
                autoFocus
            />
            <Button size="sm" className="h-6 text-xs px-2" onClick={onSubmit} disabled={isPending || !name.trim()}>
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onCancel}>
                <X className="h-3 w-3" />
            </Button>
        </div>
    )
}

// ─── Module Labels Section (inline tree CRUD + module selector) ───────────────

function ModuleLabelsSection({ clientId, teamId, portalModuleLabelIds }: {
    clientId: string
    teamId: string
    portalModuleLabelIds: string[]
}) {
    const [labels, setLabels] = useState<LinearLabelNode[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>(portalModuleLabelIds)
    const [loading, setLoading] = useState(false)
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [addingParentId, setAddingParentId] = useState<string | null | "root">(null)
    const [addName, setAddName] = useState("")
    const [addColor, setAddColor] = useState(LABEL_COLOR_PRESETS[4])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [editColor, setEditColor] = useState("")
    const [, startSaveTransition] = useTransition()

    useEffect(() => {
        setLoading(true)
        getLinearLabelsForTeam(teamId)
            .then(setLabels)
            .catch(() => setLabels([]))
            .finally(() => setLoading(false))
    }, [teamId])

    async function refresh() {
        const fresh = await getLinearLabelsForTeam(teamId)
        setLabels(fresh)
    }

    async function handleCreate(parentId?: string) {
        if (!addName.trim()) return
        setPendingId("new")
        try {
            await createModuleLabel(teamId, addName.trim(), addColor, parentId)
            setAddName("")
            setAddColor(LABEL_COLOR_PRESETS[4])
            setAddingParentId(null)
            await refresh()
            toast.success("Label created")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to create label")
        } finally {
            setPendingId(null)
        }
    }

    function startEdit(label: LinearLabelNode) {
        setEditingId(label.id)
        setEditName(label.name)
        setEditColor(label.color)
        setAddingParentId(null)
    }

    async function handleUpdate(labelId: string) {
        if (!editName.trim()) return
        setPendingId(labelId)
        try {
            await updateModuleLabel(labelId, editName.trim(), editColor)
            setEditingId(null)
            await refresh()
            toast.success("Label updated")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update label")
        } finally {
            setPendingId(null)
        }
    }

    async function handleDelete(labelId: string) {
        setPendingId(labelId)
        try {
            await deleteModuleLabel(labelId)
            setSelectedIds(prev => prev.filter(id => id !== labelId))
            await refresh()
            toast.success("Label deleted")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete label")
        } finally {
            setPendingId(null)
        }
    }

    function cancelAdd() {
        setAddingParentId(null)
        setAddName("")
        setAddColor(LABEL_COLOR_PRESETS[4])
    }

    function cancelEdit() {
        setEditingId(null)
    }

    function toggleModule(id: string) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    function handleSaveSelection() {
        startSaveTransition(async () => {
            try {
                await updateTeamModuleLabels(clientId, teamId, selectedIds)
                toast.success(selectedIds.length > 0 ? `${selectedIds.length} module label${selectedIds.length !== 1 ? "s" : ""} saved` : "Module labels cleared")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to update module labels")
            }
        })
    }

    const rootLabels = labels.filter(l => !l.parentId)
    const selectionChanged = JSON.stringify([...selectedIds].sort()) !== JSON.stringify([...portalModuleLabelIds].sort())

    function LabelRow({ label, depth = 0 }: { label: LinearLabelNode; depth?: number }) {
        const isEditing = editingId === label.id
        const isPending = pendingId === label.id
        const children = labels.filter(l => l.parentId === label.id)
        const isAddingChild = addingParentId === label.id
        const isGroup = children.length > 0
        const isLeaf = !isGroup
        const isRoot = depth === 0

        return (
            <div>
                <div className={cn(
                    "flex items-center gap-2 py-1.5 px-3 group hover:bg-muted/20 transition-colors",
                    depth > 0 && "pl-9",
                )}>
                    {isEditing ? (
                        <>
                            <ColorSwatch value={editColor} onChange={setEditColor} size="sm" />
                            <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") handleUpdate(label.id)
                                    if (e.key === "Escape") cancelEdit()
                                }}
                                className="h-6 text-xs flex-1"
                                autoFocus
                            />
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleUpdate(label.id)} disabled={isPending}>
                                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-emerald-500" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={cancelEdit}>
                                <X className="h-3 w-3" />
                            </Button>
                        </>
                    ) : (
                        <>
                            {isLeaf ? (
                                <button
                                    type="button"
                                    onClick={() => toggleModule(label.id)}
                                    className={cn(
                                        "h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center transition-colors",
                                        selectedIds.includes(label.id)
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-muted-foreground/30 hover:border-muted-foreground/60",
                                    )}
                                >
                                    {selectedIds.includes(label.id) && <Check className="h-2.5 w-2.5" />}
                                </button>
                            ) : (
                                /* group label spacer — not selectable */
                                <span className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                            <span className={cn(
                                "text-xs flex-1 truncate",
                                isGroup && "text-muted-foreground font-medium",
                            )}>{label.name}</span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isRoot && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 px-1 text-[10px] text-muted-foreground gap-0.5"
                                        onClick={() => {
                                            setAddingParentId(label.id)
                                            setAddName("")
                                            setAddColor(label.color)
                                        }}
                                    >
                                        <Plus className="h-2.5 w-2.5" />
                                        sub
                                    </Button>
                                )}
                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => startEdit(label)}>
                                    <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" disabled={isPending}>
                                            {isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete &quot;{label.name}&quot;?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {children.length > 0
                                                    ? `This will also delete ${children.length} sub-label${children.length !== 1 ? "s" : ""}.`
                                                    : "This label will be removed from Linear."}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDelete(label.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </>
                    )}
                </div>

                {/* Children */}
                {children.length > 0 && (
                    <div className="relative ml-3 border-l border-border/40">
                        {children.map(child => (
                            <LabelRow key={child.id} label={child} depth={depth + 1} />
                        ))}
                    </div>
                )}

                {/* Inline add sub-label form */}
                {isAddingChild && (
                    <div className="ml-7 border-l border-border/40">
                        <InlineAddLabelForm
                            name={addName}
                            color={addColor}
                            onNameChange={setAddName}
                            onColorChange={setAddColor}
                            onSubmit={() => handleCreate(label.id)}
                            onCancel={cancelAdd}
                            isPending={pendingId === "new"}
                            placeholder="Sub-label name..."
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <div>
            <SettingRow
                icon={Tag}
                label="Test Modules"
                hint="Use Linear labels to divide issues into test modules (e.g. Homepage, Cart). Selected labels appear as module filters on the portal board."
                right={
                    loading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : selectedIds.length === 0 ? (
                        <span className="text-xs text-muted-foreground/60 bg-muted/50 rounded px-1.5 py-0.5">None selected</span>
                    ) : (
                        <span className="text-xs text-foreground">{selectedIds.length} module{selectedIds.length !== 1 ? "s" : ""}</span>
                    )
                }
            />
            <div className="px-3 pb-3 border-t border-border/30 bg-muted/10">
                {loading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {rootLabels.length === 0 && addingParentId !== "root" && (
                            <p className="py-3 text-xs text-muted-foreground/60 italic">
                                No module labels yet. Add one to get started.
                            </p>
                        )}

                        {rootLabels.map(label => (
                            <LabelRow key={label.id} label={label} />
                        ))}

                        {/* Inline root add form */}
                        {addingParentId === "root" && (
                            <InlineAddLabelForm
                                name={addName}
                                color={addColor}
                                onNameChange={setAddName}
                                onColorChange={setAddColor}
                                onSubmit={() => handleCreate(undefined)}
                                onCancel={cancelAdd}
                                isPending={pendingId === "new"}
                                placeholder="Module name..."
                                className="px-3"
                            />
                        )}

                        <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/30">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs gap-1 text-muted-foreground"
                                onClick={() => {
                                    setAddingParentId("root")
                                    setAddName("")
                                    setAddColor(LABEL_COLOR_PRESETS[4])
                                }}
                                disabled={addingParentId === "root"}
                            >
                                <Plus className="h-3 w-3" />
                                Add module
                            </Button>
                            {selectionChanged && (
                                <Button size="sm" className="h-6 text-xs px-2" onClick={handleSaveSelection}>
                                    Save selection
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// ─── Column Mapping Section (inline expansion) ───────────────────────────────

type MappingValue = string | null | undefined

function toSelectValue(mapping: MappingValue): string {
    if (mapping === undefined) return "__auto__"
    if (mapping === null) return "__hidden__"
    return mapping
}

function fromSelectValue(val: string): MappingValue {
    if (val === "__auto__") return undefined
    if (val === "__hidden__") return null
    return val
}

function ColumnMappingSection({ teamId, states, onStatesChange, loading }: {
    teamId: string
    states: WorkflowStateWithMapping[]
    onStatesChange: (s: WorkflowStateWithMapping[]) => void
    loading: boolean
}) {
    return (
        <div>
            <SettingRow
                icon={LayoutDashboard}
                label="Linear Issue States Mapping"
                hint="Map each Linear state to its UAT portal board column"
                right={
                    loading ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> : null
                }
            />
            <div className="border-t border-border/30">
                {loading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : states.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-muted-foreground/60 italic">No workflow states found for this team.</p>
                ) : (
                    <WorkflowMappingInline teamId={teamId} states={states} onStatesChange={onStatesChange} />
                )}
            </div>
        </div>
    )
}

function WorkflowMappingInline({
    teamId,
    states,
    onStatesChange,
}: {
    teamId: string
    states: WorkflowStateWithMapping[]
    onStatesChange: (s: WorkflowStateWithMapping[]) => void
}) {
    const [isPending, startTransition] = useTransition()
    const [localMappings, setLocalMappings] = useState<Map<string, MappingValue>>(() => {
        const map = new Map<string, MappingValue>()
        for (const s of states) map.set(s.id, s.uatColumn)
        return map
    })
    const initialMappings = useMemo(() => {
        const map = new Map<string, MappingValue>()
        for (const s of states) map.set(s.id, s.uatColumn)
        return map
    }, [states])
    const hasChanges = useMemo(() => {
        for (const s of states) if (localMappings.get(s.id) !== initialMappings.get(s.id)) return true
        return false
    }, [localMappings, initialMappings, states])
    const overrideCount = useMemo(() => {
        let count = 0
        for (const val of localMappings.values()) if (val !== undefined) count++
        return count
    }, [localMappings])

    function handleChange(stateId: string, selectVal: string) {
        setLocalMappings(prev => { const next = new Map(prev); next.set(stateId, fromSelectValue(selectVal)); return next })
    }

    function handleSave() {
        startTransition(async () => {
            try {
                const mappings: Array<{ stateId: string; stateName: string; uatColumn: string | null }> = []
                for (const s of states) {
                    const val = localMappings.get(s.id)
                    if (val !== undefined) mappings.push({ stateId: s.id, stateName: s.name, uatColumn: val })
                }
                await saveUATStateMappings(teamId, mappings)
                toast.success("State mappings saved")
            } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to save mappings") }
        })
    }

    function handleReset() {
        startTransition(async () => {
            try {
                await resetUATStateMappings(teamId)
                setLocalMappings(() => { const map = new Map<string, MappingValue>(); for (const s of states) map.set(s.id, undefined); return map })
                toast.success("All mappings reset to auto-detect")
            } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to reset mappings") }
        })
    }

    const statesByType = useMemo(() => {
        const groups = new Map<string, WorkflowStateWithMapping[]>()
        for (const s of states) { const existing = groups.get(s.type) ?? []; existing.push(s); groups.set(s.type, existing) }
        return groups
    }, [states])
    const typeOrder = ["triage", "backlog", "unstarted", "started", "completed", "cancelled"]
    const sortedTypes = [...statesByType.keys()].sort((a, b) => (typeOrder.indexOf(a) === -1 ? 99 : typeOrder.indexOf(a)) - (typeOrder.indexOf(b) === -1 ? 99 : typeOrder.indexOf(b)))

    const typeLabels: Record<string, string> = {
        triage: "Triage",
        backlog: "Backlog",
        unstarted: "Unstarted",
        started: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
    }

    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
    function toggleGroup(type: string) {
        setCollapsedGroups(prev => {
            const next = new Set(prev)
            if (next.has(type)) next.delete(type)
            else next.add(type)
            return next
        })
    }

    return (
        <div>
            <div className="divide-y divide-border/20">
                {sortedTypes.map(type => {
                    const groupStates = statesByType.get(type) ?? []
                    const isCollapsed = collapsedGroups.has(type)
                    const changedCount = groupStates.filter(s => localMappings.get(s.id) !== initialMappings.get(s.id)).length
                    return (
                        <div key={type}>
                            {/* Group header — clickable to collapse */}
                            <button
                                type="button"
                                onClick={() => toggleGroup(type)}
                                className="w-full flex items-center gap-2 px-4 py-2 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                            >
                                <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/50 shrink-0 transition-transform duration-150", !isCollapsed && "rotate-90")} />
                                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 select-none flex-1">
                                    {typeLabels[type] ?? type}
                                </span>
                                <span className="text-[10px] text-muted-foreground/40 tabular-nums shrink-0">
                                    {groupStates.length} state{groupStates.length !== 1 ? "s" : ""}
                                </span>
                                {changedCount > 0 && (
                                    <span className="text-[10px] font-medium text-primary shrink-0">
                                        {changedCount} changed
                                    </span>
                                )}
                            </button>
                            {/* State rows */}
                            {!isCollapsed && (
                                <div className="divide-y divide-border/10">
                                    {groupStates.map(state => {
                                        const currentVal = localMappings.get(state.id)
                                        const isOverride = currentVal !== undefined
                                        const isChanged = currentVal !== initialMappings.get(state.id)
                                        const autoColumn = mapStateToUATColumn({ name: state.name, type: state.type })
                                        const autoLabel = autoColumn ? UAT_COLUMNS.find(c => c.id === autoColumn)?.title ?? autoColumn : "Hidden"
                                        return (
                                            <div
                                                key={state.id}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-2 transition-colors",
                                                    isChanged
                                                        ? "bg-primary/5 border-l-2 border-primary"
                                                        : "hover:bg-muted/20 border-l-2 border-transparent",
                                                )}
                                            >
                                                {/* Color dot */}
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: state.color }}
                                                />
                                                {/* State name + auto badge */}
                                                <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                                                    <span className="text-sm truncate">{state.name}</span>
                                                    {!isOverride && (
                                                        <span className="text-[10px] text-muted-foreground/40 shrink-0">
                                                            Auto · {autoLabel}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Portal column select */}
                                                <Select value={toSelectValue(currentVal)} onValueChange={v => handleChange(state.id, v)}>
                                                    <SelectTrigger className="h-7 text-xs w-[180px] shrink-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__auto__">Auto ({autoLabel})</SelectItem>
                                                        <SelectItem value="__hidden__">Hidden</SelectItem>
                                                        <SelectSeparator />
                                                        {UAT_COLUMNS.map(col => (
                                                            <SelectItem key={col.id} value={col.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                                                                    {col.title}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-muted/10 mt-1">
                <Button variant="ghost" size="sm" onClick={handleReset} disabled={isPending || overrideCount === 0} className="h-6 text-xs text-muted-foreground">
                    <RotateCcw className="h-3 w-3 mr-1" />Reset
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isPending || !hasChanges} className="h-6 text-xs">
                    <Save className="h-3 w-3 mr-1" />{isPending ? "Saving..." : "Save"}
                </Button>
            </div>
        </div>
    )
}

// ─── Bootstrap Section (per-team) ────────────────────────────────────────────


// ─── Transition Rules Section (per-team) ────────────────────────────────────

function TransitionsSection({ clientId, teamId }: { clientId: string; teamId: string }) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<{ clientTransitions: AllowedTransitions; staffTransitions: AllowedTransitions } | null>(null)

    useEffect(() => {
        getTeamTransitions(teamId)
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false))
    }, [teamId])

    return (
        <div>
            <SettingRow
                icon={ArrowRightLeft}
                label="Transition Rules"
                hint="Control which column moves clients and staff can make on the portal"
                right={loading ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> : null}
            />
            {!loading && data && (
                <div className="border-t border-border/30 divide-y divide-border/20">
                    <TransitionRulesInline
                        clientId={clientId}
                        teamId={teamId}
                        label="Client Transition Rules"
                        icon={ArrowRightLeft}
                        iconBg="bg-amber-50 dark:bg-amber-950/60"
                        iconColor="text-amber-600 dark:text-amber-400"
                        hint="Which column moves portal clients can make"
                        initialTransitions={data.clientTransitions}
                        defaultTransitions={DEFAULT_CLIENT_TRANSITIONS}
                        fromColumns={CLIENT_FROM_COLUMNS}
                        toColumns={CLIENT_TO_COLUMNS}
                        onSave={(t) => updateTeamAllowedTransitions(clientId, teamId, t)}
                        onReset={() => updateTeamAllowedTransitions(clientId, teamId, null)}
                    />
                    <TransitionRulesInline
                        clientId={clientId}
                        teamId={teamId}
                        label="Staff Transition Rules"
                        icon={ShieldCheck}
                        iconBg="bg-violet-50 dark:bg-violet-950/60"
                        iconColor="text-violet-600 dark:text-violet-400"
                        hint="Which column moves staff can make from the portal"
                        initialTransitions={data.staffTransitions}
                        defaultTransitions={DEFAULT_STAFF_TRANSITIONS}
                        fromColumns={STAFF_FROM_COLUMNS}
                        toColumns={STAFF_TO_COLUMNS}
                        onSave={(t) => updateTeamStaffTransitions(clientId, teamId, t)}
                        onReset={() => updateTeamStaffTransitions(clientId, teamId, null)}
                    />
                </div>
            )}
        </div>
    )
}

function TransitionRulesInline({
    clientId,
    teamId: _teamId,
    label,
    icon: Icon,
    iconBg,
    iconColor,
    hint,
    initialTransitions,
    defaultTransitions,
    fromColumns,
    toColumns,
    onSave,
    onReset,
}: {
    clientId: string
    teamId: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    iconBg: string
    iconColor: string
    hint: string
    initialTransitions: AllowedTransitions
    defaultTransitions: AllowedTransitions
    fromColumns: readonly UATColumn[]
    toColumns: readonly UATColumn[]
    onSave: (t: AllowedTransitions) => Promise<void>
    onReset: () => Promise<void>
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [transitions, setTransitions] = useState<AllowedTransitions>(() => {
        const copy: AllowedTransitions = {}
        for (const from of fromColumns) copy[from] = [...(initialTransitions[from] ?? [])]
        return copy
    })

    const isDefault = useMemo(() => {
        for (const from of fromColumns) {
            const current = [...(transitions[from] ?? [])].sort()
            const def = [...(defaultTransitions[from] ?? [])].sort()
            if (current.length !== def.length) return false
            for (let i = 0; i < current.length; i++) if (current[i] !== def[i]) return false
        }
        return true
    }, [transitions, fromColumns, defaultTransitions])

    const hasChanges = useMemo(() => {
        for (const from of fromColumns) {
            const current = [...(transitions[from] ?? [])].sort()
            const initial = [...(initialTransitions[from] ?? [])].sort()
            if (current.length !== initial.length) return true
            for (let i = 0; i < current.length; i++) if (current[i] !== initial[i]) return true
        }
        return false
    }, [transitions, initialTransitions, fromColumns])

    function toggleTransition(from: UATColumn, to: UATColumn) {
        setTransitions(prev => {
            const next = { ...prev }
            const list = [...(next[from] ?? [])]
            const idx = list.indexOf(to)
            if (idx >= 0) list.splice(idx, 1); else list.push(to)
            next[from] = list
            return next
        })
    }

    function handleSave() {
        startTransition(async () => {
            try { await onSave(transitions); toast.success("Transition rules saved") }
            catch (e) { toast.error(e instanceof Error ? e.message : "Failed to save") }
        })
    }

    function handleReset() {
        startTransition(async () => {
            try {
                await onReset()
                const copy: AllowedTransitions = {}
                for (const from of fromColumns) copy[from] = [...(defaultTransitions[from] ?? [])]
                setTransitions(copy)
                toast.success("Reset to defaults")
            } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to reset") }
        })
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
            >
                <span className={`flex items-center justify-center h-6 w-6 rounded-md shrink-0 ${iconBg}`}>
                    <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-xs font-medium leading-tight">{label}</span>
                    <span className="block text-[10px] text-muted-foreground/60 mt-0.5 italic">{hint}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary" className="text-[10px] font-normal h-4 px-1.5">
                        {isDefault ? "Default" : "Custom"}
                    </Badge>
                    {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </span>
            </button>
            {open && (
                <div className="border-t border-border/20">
                    <div className="px-3 py-3 overflow-x-auto">
                        <TransitionRulesMatrix
                            fromColumns={[...fromColumns]}
                            toColumns={[...toColumns]}
                            transitions={transitions}
                            onChange={toggleTransition}
                            disabled={isPending}
                            columns={UAT_COLUMNS}
                        />
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 border-t border-border/20 bg-muted/10">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-muted-foreground gap-1"
                            onClick={handleReset}
                            disabled={isPending || isDefault || !clientId}
                        >
                            <RotateCcw className="h-3 w-3" />Reset
                        </Button>
                        <Button
                            size="sm"
                            className="h-6 text-xs gap-1"
                            onClick={handleSave}
                            disabled={isPending || !hasChanges || !clientId}
                        >
                            <Save className="h-3 w-3" />{isPending ? "Saving…" : "Save"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({
    team,
    clientId,
    uatLabelIds,
    uatProjectIds,
    portalModuleLabelIds,
}: {
    team: PortalTeam
    clientId: string
    uatLabelIds: string[]
    uatProjectIds: string[]
    portalModuleLabelIds: string[]
}) {
    const router = useRouter()
    const [workflowStates, setWorkflowStates] = useState<WorkflowStateWithMapping[]>([])
    const [loadingStates, setLoadingStates] = useState(false)

    useEffect(() => {
        setLoadingStates(true)
        getLinearWorkflowStatesWithMappings(team.id)
            .then(result => {
                if (result === null) {
                    router.push("/settings/integrations")
                    return
                }
                setWorkflowStates(result)
            })
            .catch(() => setWorkflowStates([]))
            .finally(() => setLoadingStates(false))
    }, [team.id])

    return (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] font-semibold tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0 uppercase">
                        {team.key}
                    </span>
                    <span className="text-sm font-semibold truncate">{team.name}</span>
                </div>
                <UnlinkTeamButton clientId={clientId} teamId={team.id} teamName={team.name} />
            </div>

            {/* Always-visible settings */}
            <div className="divide-y divide-border/30">
                <UATLabelPicker
                    clientId={clientId}
                    teamId={team.id}
                    uatLabelIds={uatLabelIds}
                />
                <UATProjectPicker
                    clientId={clientId}
                    teamId={team.id}
                    uatProjectIds={uatProjectIds}
                />
                <ModuleLabelsSection
                    clientId={clientId}
                    teamId={team.id}
                    portalModuleLabelIds={portalModuleLabelIds}
                />
                <ColumnMappingSection
                    teamId={team.id}
                    states={workflowStates}
                    onStatesChange={setWorkflowStates}
                    loading={loadingStates}
                />
                <TransitionsSection
                    clientId={clientId}
                    teamId={team.id}
                />
            </div>
        </div>
    )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export function PortalSection({
    clientId,
    linkedTeams,
    allWorkspaceTeams,
    portalUsers,
    announcements,
    teamSettings,
}: PortalSectionProps) {
    const activeUsers = portalUsers.filter(u => u.isActive)
    const teamSettingsMap = new Map(teamSettings.map(s => [s.linearTeamId, s]))
    const [showAnnCreate, setShowAnnCreate] = useState(false)
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(linkedTeams[0]?.id ?? null)

    // If the selected team was unlinked, fall back to the first remaining team
    const effectiveSelectedTeamId = linkedTeams.find(t => t.id === selectedTeamId)?.id ?? linkedTeams[0]?.id ?? null

    return (
        <div className="space-y-6">

            {/* ── Row 1: Users + Announcements side by side ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Portal Users card */}
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-background border border-border/60 shrink-0">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-semibold">Portal Client Users</span>
                            {activeUsers.length > 0 && (
                                <Badge variant="secondary" className="text-xs px-1.5 h-5">{activeUsers.length}</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-0.5">
                            <AddExistingUserButton clientId={clientId} />
                            <InviteUserButton clientId={clientId} />
                            <CreateUserButton clientId={clientId} />
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" asChild>
                                            <a href="/uat" target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs">View portal</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                    {activeUsers.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <Users className="h-4 w-4 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground/50">No portal users yet.</p>
                            <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                                Use &ldquo;Invite User&rdquo; to give a client contact access.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {activeUsers.map(pu => {
                                const initials = (pu.user.name ?? pu.user.email)
                                    .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
                                return (
                                    <div key={pu.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Avatar className="h-7 w-7 shrink-0">
                                                <AvatarImage src={pu.user.image ?? undefined} />
                                                <AvatarFallback className="text-[10px] font-medium">{initials}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate leading-tight">{pu.user.name ?? pu.user.email}</p>
                                                {pu.user.name && (
                                                    <p className="text-xs text-muted-foreground truncate leading-tight">{pu.user.email}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            <EditUserButton profileId={pu.id} user={pu.user} />
                                            <DeactivateUserButton profileId={pu.id} userName={pu.user.name ?? pu.user.email} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Announcements card */}
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-background border border-border/60 shrink-0">
                                <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-semibold">Announcements</span>
                            {announcements.filter(a => a.isActive).length > 0 && (
                                <Badge variant="secondary" className="text-xs px-1.5 h-5">
                                    {announcements.filter(a => a.isActive).length}
                                </Badge>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAnnCreate(true)}
                            className="h-7 text-xs gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
                        >
                            <Plus className="h-3 w-3" />
                            New
                        </Button>
                    </div>
                    <div className="px-4 pt-3 pb-4">
                        <AnnouncementsManager
                            clientId={clientId}
                            announcements={announcements}
                            hideHeader
                            showCreate={showAnnCreate}
                            onShowCreateChange={setShowAnnCreate}
                        />
                    </div>
                </div>

            </div>

            {/* ── Row 2: Linear Teams header + link button ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-background border border-border/60 shrink-0">
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-semibold">Linear Teams</span>
                    {linkedTeams.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 h-5">{linkedTeams.length}</Badge>
                    )}
                </div>
                <LinkTeamButton
                    clientId={clientId}
                    allTeams={allWorkspaceTeams}
                    linkedTeamIds={linkedTeams.map(t => t.id)}
                />
            </div>

            {/* ── Guidance banner (shown only when teams are linked) ── */}
            {linkedTeams.length > 0 && (
                <div className="flex gap-3 rounded-lg border-l-2 border-l-blue-400 border border-border/50 bg-muted/30 px-4 py-3.5">
                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">Configure each linked team below</p>
                        <ul className="text-xs text-foreground/80 space-y-0.5 list-disc pl-4">
                            <li><span className="font-medium">Included Labels</span> — filter which issues appear in the portal</li>
                            <li><span className="font-medium">Included Projects</span> — filter by Linear project</li>
                            <li><span className="font-medium">Test Modules</span> — group issues into labeled tabs on the board</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* ── Team tab selector + single content area ── */}
            {linkedTeams.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/40 px-4 py-8 text-center">
                    <Link2 className="h-4 w-4 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground/50">No teams linked yet.</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                        Portal users won&apos;t see any issues until a Linear team is linked.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Tab bar — only shown when 2+ teams */}
                    {linkedTeams.length > 1 && (
                        <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg overflow-x-auto">
                            {linkedTeams.map(team => (
                                <button
                                    key={team.id}
                                    onClick={() => setSelectedTeamId(team.id)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap",
                                        effectiveSelectedTeamId === team.id
                                            ? "bg-background border border-border/60 shadow-sm text-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <span className="font-mono text-[10px] font-semibold tracking-wider text-muted-foreground bg-muted px-1 py-0.5 rounded uppercase">
                                        {team.key}
                                    </span>
                                    <span className="font-medium">{team.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Content area: only the selected team's card */}
                    {linkedTeams
                        .filter(team => team.id === effectiveSelectedTeamId)
                        .map(team => {
                            const settings = teamSettingsMap.get(team.id)
                            return (
                                <TeamCard
                                    key={team.id}
                                    team={team}
                                    clientId={clientId}
                                    uatLabelIds={settings?.uatLabelIds ?? []}
                                    uatProjectIds={settings?.uatProjectIds ?? []}
                                    portalModuleLabelIds={settings?.portalModuleLabelIds ?? []}
                                />
                            )
                        })
                    }
                </div>
            )}

        </div>
    )
}

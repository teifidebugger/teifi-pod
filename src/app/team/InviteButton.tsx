"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { UserPlus, Loader2, Copy, Check } from "lucide-react"
import { createInvite } from "@/app/actions/team"
import { toast } from "sonner"

const INVITE_ROLES = [
    { value: "ADMIN", label: "Admin" },
    { value: "MANAGER", label: "Manager" },
    { value: "MEMBER", label: "Member" },
    { value: "CONTRACTOR", label: "Contractor" },
] as const

interface InviteButtonProps {
    availableProjects?: Array<{ id: string; name: string }>
}

export function InviteButton({ availableProjects = [] }: InviteButtonProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [role, setRole] = useState<string>("MEMBER")
    const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set())

    function handleOpenChange(next: boolean) {
        setOpen(next)
        if (!next) {
            setInviteLink(null)
            setCopied(false)
            setRole("MEMBER")
            setSelectedProjectIds(new Set())
        }
    }

    function toggleProject(id: string) {
        setSelectedProjectIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const email = (fd.get("email") as string).trim()
        startTransition(async () => {
            try {
                const { token } = await createInvite(email, role, {
                    projectIds: [...selectedProjectIds],
                })
                const baseUrl = window.location.origin
                setInviteLink(`${baseUrl}/invite/${token}`)
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to create invite"
                toast.error(message)
            }
        })
    }

    function handleCopy() {
        if (!inviteLink) return
        navigator.clipboard.writeText(inviteLink).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>

                {!inviteLink ? (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="invite-email">Email address</Label>
                            <Input
                                id="invite-email"
                                name="email"
                                type="email"
                                required
                                placeholder="colleague@company.com"
                                autoComplete="off"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="invite-role">Permission</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger id="invite-role" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {INVITE_ROLES.map(r => (
                                        <SelectItem key={r.value} value={r.value}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>


                        {availableProjects.length > 0 && (
                            <div className="space-y-1.5">
                                <Label>Assign to projects <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                <div className="max-h-36 overflow-y-auto space-y-2 rounded-md border border-input p-2.5">
                                    {availableProjects.map(p => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`proj-${p.id}`}
                                                checked={selectedProjectIds.has(p.id)}
                                                onCheckedChange={() => toggleProject(p.id)}
                                            />
                                            <label htmlFor={`proj-${p.id}`} className="text-sm cursor-pointer leading-none">
                                                {p.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" size="sm" onClick={() => handleOpenChange(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={isPending}>
                                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                                Generate Link
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                            Share this link with your invitee. It expires in 7 days.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={inviteLink}
                                className="text-xs font-mono"
                                onFocus={e => e.currentTarget.select()}
                            />
                            <Button type="button" size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button size="sm" onClick={() => handleOpenChange(false)}>Done</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

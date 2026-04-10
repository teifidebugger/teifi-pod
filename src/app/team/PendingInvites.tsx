"use client"

import { useState, useTransition } from "react"
import { revokeInvite } from "@/app/actions/team"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Loader2, Mail, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

type Invite = {
    id: string
    email: string
    role: string
    token: string
    expiresAt: Date
    createdAt: Date
}

export function PendingInvites({ invites }: { invites: Invite[] }) {
    if (invites.length === 0) return null

    return (
        <Card className="border-sidebar-border border-amber-500/30 bg-amber-50/5">
            <CardHeader className="px-4 py-3 pb-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-500" />
                    Pending Invites ({invites.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3">
                <div className="space-y-2">
                    {invites.map(invite => (
                        <InviteRow key={invite.id} invite={invite} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function InviteRow({ invite }: { invite: Invite }) {
    const [isPending, startTransition] = useTransition()
    const [copied, setCopied] = useState(false)

    const expiresIn = formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: false })

    function handleCopy() {
        const link = `${window.location.origin}/invite/${invite.token}`
        navigator.clipboard.writeText(link)
        setCopied(true)
        toast.success("Invite link copied")
        setTimeout(() => setCopied(false), 2000)
    }

    function handleRevoke() {
        startTransition(async () => {
            try {
                await revokeInvite(invite.id)
                toast.success(`Invite for ${invite.email} revoked`)
            } catch {
                toast.error("Failed to revoke invite")
            }
        })
    }

    const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
        OWNER: "default",
        ADMIN: "default",
        MANAGER: "secondary",
        MEMBER: "outline",
        CONTRACTOR: "outline",
    }

    return (
        <div className="flex items-center gap-3 py-1.5 group">
            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                <span className="text-sm truncate">{invite.email}</span>
                <Badge variant={ROLE_VARIANTS[invite.role] ?? "outline"} className="text-[10px] h-4 px-1.5 shrink-0">
                    {invite.role.charAt(0) + invite.role.slice(1).toLowerCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">expires in {expiresIn}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleCopy}
                >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    {copied ? "Copied" : "Copy Link"}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={handleRevoke}
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                    Revoke
                </Button>
            </div>
        </div>
    )
}

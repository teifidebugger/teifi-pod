"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { changeRole } from "@/app/actions/team"
import { updateManagerPermissions } from "@/app/actions/team"

const ROLES = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "CONTRACTOR"] as const

const ROLE_DESCRIPTIONS: Record<string, string> = {
    OWNER: "Full control including billing access",
    ADMIN: "Full access except billing",
    MANAGER: "Manage team + opt-in permissions below",
    MEMBER: "Track own time only",
    CONTRACTOR: "Track own time, limited access",
}

export function PermissionsForm({ memberId, role, canManageProjects, canEditOthersTime, canSeeRates, isOwner, callerRole }: {
    memberId: string
    role: string
    canManageProjects: boolean
    canEditOthersTime: boolean
    canSeeRates: boolean
    isOwner: boolean
    callerRole: string
}) {
    const [isPending, startTransition] = useTransition()
    const [currentRole, setCurrentRole] = useState(role)
    const [perms, setPerms] = useState({ canManageProjects, canEditOthersTime, canSeeRates })

    function handleRoleChange(newRole: string) {
        startTransition(async () => {
            try {
                await changeRole(memberId, newRole)
                setCurrentRole(newRole)
                toast.success("Role updated")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to update role")
            }
        })
    }

    function handlePermChange(key: keyof typeof perms, value: boolean) {
        const next = { ...perms, [key]: value }
        setPerms(next)
        startTransition(async () => {
            try {
                await updateManagerPermissions(memberId, next)
                toast.success("Permissions updated")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to update permissions")
                setPerms(perms)
            }
        })
    }

    return (
        <div className="space-y-4">
            <Card className="border-sidebar-border">
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Workspace Role
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="max-w-xs space-y-1.5">
                        <Label>Role</Label>
                        <Select value={currentRole} onValueChange={handleRoleChange} disabled={isPending || isOwner}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.filter(r => callerRole === "OWNER" || r !== "OWNER").map(r => (
                                    <SelectItem key={r} value={r}>
                                        {r.charAt(0) + r.slice(1).toLowerCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {isOwner && (
                            <p className="text-xs text-muted-foreground">Workspace owner role cannot be changed.</p>
                        )}
                    </div>

                    <div className="space-y-1 rounded-md border border-sidebar-border bg-sidebar/20 p-3">
                        {ROLES.map(r => (
                            <div key={r} className={`flex gap-2 text-xs py-1 ${r === currentRole ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                <span className="w-24 shrink-0">{r.charAt(0) + r.slice(1).toLowerCase()}</span>
                                <span>{ROLE_DESCRIPTIONS[r]}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {currentRole === "MANAGER" && (
                <Card className="border-sidebar-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Manager Permissions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor={`mp-${memberId}`}>Manage Projects</Label>
                                <p className="text-xs text-muted-foreground">Can create and edit projects</p>
                            </div>
                            <Switch
                                id={`mp-${memberId}`}
                                checked={perms.canManageProjects}
                                onCheckedChange={v => handlePermChange("canManageProjects", v)}
                                disabled={isPending}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor={`et-${memberId}`}>Edit Others&apos; Time</Label>
                                <p className="text-xs text-muted-foreground">Can edit and delete time entries for team members</p>
                            </div>
                            <Switch
                                id={`et-${memberId}`}
                                checked={perms.canEditOthersTime}
                                onCheckedChange={v => handlePermChange("canEditOthersTime", v)}
                                disabled={isPending}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor={`sr-${memberId}`}>See Rates</Label>
                                <p className="text-xs text-muted-foreground">Can view billable rates and cost data in reports</p>
                            </div>
                            <Switch
                                id={`sr-${memberId}`}
                                checked={perms.canSeeRates}
                                onCheckedChange={v => handlePermChange("canSeeRates", v)}
                                disabled={isPending}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

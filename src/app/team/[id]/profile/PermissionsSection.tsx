"use client"

import { useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { updateMemberPermissions } from "@/app/actions/team"

const ROLE_META: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; description: string }> = {
    OWNER: {
        label: "Owner",
        variant: "default",
        description: "Full control over the workspace: manage billing, members, settings, and all data. Cannot be removed.",
    },
    ADMIN: {
        label: "Admin",
        variant: "secondary",
        description: "Can manage members, projects, clients, approve timesheets, and configure workspace settings.",
    },
    MANAGER: {
        label: "Manager",
        variant: "outline",
        description: "Can approve timesheets for their reports and optionally manage projects, view rates, and edit others' time.",
    },
    MEMBER: {
        label: "Member",
        variant: "outline",
        description: "Can track time, log expenses, and view projects they are assigned to.",
    },
    CONTRACTOR: {
        label: "Contractor",
        variant: "outline",
        description: "Like a Member, but classified as a contractor for billing and payroll purposes.",
    },
}

type SelectableRole = "MEMBER" | "CONTRACTOR" | "MANAGER" | "ADMIN"

const SELECTABLE_ROLES: SelectableRole[] = ["MEMBER", "CONTRACTOR", "MANAGER", "ADMIN"]

const ROLE_LABELS: Record<SelectableRole, string> = {
    MEMBER: "Member",
    CONTRACTOR: "Contractor",
    MANAGER: "Manager",
    ADMIN: "Administrator",
}

const ROLE_DESCRIPTIONS: Record<SelectableRole, string> = {
    MEMBER: "Can track time, log expenses, and view their own assigned projects.",
    CONTRACTOR: "Same as Member but classified as contractor — excluded from capacity reports.",
    MANAGER: "Can approve timesheets. Grant additional access with the options below.",
    ADMIN: "Full access to all workspace data, members, projects, and settings.",
}

type ManagerPerms = {
    canManageProjects: boolean
    canEditOthersTime: boolean
    canSeeRates: boolean
    canEditClients: boolean
    canWithdrawApprovals: boolean
}

interface PermissionsSectionProps {
    memberId: string
    callerRole: string
    targetRole: string
    isSelf: boolean
    isAdmin: boolean
    canManageProjects: boolean
    canEditOthersTime: boolean
    canSeeRates: boolean
    canEditClients: boolean
    canWithdrawApprovals: boolean
}

export function PermissionsSection({
    memberId,
    callerRole,
    targetRole,
    isSelf,
    isAdmin,
    canManageProjects,
    canEditOthersTime,
    canSeeRates,
    canEditClients,
    canWithdrawApprovals,
}: PermissionsSectionProps) {
    if (isSelf || !isAdmin) {
        return <ReadOnlyPermissions role={targetRole} />
    }

    return (
        <EditablePermissions
            memberId={memberId}
            initialRole={targetRole}
            initialPerms={{ canManageProjects, canEditOthersTime, canSeeRates, canEditClients, canWithdrawApprovals }}
            isOwner={targetRole === "OWNER"}
        />
    )
}

function ReadOnlyPermissions({ role }: { role: string }) {
    const roleMeta = ROLE_META[role] ?? ROLE_META.MEMBER

    const accessItems = [
        { label: "Track time & log expenses", allowed: true },
        { label: "View assigned projects", allowed: true },
        { label: "Connect Linear account", allowed: true },
        {
            label: "Approve / reject timesheets",
            allowed: ["OWNER", "ADMIN", "MANAGER"].includes(role),
        },
        {
            label: "Manage projects & clients",
            allowed: ["OWNER", "ADMIN"].includes(role),
        },
        {
            label: "Manage team members",
            allowed: ["OWNER", "ADMIN"].includes(role),
        },
        {
            label: "Workspace settings",
            allowed: ["OWNER", "ADMIN"].includes(role),
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold">Permissions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Permissions are assigned by workspace admins and cannot be changed here.
                </p>
            </div>

            <div className="rounded-md border border-sidebar-border p-5 space-y-3 max-w-md">
                <div className="flex items-center gap-2">
                    <Badge variant={roleMeta.variant}>{roleMeta.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{roleMeta.description}</p>
            </div>

            <div className="space-y-2 max-w-md">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Access summary</h4>
                <div className="space-y-1">
                    {accessItems.map(({ label, allowed }) => (
                        <div key={label} className="flex items-center gap-2.5 text-sm py-1">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${allowed ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                            <span className={allowed ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                To request a role change, contact your workspace{" "}
                <a href="/team" className="underline underline-offset-2 hover:text-foreground transition-colors">
                    admin or owner
                </a>
                .
            </p>
        </div>
    )
}

function EditablePermissions({
    memberId,
    initialRole,
    initialPerms,
    isOwner,
}: {
    memberId: string
    initialRole: string
    initialPerms: ManagerPerms
    isOwner: boolean
}) {
    const [isPending, startTransition] = useTransition()

    // Saved state (what's in DB)
    const [savedRole, setSavedRole] = useState(initialRole)
    const [savedPerms, setSavedPerms] = useState(initialPerms)

    // Draft state (what user is editing)
    const [draftRole, setDraftRole] = useState(initialRole)
    const [draftPerms, setDraftPerms] = useState(initialPerms)

    const isDirty =
        draftRole !== savedRole ||
        draftPerms.canManageProjects !== savedPerms.canManageProjects ||
        draftPerms.canEditOthersTime !== savedPerms.canEditOthersTime ||
        draftPerms.canSeeRates !== savedPerms.canSeeRates ||
        draftPerms.canEditClients !== savedPerms.canEditClients ||
        draftPerms.canWithdrawApprovals !== savedPerms.canWithdrawApprovals

    const isUpgradingToManager = savedRole !== "MANAGER" && draftRole === "MANAGER"

    function handleCancel() {
        setDraftRole(savedRole)
        setDraftPerms(savedPerms)
    }

    function handleSave() {
        startTransition(async () => {
            try {
                await updateMemberPermissions(memberId, {
                    role: draftRole,
                    canManageProjects: draftPerms.canManageProjects,
                    canEditOthersTime: draftPerms.canEditOthersTime,
                    canSeeRates: draftPerms.canSeeRates,
                    canEditClients: draftPerms.canEditClients,
                    canWithdrawApprovals: draftPerms.canWithdrawApprovals,
                })
                setSavedRole(draftRole)
                setSavedPerms(draftRole === "MANAGER" ? { ...draftPerms } : { canManageProjects: false, canEditOthersTime: false, canSeeRates: false, canEditClients: false, canWithdrawApprovals: false })
                toast.success("Permissions updated")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to update permissions")
            }
        })
    }

    if (isOwner) {
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold">Permissions</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">This member is the workspace owner.</p>
                </div>
                <div className="rounded-md border border-sidebar-border p-5 max-w-md">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">Owner</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{ROLE_META.OWNER.description}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-xl">
            <div>
                <h3 className="text-sm font-semibold">Permissions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Set this member&apos;s role and access level in the workspace.
                </p>
            </div>

            {/* Role radio buttons */}
            <div className="space-y-2">
                {SELECTABLE_ROLES.map((role) => {
                    const isSelected = draftRole === role
                    return (
                        <button
                            key={role}
                            type="button"
                            onClick={() => setDraftRole(role)}
                            disabled={isPending}
                            className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                                isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-sidebar-border hover:border-muted-foreground/40 hover:bg-muted/30"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                        isSelected ? "border-primary" : "border-muted-foreground/40"
                                    }`}
                                >
                                    {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
                                </span>
                                <div>
                                    <div className="text-sm font-medium">{ROLE_LABELS[role]}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{ROLE_DESCRIPTIONS[role]}</div>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Manager warning */}
            {isUpgradingToManager && (
                <div className="flex items-start gap-3 rounded-lg border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 px-4 py-2.5 text-sm">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-foreground/80">
                        Managers can approve timesheets and access team data based on the permissions below.
                        Choose which additional access to grant before saving.
                    </span>
                </div>
            )}

            {/* Manager sub-permissions */}
            {draftRole === "MANAGER" && (
                <div className="rounded-lg border border-sidebar-border divide-y divide-sidebar-border">
                    <div className="px-4 py-2.5 bg-muted/30">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Manager permissions
                        </span>
                    </div>

                    {([
                        {
                            key: "canManageProjects" as const,
                            label: "Manage projects",
                            description: "Can create and edit projects",
                        },
                        {
                            key: "canEditClients" as const,
                            label: "Manage clients",
                            description: "Can create and edit clients",
                        },
                        {
                            key: "canEditOthersTime" as const,
                            label: "Edit others' time",
                            description: "Can edit and delete time entries for team members",
                        },
                        {
                            key: "canSeeRates" as const,
                            label: "See rates & costs",
                            description: "Can view billable rates and cost data in reports",
                        },
                        {
                            key: "canWithdrawApprovals" as const,
                            label: "Withdraw approvals",
                            description: "Can un-approve timesheets that have already been approved",
                        },
                    ] as const).map(({ key, label, description }) => (
                        <label
                            key={key}
                            className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                        >
                            <Checkbox
                                checked={draftPerms[key]}
                                onCheckedChange={(checked) =>
                                    setDraftPerms((prev) => ({ ...prev, [key]: !!checked }))
                                }
                                disabled={isPending}
                            />
                            <div className="flex-1">
                                <div className="text-sm font-medium">{label}</div>
                                <div className="text-xs text-muted-foreground">{description}</div>
                            </div>
                        </label>
                    ))}
                </div>
            )}

            {/* Save / Cancel */}
            {isDirty && (
                <div className="flex items-center gap-3 pt-1">
                    <Button size="sm" onClick={handleSave} disabled={isPending}>
                        Update permissions
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending}>
                        Cancel
                    </Button>
                </div>
            )}
        </div>
    )
}

"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { updateMyProfile } from "@/app/actions/profile"
import { updateMemberBasicInfo, setMemberManager } from "@/app/actions/team"

const TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Anchorage",
    "America/Vancouver",
    "America/Toronto",
    "America/Sao_Paulo",
    "Pacific/Honolulu",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Amsterdam",
    "Europe/Stockholm",
    "Europe/Madrid",
    "Europe/Rome",
    "Europe/Athens",
    "Europe/Warsaw",
    "Europe/Kyiv",
    "Europe/Moscow",
    "Europe/Istanbul",
    "Asia/Dubai",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Dhaka",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Australia/Sydney",
    "Australia/Melbourne",
    "Australia/Perth",
    "Pacific/Auckland",
]

interface BasicInfoFormProps {
    memberId: string
    userId: string
    firstName: string
    lastName: string
    email: string
    title: string
    teamName: string
    employeeId: string
    isContractor: boolean
    isPrivilegedRole: boolean
    roles: string[]
    availableRoles: string[]
    weeklyCapacityHours: number
    timezone: string
    isSelf: boolean
    isAdmin: boolean
    managerId: string | null
    managerName: string | null
    allManagers: Array<{ id: string; name: string; email: string }>
}

export function BasicInfoForm({
    memberId,
    userId,
    firstName,
    lastName,
    email,
    title,
    teamName,
    employeeId,
    isContractor,
    isPrivilegedRole,
    roles,
    availableRoles,
    weeklyCapacityHours,
    timezone,
    isSelf,
    isAdmin,
    managerId,
    managerName,
    allManagers,
}: BasicInfoFormProps) {
    const [saving, setSaving] = useState(false)
    const [localContractor, setLocalContractor] = useState(isContractor)
    const [localManagerId, setLocalManagerId] = useState<string>(managerId ?? "__none__")
    const [savingManager, setSavingManager] = useState(false)
    const [localTimezone, setLocalTimezone] = useState(timezone || "UTC")
    const [selectedRoles, setSelectedRoles] = useState<string[]>(roles)
    const [roleInput, setRoleInput] = useState("")
    const [showRoleSuggestions, setShowRoleSuggestions] = useState(false)
    const roleInputRef = useRef<HTMLInputElement>(null)
    const roleContainerRef = useRef<HTMLDivElement>(null)

    const filteredRoleSuggestions = availableRoles.filter(
        (r) => !selectedRoles.includes(r) && r.toLowerCase().includes(roleInput.toLowerCase())
    )

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (roleContainerRef.current && !roleContainerRef.current.contains(e.target as Node)) {
                setShowRoleSuggestions(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    function addRole(role: string) {
        const canonical = availableRoles.find((r) => r.toLowerCase() === role.trim().toLowerCase())
        if (canonical && !selectedRoles.includes(canonical)) {
            setSelectedRoles([...selectedRoles, canonical])
        }
        setRoleInput("")
        setShowRoleSuggestions(false)
        roleInputRef.current?.focus()
    }

    function removeRole(role: string) {
        setSelectedRoles(selectedRoles.filter((r) => r !== role))
    }

    function handleRoleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if ((e.key === "Enter" || e.key === ",") && roleInput.trim()) {
            e.preventDefault()
            const exact = availableRoles.find((r) => r.toLowerCase() === roleInput.trim().toLowerCase())
            if (exact) addRole(exact)
            else if (filteredRoleSuggestions.length === 1) addRole(filteredRoleSuggestions[0])
        }
        if (e.key === "Backspace" && !roleInput && selectedRoles.length > 0) {
            removeRole(selectedRoles[selectedRoles.length - 1])
        }
    }

    const canEdit = isSelf || isAdmin
    if (!canEdit) {
        return (
            <div className="space-y-8">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Name</h3>
                        <p className="text-sm text-muted-foreground mt-1">{firstName} {lastName}</p>
                    </div>
                </div>
                <Separator className="border-sidebar-border" />
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Work email</h3>
                        <p className="text-sm text-muted-foreground mt-1">{email}</p>
                    </div>
                </div>
                {title && (
                    <>
                        <Separator className="border-sidebar-border" />
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Title</h3>
                                <p className="text-sm text-muted-foreground mt-1">{title}</p>
                            </div>
                        </div>
                    </>
                )}
                {teamName && (
                    <>
                        <Separator className="border-sidebar-border" />
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Department</h3>
                                <p className="text-sm text-muted-foreground mt-1">{teamName}</p>
                            </div>
                        </div>
                    </>
                )}
                {timezone && (
                    <>
                        <Separator className="border-sidebar-border" />
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Timezone</h3>
                                <p className="text-sm text-muted-foreground mt-1">{timezone.replace(/_/g, " ")}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        )
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        const fd = new FormData(e.currentTarget)

        try {
            if (isSelf) {
                await updateMyProfile({
                    firstName: (fd.get("firstName") as string) || "",
                    lastName: (fd.get("lastName") as string) || "",
                    employeeId: (fd.get("employeeId") as string) || "",
                    isContractor: localContractor,
                    roles: selectedRoles,
                    weeklyCapacityHours: Number(fd.get("weeklyCapacityHours")) || 40,
                    timezone: localTimezone,
                    title: (fd.get("title") as string) || "",
                    teamName: (fd.get("teamName") as string) || "",
                })
            } else {
                await updateMemberBasicInfo(memberId, {
                    title: (fd.get("title") as string) || null,
                    teamName: (fd.get("teamName") as string) || null,
                    employeeId: (fd.get("employeeId") as string) || null,
                    timezone: localTimezone,
                    weeklyCapacityHours: parseFloat((fd.get("weeklyCapacityHours") as string) || "40") || 40,
                })
            }
            toast.success("Profile updated")
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to save profile")
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Name</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {isSelf ? "Your display name across Teifi Time" : "Display name (only editable by the member themselves)"}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-xs">First name</Label>
                        <Input
                            id="firstName"
                            name="firstName"
                            defaultValue={firstName}
                            placeholder="Jane"
                            className="h-9"
                            disabled={!isSelf}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-xs">Last name</Label>
                        <Input
                            id="lastName"
                            name="lastName"
                            defaultValue={lastName}
                            placeholder="Smith"
                            className="h-9"
                            disabled={!isSelf}
                        />
                    </div>
                </div>
            </div>

            <Separator className="border-sidebar-border" />

            {/* Work email */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Work email</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Managed by Google account — cannot be changed here</p>
                </div>
                <Input value={email} disabled className="h-9 bg-muted/50 text-muted-foreground" />
            </div>

            <Separator className="border-sidebar-border" />

            {/* Employment details */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Employment</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Role classification and internal identifiers</p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="employeeId" className="text-xs">Employee ID</Label>
                    <Input
                        id="employeeId"
                        name="employeeId"
                        defaultValue={employeeId}
                        placeholder="EMP-001"
                        className="h-9 max-w-xs"
                        disabled={!isSelf && !isAdmin}
                    />
                </div>

                {/* Type toggle: admin can toggle for others; self can toggle if not privileged */}
                {(isAdmin && !isSelf) ? (
                    <div className="space-y-1.5">
                        <Label className="text-xs">Type</Label>
                        <div className="flex rounded-md border border-sidebar-border overflow-hidden w-fit">
                            <button
                                type="button"
                                onClick={() => setLocalContractor(false)}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${
                                    !localContractor
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                Employee
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocalContractor(true)}
                                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-sidebar-border ${
                                    localContractor
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                Contractor
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {localContractor
                                ? "Contractors are billed at their personal rate and excluded from payroll reports."
                                : "Employees appear in capacity planning and team utilization reports."}
                        </p>
                    </div>
                ) : isSelf && !isPrivilegedRole ? (
                    <div className="space-y-1.5">
                        <Label className="text-xs">Type</Label>
                        <div className="flex rounded-md border border-sidebar-border overflow-hidden w-fit">
                            <button
                                type="button"
                                onClick={() => setLocalContractor(false)}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${
                                    !localContractor
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                Employee
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocalContractor(true)}
                                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-sidebar-border ${
                                    localContractor
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                Contractor
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {localContractor
                                ? "Contractors are billed at their personal rate and excluded from payroll reports."
                                : "Employees appear in capacity planning and team utilization reports."}
                        </p>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground italic">
                        Employment type is managed by workspace admins.
                    </p>
                )}
            </div>

            <Separator className="border-sidebar-border" />

            {/* Roles & skills */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Skills &amp; guilds</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Select from the workspace guild catalog.{" "}
                        <a href="/schedule/roles" className="underline hover:text-foreground">Manage guilds</a>.
                    </p>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Skill tags</Label>
                    <div ref={roleContainerRef} className="relative">
                        <div
                            className="flex flex-wrap gap-1.5 min-h-[36px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                            onClick={() => { if (canEdit) roleInputRef.current?.focus() }}
                        >
                            {selectedRoles.map((role) => (
                                <Badge
                                    key={role}
                                    variant="outline"
                                    className="border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 gap-1 h-6"
                                >
                                    {role}
                                    {(isSelf || isAdmin) && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeRole(role) }}
                                            className="ml-0.5 hover:text-amber-900 dark:hover:text-amber-100"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </Badge>
                            ))}
                            {(isSelf || isAdmin) && (
                                <input
                                    ref={roleInputRef}
                                    type="text"
                                    className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
                                    value={roleInput}
                                    onChange={(e) => { setRoleInput(e.target.value); setShowRoleSuggestions(true) }}
                                    onFocus={() => setShowRoleSuggestions(true)}
                                    onKeyDown={handleRoleKeyDown}
                                    placeholder={selectedRoles.length === 0 ? (availableRoles.length === 0 ? "No guilds in catalog yet" : "Type to search guilds...") : ""}
                                />
                            )}
                        </div>
                        {showRoleSuggestions && filteredRoleSuggestions.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md max-h-40 overflow-y-auto">
                                {filteredRoleSuggestions.map((role) => (
                                    <button
                                        key={role}
                                        type="button"
                                        className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                                        onMouseDown={(e) => { e.preventDefault(); addRole(role) }}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Separator className="border-sidebar-border" />

            {/* Capacity & timezone */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Capacity &amp; location</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Used for scheduling and capacity planning</p>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                    <div className="space-y-1.5">
                        <Label htmlFor="weeklyCapacityHours" className="text-xs">Weekly capacity (hours)</Label>
                        <Input
                            id="weeklyCapacityHours"
                            name="weeklyCapacityHours"
                            type="number"
                            min={0.5}
                            max={168}
                            step={0.5}
                            defaultValue={weeklyCapacityHours}
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Timezone</Label>
                        <Select value={localTimezone} onValueChange={setLocalTimezone}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                                {TIMEZONES.map((tz) => (
                                    <SelectItem key={tz} value={tz}>
                                        {tz.replace(/_/g, " ")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <Separator className="border-sidebar-border" />

            {/* Title & department */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Title &amp; department</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Shown in team directory and reports</p>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                    <div className="space-y-1.5">
                        <Label htmlFor="title" className="text-xs">Job title</Label>
                        <Input
                            id="title"
                            name="title"
                            defaultValue={title}
                            placeholder="Senior Engineer"
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="teamName" className="text-xs">Department / squad</Label>
                        <Input
                            id="teamName"
                            name="teamName"
                            defaultValue={teamName}
                            placeholder="Engineering"
                            className="h-9"
                        />
                    </div>
                </div>
            </div>

            {/* Reports to — admin only, not for self */}
            {isAdmin && !isSelf && (
                <>
                    <Separator className="border-sidebar-border" />
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Reports to</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                The manager this person reports to in the org hierarchy
                            </p>
                        </div>
                        <div className="flex items-center gap-3 max-w-sm">
                            <Select value={localManagerId} onValueChange={setLocalManagerId}>
                                <SelectTrigger className="h-9 flex-1">
                                    <SelectValue placeholder="No manager assigned" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">— No manager —</SelectItem>
                                    {allManagers.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                size="sm"
                                disabled={savingManager}
                                onClick={async () => {
                                    setSavingManager(true)
                                    try {
                                        await setMemberManager(
                                            memberId,
                                            localManagerId === "__none__" ? null : localManagerId
                                        )
                                        toast.success("Manager updated")
                                    } catch (err: unknown) {
                                        toast.error(err instanceof Error ? err.message : "Failed to update manager")
                                    } finally {
                                        setSavingManager(false)
                                    }
                                }}
                            >
                                {savingManager && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                                Save
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Read-only manager display for self */}
            {isSelf && managerName && (
                <>
                    <Separator className="border-sidebar-border" />
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Reports to</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{managerName}</p>
                    </div>
                </>
            )}

            <div className="pt-2">
                <Button type="submit" disabled={saving} size="sm">
                    {saving && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                    Save changes
                </Button>
            </div>
        </form>
    )
}

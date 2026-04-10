"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, CalendarOff, UserMinus } from "lucide-react"
import { toast } from "sonner"
import {
    createWorkspaceHoliday,
    deleteWorkspaceHoliday,
    createMemberTimeOff,
    deleteMemberTimeOff,
} from "@/app/actions/holidays"

type Holiday = { id: string; name: string; date: string }
type Member = { id: string; name: string }
type TimeOffEntry = { id: string; memberId: string; date: string; reason: string | null }

type HolidayManagerProps = {
    holidays: Holiday[]
    members: Member[]
    timeOff: TimeOffEntry[]
    currentMemberId: string
    canManage: boolean
    isAdmin: boolean
}

export function HolidayManager({
    holidays,
    members,
    timeOff,
    currentMemberId,
    canManage,
    isAdmin,
}: HolidayManagerProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CompanyHolidays holidays={holidays} isAdmin={isAdmin} />
            <TeamTimeOff
                members={members}
                timeOff={timeOff}
                currentMemberId={currentMemberId}
                canManage={canManage}
            />
        </div>
    )
}

// ─── Company Holidays ────────────────────────────────────────────────────────

function CompanyHolidays({ holidays, isAdmin }: { holidays: Holiday[]; isAdmin: boolean }) {
    const [name, setName] = useState("")
    const [date, setDate] = useState("")
    const [isPending, startTransition] = useTransition()

    function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim() || !date) {
            toast.error("Name and date are required")
            return
        }
        startTransition(async () => {
            try {
                await createWorkspaceHoliday({ name: name.trim(), date })
                setName("")
                setDate("")
                toast.success("Holiday added")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to add holiday")
            }
        })
    }

    return (
        <Card className="border-sidebar-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarOff className="h-5 w-5 text-muted-foreground" />
                    Company Holidays
                </CardTitle>
                <CardDescription>
                    Days the entire company is off. These are excluded from capacity and scheduling.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {holidays.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        No holidays added yet.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {holidays.map((h) => (
                            <HolidayRow key={h.id} holiday={h} isAdmin={isAdmin} />
                        ))}
                    </div>
                )}

                {isAdmin && (
                    <form onSubmit={handleAdd} className="space-y-3 pt-2 border-t border-sidebar-border">
                        <div className="text-sm font-medium pt-2">Add Holiday</div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="holiday-name" className="text-xs">Name</Label>
                                <Input
                                    id="holiday-name"
                                    placeholder="e.g. Christmas Day"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="holiday-date" className="text-xs">Date</Label>
                                <Input
                                    id="holiday-date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" size="sm" disabled={isPending}>
                            <Plus className="h-4 w-4 mr-1" />
                            {isPending ? "Adding..." : "Add Holiday"}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}

function HolidayRow({ holiday, isAdmin }: { holiday: Holiday; isAdmin: boolean }) {
    const [isPending, startTransition] = useTransition()

    function handleDelete() {
        startTransition(async () => {
            try {
                await deleteWorkspaceHoliday(holiday.id)
                toast.success("Holiday removed")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to remove holiday")
            }
        })
    }

    return (
        <div className="flex items-center justify-between px-3 py-2 rounded-md border border-sidebar-border bg-sidebar/30">
            <div>
                <span className="text-sm font-medium">{holiday.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{holiday.date}</span>
            </div>
            {isAdmin && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={handleDelete}
                    disabled={isPending}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    )
}

// ─── Team Time Off ───────────────────────────────────────────────────────────

function TeamTimeOff({
    members,
    timeOff,
    currentMemberId,
    canManage,
}: {
    members: Member[]
    timeOff: TimeOffEntry[]
    currentMemberId: string
    canManage: boolean
}) {
    const [selectedMemberId, setSelectedMemberId] = useState(canManage ? "__none__" : currentMemberId)
    const [date, setDate] = useState("")
    const [reason, setReason] = useState("")
    const [isPending, startTransition] = useTransition()

    const effectiveMemberId = selectedMemberId === "__none__" ? "" : selectedMemberId
    const filteredTimeOff = effectiveMemberId
        ? timeOff.filter((t) => t.memberId === effectiveMemberId)
        : []

    const memberName = members.find((m) => m.id === effectiveMemberId)?.name ?? ""

    function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!effectiveMemberId || !date) {
            toast.error("Please select a member and date")
            return
        }
        startTransition(async () => {
            try {
                await createMemberTimeOff({
                    memberId: effectiveMemberId,
                    date,
                    reason: reason.trim() || undefined,
                })
                setDate("")
                setReason("")
                toast.success("Time off added")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to add time off")
            }
        })
    }

    // Determine which members the user can manage
    const selectableMembers = canManage ? members : members.filter((m) => m.id === currentMemberId)

    return (
        <Card className="border-sidebar-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserMinus className="h-5 w-5 text-muted-foreground" />
                    Team Time Off
                </CardTitle>
                <CardDescription>
                    Individual days off for team members (vacation, sick leave, personal days).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <Label className="text-xs">Team Member</Label>
                    <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a team member..." />
                        </SelectTrigger>
                        <SelectContent>
                            {canManage && (
                                <SelectItem value="__none__">Select a member...</SelectItem>
                            )}
                            {selectableMembers.map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {effectiveMemberId && (
                    <>
                        {filteredTimeOff.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-3 text-center">
                                No time off scheduled for {memberName}.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {filteredTimeOff.map((t) => (
                                    <TimeOffRow
                                        key={t.id}
                                        entry={t}
                                        canDelete={canManage || t.memberId === currentMemberId}
                                    />
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleAdd} className="space-y-3 pt-2 border-t border-sidebar-border">
                            <div className="text-sm font-medium pt-2">Add Day Off</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label htmlFor="timeoff-date" className="text-xs">Date</Label>
                                    <Input
                                        id="timeoff-date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="timeoff-reason" className="text-xs">Reason (optional)</Label>
                                    <Input
                                        id="timeoff-reason"
                                        placeholder="e.g. Vacation"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button type="submit" size="sm" disabled={isPending}>
                                <Plus className="h-4 w-4 mr-1" />
                                {isPending ? "Adding..." : "Add Day Off"}
                            </Button>
                        </form>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

function TimeOffRow({ entry, canDelete }: { entry: TimeOffEntry; canDelete: boolean }) {
    const [isPending, startTransition] = useTransition()

    function handleDelete() {
        startTransition(async () => {
            try {
                await deleteMemberTimeOff(entry.id)
                toast.success("Time off removed")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to remove time off")
            }
        })
    }

    return (
        <div className="flex items-center justify-between px-3 py-2 rounded-md border border-sidebar-border bg-sidebar/30">
            <div>
                <span className="text-sm font-medium">{entry.date}</span>
                {entry.reason && (
                    <span className="text-xs text-muted-foreground ml-2">{entry.reason}</span>
                )}
            </div>
            {canDelete && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={handleDelete}
                    disabled={isPending}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    )
}

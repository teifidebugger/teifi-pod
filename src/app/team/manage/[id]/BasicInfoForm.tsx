"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateMemberBasicInfo } from "@/app/actions/team"

const TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Vancouver",
    "America/Toronto",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Amsterdam",
    "Europe/Stockholm",
    "Europe/Warsaw",
    "Europe/Kyiv",
    "Europe/Moscow",
    "Asia/Dubai",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Australia/Sydney",
    "Australia/Melbourne",
    "Pacific/Auckland",
]

export function BasicInfoForm({
    memberId, title, teamName, employeeId, timezone, weeklyCapacityHours, role,
}: {
    memberId: string
    title: string | null
    teamName: string | null
    employeeId: string | null
    timezone: string | null
    weeklyCapacityHours: number
    role: string
}) {
    const [isPending, startTransition] = useTransition()
    const [tz, setTz] = useState(timezone ?? "UTC")

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
            try {
                await updateMemberBasicInfo(memberId, {
                    title: (fd.get("title") as string) || null,
                    teamName: (fd.get("teamName") as string) || null,
                    employeeId: (fd.get("employeeId") as string) || null,
                    timezone: tz,
                    weeklyCapacityHours: parseFloat((fd.get("weeklyCapacityHours") as string) || "40") || 40,
                })
                toast.success("Profile updated")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to update profile")
            }
        })
    }

    const memberType = role === "CONTRACTOR" ? "Contractor" : "Employee"

    return (
        <form onSubmit={handleSubmit}>
            <Card className="border-sidebar-border">
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Basic Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="title">Job Title</Label>
                            <Input id="title" name="title" defaultValue={title ?? ""} placeholder="e.g. Senior Engineer" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="teamName">Department / Team</Label>
                            <Input id="teamName" name="teamName" defaultValue={teamName ?? ""} placeholder="e.g. Engineering" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="employeeId">Employee ID</Label>
                            <Input id="employeeId" name="employeeId" defaultValue={employeeId ?? ""} placeholder="Optional" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Type</Label>
                            <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/30 text-sm text-muted-foreground">
                                {memberType}
                                <span className="ml-1.5 text-xs opacity-60">(change via Permissions)</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Timezone</Label>
                            <Select value={tz} onValueChange={setTz}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIMEZONES.map(t => (
                                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="weeklyCapacityHours">Weekly Capacity (hours)</Label>
                            <Input
                                id="weeklyCapacityHours"
                                name="weeklyCapacityHours"
                                type="number"
                                min="0.5"
                                max="168"
                                step="0.5"
                                defaultValue={weeklyCapacityHours}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" size="sm" disabled={isPending}>
                            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}

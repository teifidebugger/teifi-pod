"use client"

import { useState } from "react"
import { updateWorkspaceSettings } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface WorkspaceData {
    id: string
    name: string
    currency: string
    timeFormat: string
    weekStartDay: number
    requireTimeEntryNotes: boolean
    timeRounding: number
    defaultCapacityHours: number
    timerMode: string
    reminderEnabled: boolean
    reminderTime: string
    reminderDays: string
    energyTrackingEnabled: boolean
}

interface Props {
    workspace: WorkspaceData
    isAdmin: boolean
}

export function WorkspaceSettingsForm({ workspace, isAdmin }: Props) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(workspace.name)
    const [currency, setCurrency] = useState(workspace.currency)
    const [timeFormat, setTimeFormat] = useState(workspace.timeFormat)
    const [weekStartDay, setWeekStartDay] = useState(workspace.weekStartDay.toString())
    const [requireTimeEntryNotes, setRequireTimeEntryNotes] = useState(workspace.requireTimeEntryNotes)
    const [timeRounding, setTimeRounding] = useState(workspace.timeRounding.toString())
    const [defaultCapacityHours, setDefaultCapacityHours] = useState(workspace.defaultCapacityHours.toString())
    const [timerMode, setTimerMode] = useState(workspace.timerMode)
    const [reminderEnabled, setReminderEnabled] = useState(workspace.reminderEnabled)
    const [reminderTime, setReminderTime] = useState(workspace.reminderTime)
    const [reminderDays, setReminderDays] = useState<number[]>(
        workspace.reminderDays.split(",").map(Number).filter((n) => !isNaN(n))
    )
    const [energyTrackingEnabled, setEnergyTrackingEnabled] = useState(workspace.energyTrackingEnabled)

    function toggleReminderDay(day: number) {
        setReminderDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
        )
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!isAdmin) return
        setLoading(true)
        try {
            await updateWorkspaceSettings({
                name: name.trim() || undefined,
                currency,
                timeFormat,
                weekStartDay: parseInt(weekStartDay, 10),
                requireTimeEntryNotes,
                timeRounding: parseInt(timeRounding, 10),
                defaultCapacityHours: parseFloat(defaultCapacityHours) || 40,
                timerMode,
                reminderEnabled,
                reminderTime,
                reminderDays: reminderDays.join(","),
                energyTrackingEnabled,
            })
            toast.success("Workspace settings saved")
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to save settings")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-sidebar-border">
            <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>
                    {isAdmin
                        ? "Update workspace name, currency, and display preferences."
                        : "These settings are managed by your workspace admin."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="ws-name">Workspace Name</Label>
                        <Input
                            id="ws-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={!isAdmin}
                            placeholder="My Agency"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={currency} onValueChange={setCurrency} disabled={!isAdmin}>
                                <SelectTrigger id="currency">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                                    <SelectItem value="GBP">GBP — British Pound</SelectItem>
                                    <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
                                    <SelectItem value="CAD">CAD — Canadian Dollar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="timeFormat">Time Format</Label>
                            <Select value={timeFormat} onValueChange={setTimeFormat} disabled={!isAdmin}>
                                <SelectTrigger id="timeFormat">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="decimal">Decimal (1.50 hrs)</SelectItem>
                                    <SelectItem value="hours_minutes">Hours &amp; minutes (1h 30m)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="weekStartDay">Week Starts On</Label>
                            <Select value={weekStartDay} onValueChange={setWeekStartDay} disabled={!isAdmin}>
                                <SelectTrigger id="weekStartDay">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Monday</SelectItem>
                                    <SelectItem value="0">Sunday</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="timeRounding">Time Rounding</Label>
                            <Select value={timeRounding} onValueChange={setTimeRounding} disabled={!isAdmin}>
                                <SelectTrigger id="timeRounding">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Off</SelectItem>
                                    <SelectItem value="6">Round to 6 min</SelectItem>
                                    <SelectItem value="15">Round to 15 min</SelectItem>
                                    <SelectItem value="30">Round to 30 min</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="defaultCapacity">Default Weekly Capacity</Label>
                            <Input
                                id="defaultCapacity"
                                type="number"
                                min="0"
                                max="168"
                                step="0.5"
                                value={defaultCapacityHours}
                                onChange={e => setDefaultCapacityHours(e.target.value)}
                                disabled={!isAdmin}
                            />
                            <p className="text-xs text-muted-foreground">Default hours per week for new members.</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Timer Mode</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={timerMode === "duration" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTimerMode("duration")}
                                disabled={!isAdmin}
                                className="flex-1"
                            >
                                Duration only
                            </Button>
                            <Button
                                type="button"
                                variant={timerMode === "start_end" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTimerMode("start_end")}
                                disabled={!isAdmin}
                                className="flex-1"
                            >
                                Start & end times
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-sidebar-border divide-y divide-sidebar-border">
                        <div className="flex items-center justify-between px-3 py-2.5">
                            <div>
                                <Label htmlFor="requireNotes" className="text-sm font-medium">Require time entry notes</Label>
                                <p className="text-xs text-muted-foreground mt-0.5">Add a note to every time entry.</p>
                            </div>
                            <Switch
                                id="requireNotes"
                                checked={requireTimeEntryNotes}
                                onCheckedChange={setRequireTimeEntryNotes}
                                disabled={!isAdmin}
                            />
                        </div>
                        <div className="flex items-center justify-between px-3 py-2.5">
                            <div>
                                <Label htmlFor="energyTracking" className="text-sm font-medium">Energy Level Tracking</Label>
                                <p className="text-xs text-muted-foreground mt-0.5">Show energy picker when logging time.</p>
                            </div>
                            <Switch
                                id="energyTracking"
                                checked={energyTrackingEnabled}
                                onCheckedChange={setEnergyTrackingEnabled}
                                disabled={!isAdmin}
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between px-3 py-2.5">
                                <div>
                                    <Label htmlFor="reminderEnabled" className="text-sm font-medium">Automated reminders</Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">Email members who haven&apos;t logged time today.</p>
                                </div>
                                <Switch
                                    id="reminderEnabled"
                                    checked={reminderEnabled}
                                    onCheckedChange={setReminderEnabled}
                                    disabled={!isAdmin}
                                />
                            </div>
                            {reminderEnabled && (
                                <div className="px-3 pb-3 space-y-3 border-t border-sidebar-border bg-muted/20">
                                    <div className="grid grid-cols-2 gap-3 pt-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="reminderTime" className="text-xs">Send at (24h)</Label>
                                            <Input
                                                id="reminderTime"
                                                type="time"
                                                value={reminderTime}
                                                onChange={(e) => setReminderTime(e.target.value)}
                                                disabled={!isAdmin}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Days</Label>
                                            <div className="flex gap-1 flex-wrap">
                                                {[
                                                    { day: 1, label: "Mon" },
                                                    { day: 2, label: "Tue" },
                                                    { day: 3, label: "Wed" },
                                                    { day: 4, label: "Thu" },
                                                    { day: 5, label: "Fri" },
                                                    { day: 6, label: "Sat" },
                                                    { day: 0, label: "Sun" },
                                                ].map(({ day, label }) => (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => toggleReminderDay(day)}
                                                        disabled={!isAdmin}
                                                        className={`px-2 py-0.5 rounded text-xs border transition-colors disabled:opacity-50 ${
                                                            reminderDays.includes(day)
                                                                ? "bg-primary text-primary-foreground border-primary"
                                                                : "border-input text-muted-foreground hover:text-foreground"
                                                        }`}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {isAdmin && (
                        <div>
                            <Button type="submit" size="sm" disabled={loading}>
                                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                                Save Settings
                            </Button>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}

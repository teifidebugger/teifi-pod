"use client"

import { useTransition, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { updateHiddenNavItems } from "@/app/actions"

// All hideable nav items grouped for display — must stay in sync with app-sidebar.tsx
const HIDEABLE_GROUPS: { label: string; items: { key: string; title: string }[] }[] = [
    {
        label: "Work",
        items: [
            { key: "time", title: "Time Tracking" },
            { key: "approvals", title: "Approvals" },
        ],
    },
    {
        label: "Delivery",
        items: [
            { key: "projects", title: "Projects" },
            { key: "tasks", title: "Task Groups" },
            { key: "planning", title: "Planning" },
            { key: "schedule", title: "Schedule" },
            { key: "estimation", title: "Estimation" },
        ],
    },
    {
        label: "Resources",
        items: [
            { key: "team-overview", title: "Members" },
            { key: "roles", title: "Guilds" },
            { key: "placeholders", title: "Placeholders" },
            { key: "holidays", title: "Holidays & Time Off" },
        ],
    },
    {
        label: "Clients",
        items: [
            { key: "clients", title: "Clients" },
            { key: "onboard-client", title: "Onboard Client" },
            { key: "uat-management", title: "Setup UAT Portal" },
        ],
    },
    {
        label: "Reports",
        items: [
            { key: "reports", title: "Time Report" },
            { key: "utilization", title: "Utilization" },
            { key: "capacity", title: "Capacity" },
            { key: "linear-allocation", title: "Schedule vs Linear" },
            { key: "portal-analytics", title: "Portal Analytics" },
        ],
    },
]

const UAT_PORTAL_HIDDEN = ["time", "approvals", "planning", "schedule", "estimation", "roles", "placeholders", "holidays", "reports", "utilization", "capacity", "linear-allocation", "tasks"]

interface Props {
    isAdmin: boolean
    saved: string[]
}

export function SidebarVisibilitySettings({ isAdmin, saved }: Props) {
    const [hidden, setHidden] = useState<Set<string>>(new Set(saved))
    const [isPending, startTransition] = useTransition()

    function toggle(key: string) {
        if (!isAdmin) return
        setHidden(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    function applyUATPortalMode() {
        if (!isAdmin) return
        setHidden(new Set(UAT_PORTAL_HIDDEN))
    }

    function handleSave() {
        startTransition(async () => {
            try {
                await updateHiddenNavItems(Array.from(hidden))
                toast.success("Navigation visibility saved")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to save")
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Navigation Visibility</CardTitle>
                <CardDescription>
                    Choose which sidebar items are hidden for all workspace members. Hidden items are still accessible via direct URL.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {HIDEABLE_GROUPS.map(group => (
                    <div key={group.label}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{group.label}</p>
                        <div className="grid grid-cols-2 gap-2">
                            {group.items.map(item => (
                                <div key={item.key} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`nav-${item.key}`}
                                        checked={hidden.has(item.key)}
                                        onCheckedChange={() => toggle(item.key)}
                                        disabled={!isAdmin}
                                    />
                                    <Label htmlFor={`nav-${item.key}`} className="text-sm font-normal cursor-pointer">
                                        {item.title}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {isAdmin && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button onClick={handleSave} disabled={isPending} size="sm">
                            {isPending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                            Save
                        </Button>
                        <Button variant="outline" size="sm" onClick={applyUATPortalMode} disabled={isPending}>
                            Apply UAT Portal Mode
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

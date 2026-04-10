"use client"

import { useTransition, useState, useMemo } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RotateCcw, Loader2 } from "lucide-react"
import {
    UAT_COLUMNS,
    DEFAULT_CLIENT_TRANSITIONS,
    DEFAULT_STAFF_TRANSITIONS,
    CLIENT_FROM_COLUMNS,
    CLIENT_TO_COLUMNS,
    STAFF_FROM_COLUMNS,
    STAFF_TO_COLUMNS,
    type AllowedTransitions,
    type UATColumn,
} from "@/lib/uat-mapping"
import { updateWorkspaceDefaultTransitions, updateWorkspaceStaffDefaultTransitions } from "@/app/actions/portal-admin"
import { TransitionRulesMatrix } from "@/components/portal/TransitionRulesMatrix"

function useTransitionState(saved: AllowedTransitions | null, defaultTransitions: AllowedTransitions, fromColumns: UATColumn[]) {
    const initial = useMemo<AllowedTransitions>(() => {
        if (saved && typeof saved === "object") return saved as AllowedTransitions
        return defaultTransitions
    }, [saved, defaultTransitions])

    const [transitions, setTransitions] = useState<AllowedTransitions>(() => {
        const copy: AllowedTransitions = {}
        for (const from of fromColumns) copy[from] = [...(initial[from] ?? [])]
        return copy
    })

    const isDefault = useMemo(() => {
        for (const from of fromColumns) {
            const cur = [...(transitions[from] ?? [])].sort()
            const def = [...(defaultTransitions[from] ?? [])].sort()
            if (cur.length !== def.length || cur.some((v, i) => v !== def[i])) return false
        }
        return true
    }, [transitions, fromColumns, defaultTransitions])

    const hasChanges = useMemo(() => {
        for (const from of fromColumns) {
            const cur = [...(transitions[from] ?? [])].sort()
            const ini = [...(initial[from] ?? [])].sort()
            if (cur.length !== ini.length || cur.some((v, i) => v !== ini[i])) return true
        }
        return false
    }, [transitions, initial, fromColumns])

    function toggle(from: UATColumn, to: UATColumn) {
        setTransitions(prev => {
            const next = { ...prev }
            const list = [...(next[from] ?? [])]
            const idx = list.indexOf(to)
            if (idx >= 0) list.splice(idx, 1)
            else list.push(to)
            next[from] = list
            return next
        })
    }

    function resetToDefault() {
        const copy: AllowedTransitions = {}
        for (const from of fromColumns) copy[from] = [...(defaultTransitions[from] ?? [])]
        setTransitions(copy)
    }

    return { transitions, toggle, isDefault, hasChanges, resetToDefault }
}

interface Props {
    isAdmin: boolean
    savedClient: AllowedTransitions | null
    savedStaff: AllowedTransitions | null
}

export function PortalTransitionCombined({ isAdmin, savedClient, savedStaff }: Props) {
    const client = useTransitionState(savedClient, DEFAULT_CLIENT_TRANSITIONS, CLIENT_FROM_COLUMNS as UATColumn[])
    const staff = useTransitionState(savedStaff, DEFAULT_STAFF_TRANSITIONS, STAFF_FROM_COLUMNS as UATColumn[])
    const [isPending, startTransition] = useTransition()

    function saveClient() {
        startTransition(async () => {
            try {
                await updateWorkspaceDefaultTransitions(client.transitions)
                toast.success("Client transition defaults saved")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save")
            }
        })
    }

    function resetClient() {
        startTransition(async () => {
            try {
                await updateWorkspaceDefaultTransitions(null)
                client.resetToDefault()
                toast.success("Reset to built-in defaults")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to reset")
            }
        })
    }

    function saveStaff() {
        startTransition(async () => {
            try {
                await updateWorkspaceStaffDefaultTransitions(staff.transitions)
                toast.success("Staff transition defaults saved")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save")
            }
        })
    }

    function resetStaff() {
        startTransition(async () => {
            try {
                await updateWorkspaceStaffDefaultTransitions(null)
                staff.resetToDefault()
                toast.success("Reset to built-in defaults")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to reset")
            }
        })
    }

    return (
        <Card className="border-sidebar-border">
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle>Portal — Default Transition Rules</CardTitle>
                        <CardDescription className="mt-0.5">
                            Which column moves portal users can make by default.
                            Teams can override in{" "}
                            <span className="font-mono text-xs">Settings → Portal → [Team]</span>.
                        </CardDescription>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                        {!client.isDefault && <Badge variant="secondary" className="text-xs">Client custom</Badge>}
                        {!staff.isDefault && <Badge variant="secondary" className="text-xs">Staff custom</Badge>}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="client">
                    <TabsList className="h-8 mb-4">
                        <TabsTrigger value="client" className="text-xs h-6 px-3">
                            Client moves
                            {!client.isDefault && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
                        </TabsTrigger>
                        <TabsTrigger value="staff" className="text-xs h-6 px-3">
                            Staff moves
                            {!staff.isDefault && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="client" className="space-y-4 mt-0">
                        <TransitionRulesMatrix
                            fromColumns={CLIENT_FROM_COLUMNS}
                            toColumns={CLIENT_TO_COLUMNS}
                            transitions={client.transitions}
                            onChange={client.toggle}
                            disabled={!isAdmin || isPending}
                            columns={UAT_COLUMNS}
                        />
                        {isAdmin && (
                            <div className="flex items-center justify-between">
                                <Button type="button" variant="ghost" size="sm" onClick={resetClient}
                                    disabled={isPending || client.isDefault} className="text-muted-foreground gap-1.5">
                                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                    Reset to defaults
                                </Button>
                                <Button size="sm" onClick={saveClient} disabled={isPending || !client.hasChanges}>
                                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                    Save
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="staff" className="space-y-4 mt-0">
                        <TransitionRulesMatrix
                            fromColumns={STAFF_FROM_COLUMNS}
                            toColumns={STAFF_TO_COLUMNS}
                            transitions={staff.transitions}
                            onChange={staff.toggle}
                            disabled={!isAdmin || isPending}
                            columns={UAT_COLUMNS}
                            actor="staff"
                        />
                        {isAdmin && (
                            <div className="flex items-center justify-between">
                                <Button type="button" variant="ghost" size="sm" onClick={resetStaff}
                                    disabled={isPending || staff.isDefault} className="text-muted-foreground gap-1.5">
                                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                    Reset to defaults
                                </Button>
                                <Button size="sm" onClick={saveStaff} disabled={isPending || !staff.hasChanges}>
                                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                    Save
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

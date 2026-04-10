"use client"

import { useTransition, useState, useMemo } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Loader2, ShieldCheck } from "lucide-react"
import {
    UAT_COLUMNS,
    DEFAULT_STAFF_TRANSITIONS,
    STAFF_FROM_COLUMNS,
    STAFF_TO_COLUMNS,
    type AllowedTransitions,
    type UATColumn,
} from "@/lib/uat-mapping"
import { updateWorkspaceStaffDefaultTransitions } from "@/app/actions/portal-admin"
import { TransitionRulesMatrix } from "@/components/portal/TransitionRulesMatrix"

interface Props {
    isAdmin: boolean
    saved: AllowedTransitions | null
}

export function PortalStaffTransitionDefaults({ isAdmin, saved }: Props) {
    const initial = useMemo<AllowedTransitions>(() => {
        if (saved && typeof saved === "object") return saved as AllowedTransitions
        return DEFAULT_STAFF_TRANSITIONS
    }, [saved])

    const [isPending, startTransition] = useTransition()
    const [transitions, setTransitions] = useState<AllowedTransitions>(() => {
        const copy: AllowedTransitions = {}
        for (const from of STAFF_FROM_COLUMNS) {
            copy[from] = [...(initial[from] ?? [])]
        }
        return copy
    })

    const isDefault = useMemo(() => {
        for (const from of STAFF_FROM_COLUMNS) {
            const cur = [...(transitions[from] ?? [])].sort()
            const def = [...(DEFAULT_STAFF_TRANSITIONS[from] ?? [])].sort()
            if (cur.length !== def.length || cur.some((v, i) => v !== def[i])) return false
        }
        return true
    }, [transitions])

    const hasChanges = useMemo(() => {
        for (const from of STAFF_FROM_COLUMNS) {
            const cur = [...(transitions[from] ?? [])].sort()
            const ini = [...(initial[from] ?? [])].sort()
            if (cur.length !== ini.length || cur.some((v, i) => v !== ini[i])) return true
        }
        return false
    }, [transitions, initial])

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

    function handleSave() {
        startTransition(async () => {
            try {
                await updateWorkspaceStaffDefaultTransitions(transitions)
                toast.success("Staff transition defaults saved")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save")
            }
        })
    }

    function handleReset() {
        startTransition(async () => {
            try {
                await updateWorkspaceStaffDefaultTransitions(null)
                const copy: AllowedTransitions = {}
                for (const from of STAFF_FROM_COLUMNS) {
                    copy[from] = [...(DEFAULT_STAFF_TRANSITIONS[from] ?? [])]
                }
                setTransitions(copy)
                toast.success("Reset to built-in defaults")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to reset")
            }
        })
    }

    return (
        <Card className="border-sidebar-border">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center h-8 w-8 rounded-md bg-violet-50 dark:bg-violet-950/60 shrink-0 mt-0.5">
                            <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </span>
                        <div>
                            <CardTitle>Portal — Staff Transition Rules</CardTitle>
                            <CardDescription className="mt-1">
                                Which column moves staff members can make from the portal by default.
                                Staff moves always bypass client restrictions.
                                Individual teams can override this in{" "}
                                <span className="font-mono text-xs">Settings → Portal → [Team]</span>.
                            </CardDescription>
                        </div>
                    </div>
                    {!isDefault && (
                        <Badge variant="secondary" className="text-xs shrink-0">Custom</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <TransitionRulesMatrix
                    fromColumns={STAFF_FROM_COLUMNS}
                    toColumns={STAFF_TO_COLUMNS}
                    transitions={transitions}
                    onChange={toggle}
                    disabled={!isAdmin || isPending}
                    columns={UAT_COLUMNS}
                    actor="staff"
                />

                {isAdmin && (
                    <div className="flex items-center justify-between pt-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            disabled={isPending || isDefault}
                            className="text-muted-foreground"
                        >
                            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
                            Reset to built-in defaults
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isPending || !hasChanges}>
                            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                            Save defaults
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

"use client"

import { useTransition, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RotateCcw, Loader2 } from "lucide-react"
import {
    UAT_COLUMNS,
    LINEAR_STATE_TYPES,
    DEFAULT_STATE_TYPE_MAPPING,
    type UATColumn,
    type LinearStateType,
} from "@/lib/uat-mapping"
import { updateWorkspaceDefaultStateTypeMapping } from "@/app/actions/portal-admin"

type TypeMapping = Partial<Record<string, UATColumn | null>>

interface Props {
    isAdmin: boolean
    saved: TypeMapping | null
}

const STATE_TYPE_LABELS: Record<LinearStateType, string> = {
    triage:    "Triage",
    backlog:   "Backlog",
    unstarted: "Unstarted",
    started:   "Started",
    completed: "Completed",
    cancelled: "Cancelled",
}

const STATE_TYPE_DESCRIPTIONS: Record<LinearStateType, string> = {
    triage:    "New issues awaiting triage (default → Submitted)",
    backlog:   "Issues in the backlog (default → hidden)",
    unstarted: "Not yet started (default → hidden)",
    started:   "In progress / actively worked on (default → hidden)",
    completed: "Finished issues (default → hidden — opt-in to show as Approved)",
    cancelled: "Cancelled issues (default → Canceled)",
}

const SENTINEL_AUTO = "__auto__"
const SENTINEL_HIDDEN = "__hidden__"

function toSelectValue(val: UATColumn | null | undefined): string {
    if (val === undefined) return SENTINEL_AUTO
    if (val === null) return SENTINEL_HIDDEN
    return val
}

function fromSelectValue(val: string): UATColumn | null | undefined {
    if (val === SENTINEL_AUTO) return undefined
    if (val === SENTINEL_HIDDEN) return null
    return val as UATColumn
}

export function PortalStateMappingDefaults({ isAdmin, saved }: Props) {
    const initial: TypeMapping = saved && typeof saved === "object" ? saved : {}

    const [isPending, startTransition] = useTransition()
    const [mapping, setMapping] = useState<TypeMapping>({ ...initial })

    const isAllDefault = LINEAR_STATE_TYPES.every(t => !(t in mapping))

    const hasChanges = LINEAR_STATE_TYPES.some(t => {
        const cur = mapping[t]
        const ini = initial[t]
        return cur !== ini
    })

    function handleChange(type: LinearStateType, val: string) {
        const resolved = fromSelectValue(val)
        setMapping(prev => {
            const next = { ...prev }
            if (resolved === undefined) {
                delete next[type]
            } else {
                next[type] = resolved
            }
            return next
        })
    }

    function handleSave() {
        startTransition(async () => {
            try {
                await updateWorkspaceDefaultStateTypeMapping(Object.keys(mapping).length > 0 ? mapping : null)
                toast.success("State type mapping defaults saved")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save")
            }
        })
    }

    function handleReset() {
        startTransition(async () => {
            try {
                await updateWorkspaceDefaultStateTypeMapping(null)
                setMapping({})
                toast.success("Reset to built-in defaults")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to reset")
            }
        })
    }

    const colLabel = (col: UATColumn) => UAT_COLUMNS.find(c => c.id === col)?.title ?? col
    const colColor = (col: UATColumn) => UAT_COLUMNS.find(c => c.id === col)?.color ?? "#6b7280"
    const hardDefault = (type: LinearStateType): string => {
        const def = DEFAULT_STATE_TYPE_MAPPING[type]
        if (def === undefined) return "Hidden"
        if (def === null) return "Hidden"
        return colLabel(def)
    }

    return (
        <Card className="border-sidebar-border">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Portal — Default State Type Mapping</CardTitle>
                        <CardDescription className="mt-1">
                            Map Linear state types to UAT portal columns. Applies workspace-wide when no
                            per-team override is set. Name-based patterns always take priority.
                            Individual teams can override in{" "}
                            <span className="font-mono text-xs">Settings → Portal → [Team]</span>.
                        </CardDescription>
                    </div>
                    {!isAllDefault && (
                        <Badge variant="secondary" className="text-xs shrink-0">Custom</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-lg border border-sidebar-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-[140px]">State Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Description</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-[80px]">Built-in</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-[200px]">Override</th>
                            </tr>
                        </thead>
                        <tbody>
                            {LINEAR_STATE_TYPES.map(type => {
                                const currentVal = mapping[type]
                                const isOverridden = type in mapping
                                return (
                                    <tr
                                        key={type}
                                        className={`border-b border-border/60 last:border-0 transition-colors ${isOverridden ? "bg-blue-50/50 dark:bg-blue-950/20" : "hover:bg-muted/20"}`}
                                    >
                                        <td className="px-4 py-2.5">
                                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 h-4">
                                                {type}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                            {STATE_TYPE_DESCRIPTIONS[type]}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-muted-foreground/70">
                                            {hardDefault(type)}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <Select
                                                value={toSelectValue(currentVal)}
                                                onValueChange={v => handleChange(type, v)}
                                                disabled={!isAdmin || isPending}
                                            >
                                                <SelectTrigger className="h-8 text-xs w-[185px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={SENTINEL_AUTO}>
                                                        Auto ({hardDefault(type)})
                                                    </SelectItem>
                                                    <SelectItem value={SENTINEL_HIDDEN}>
                                                        Hidden from portal
                                                    </SelectItem>
                                                    <SelectSeparator />
                                                    {UAT_COLUMNS.map(col => (
                                                        <SelectItem key={col.id} value={col.id}>
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="h-2 w-2 rounded-full shrink-0"
                                                                    style={{ backgroundColor: colColor(col.id) }}
                                                                />
                                                                {colLabel(col.id)}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {isAdmin && (
                    <div className="flex items-center justify-between pt-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            disabled={isPending || isAllDefault}
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

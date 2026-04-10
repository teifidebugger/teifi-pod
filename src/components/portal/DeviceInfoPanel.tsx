"use client"

import { useState } from "react"
import { Monitor, Smartphone, Tablet, Eye, EyeOff, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DeviceInfo } from "@/components/portal/portal-issue-utils"

export type DeviceFieldKey = keyof DeviceInfo

export interface DeviceFieldState {
    value: string
    included: boolean
}

export const DEVICE_FIELDS: { key: DeviceFieldKey; label: string }[] = [
    { key: "deviceType",   label: "Device" },
    { key: "browser",      label: "Browser" },
    { key: "os",           label: "OS" },
    { key: "screenSize",   label: "Screen" },
    { key: "viewportSize", label: "Viewport" },
    { key: "pixelRatio",   label: "Pixel Ratio" },
    { key: "url",          label: "URL" },
]

interface DeviceInfoPanelProps {
    fields: Record<string, DeviceFieldState>
    included: boolean
    onIncludedChange: (v: boolean) => void
    onFieldToggle: (key: string) => void
    onFieldValueChange: (key: string, value: string) => void
}

export function DeviceInfoPanel({
    fields,
    included,
    onIncludedChange,
    onFieldToggle,
    onFieldValueChange,
}: DeviceInfoPanelProps) {
    const [editingField, setEditingField] = useState<string | null>(null)

    const deviceType = fields["deviceType"]?.value
    const DeviceIcon =
        deviceType === "Mobile" ? Smartphone :
        deviceType === "Tablet" ? Tablet :
        Monitor

    const includedCount = DEVICE_FIELDS.filter(f => fields[f.key]?.included).length

    return (
        <div className="rounded-lg border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <DeviceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">Device Info</span>
                    <span className="text-[10px] text-muted-foreground/60">
                        {includedCount} of {DEVICE_FIELDS.length} fields included
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => onIncludedChange(!included)}
                    className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                        included
                            ? "border-primary/40 text-primary bg-primary/10"
                            : "border-border text-muted-foreground/60 hover:text-foreground"
                    )}
                >
                    {included ? "Included" : "Excluded"}
                </button>
            </div>

            {/* Per-field rows */}
            {included && (
                <div className="divide-y divide-border/30">
                    {DEVICE_FIELDS.map(({ key, label }) => {
                        const field = fields[key]
                        if (!field) return null
                        const isEditing = editingField === key
                        const isUrlField = key === "url"
                        return (
                            <div
                                key={key}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 group transition-colors",
                                    !field.included && "opacity-40",
                                    isUrlField && "bg-red-500/5",
                                )}
                            >
                                {/* Include/exclude toggle */}
                                <button
                                    type="button"
                                    onClick={() => onFieldToggle(key)}
                                    className="text-muted-foreground/50 hover:text-foreground transition-colors shrink-0"
                                    title={field.included ? "Exclude this field" : "Include this field"}
                                >
                                    {field.included
                                        ? <Eye className="h-3 w-3" />
                                        : <EyeOff className="h-3 w-3" />
                                    }
                                </button>

                                {/* Label */}
                                <span className={cn(
                                    "text-[10px] font-medium w-[72px] shrink-0 uppercase tracking-wide",
                                    isUrlField ? "text-red-400" : "text-muted-foreground/70",
                                )}>
                                    {label}
                                </span>

                                {/* Value — inline editable */}
                                {isEditing ? (
                                    <input
                                        autoFocus
                                        value={field.value}
                                        onChange={e => onFieldValueChange(key, e.target.value)}
                                        onBlur={() => setEditingField(null)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter" || e.key === "Escape") setEditingField(null)
                                        }}
                                        className="flex-1 text-xs bg-transparent outline-none border-b border-primary text-foreground min-w-0"
                                        placeholder={isUrlField ? "Enter the test page URL…" : undefined}
                                    />
                                ) : (
                                    <span
                                        className={cn(
                                            "flex-1 text-xs truncate cursor-pointer transition-colors",
                                            isUrlField
                                                ? "text-red-400 hover:text-red-300 italic"
                                                : "text-foreground hover:text-primary",
                                        )}
                                        onClick={() => setEditingField(key)}
                                        title={isUrlField ? "This is the portal URL — edit to enter your test page URL" : field.value}
                                    >
                                        {field.value || (isUrlField ? "Enter test URL…" : "")}
                                    </span>
                                )}

                                {/* Edit pencil */}
                                <button
                                    type="button"
                                    onClick={() => setEditingField(isEditing ? null : key)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-foreground shrink-0"
                                    title="Edit value"
                                >
                                    <Pencil className="h-3 w-3" />
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

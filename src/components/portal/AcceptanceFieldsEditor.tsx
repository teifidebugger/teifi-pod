"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, X } from "lucide-react"
import { DEFAULT_ACCEPTANCE_FIELDS } from "@/lib/portal-acceptance-fields"
import type { AcceptanceIssueField, AcceptanceFieldType } from "@/lib/portal-acceptance-fields"
import { toast } from "sonner"

const FIELD_TYPE_LABELS: Record<AcceptanceFieldType, string> = {
    text: "Text (single line)",
    textarea: "Textarea (multi line)",
    select: "Select (dropdown)",
    checkbox: "Checkbox (yes/no)",
}

interface Props {
    initialFields: AcceptanceIssueField[]
    defaultFields?: AcceptanceIssueField[]
    onSave?: (fields: AcceptanceIssueField[]) => Promise<void>
    /** If provided, shows a "Use workspace default" reset button that calls this. */
    onReset?: () => Promise<void>
    /** Hide the built-in Save button (e.g. when the parent dialog has its own save action). */
    hideSave?: boolean
    /** Called whenever fields change — useful for controlled parent dialogs. */
    onChange?: (fields: AcceptanceIssueField[]) => void
}

export function AcceptanceFieldsEditor({ initialFields, defaultFields, onSave, onReset, hideSave, onChange }: Props) {
    const [fields, setFields] = useState<AcceptanceIssueField[]>(initialFields)

    function updateFields(next: AcceptanceIssueField[]) {
        setFields(next)
        onChange?.(next)
    }
    const [isPending, startTransition] = useTransition()

    function update(idx: number, patch: Partial<AcceptanceIssueField>) {
        updateFields(fields.map((f, i) => i === idx ? { ...f, ...patch } : f))
    }

    function remove(idx: number) {
        if (fields.length <= 1) return
        updateFields(fields.filter((_, i) => i !== idx))
    }

    function moveUp(idx: number) {
        if (idx === 0) return
        const next = [...fields]
        ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
        updateFields(next)
    }

    function moveDown(idx: number) {
        if (idx === fields.length - 1) return
        const next = [...fields]
        ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
        updateFields(next)
    }

    function addField() {
        const id = `field_${Date.now()}`
        updateFields([...fields, { id, label: "", type: "textarea", placeholder: "", required: false }])
    }

    function addOption(idx: number) {
        const field = fields[idx]
        const options = [...(field.options ?? []), ""]
        update(idx, { options })
    }

    function updateOption(fieldIdx: number, optIdx: number, value: string) {
        const field = fields[fieldIdx]
        const options = [...(field.options ?? [])]
        options[optIdx] = value
        update(fieldIdx, { options })
    }

    function removeOption(fieldIdx: number, optIdx: number) {
        const field = fields[fieldIdx]
        const options = (field.options ?? []).filter((_, i) => i !== optIdx)
        update(fieldIdx, { options })
    }

    function resetToDefaults() {
        updateFields((defaultFields ?? DEFAULT_ACCEPTANCE_FIELDS).map(f => ({ ...f })))
    }

    function save() {
        const invalid = fields.find(f => !f.id?.trim() || !f.label?.trim())
        if (invalid) {
            toast.error("Each field must have an ID and label")
            return
        }
        startTransition(async () => {
            try {
                if (!onSave) return
                await onSave(fields)
                toast.success("Acceptance fields saved")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save")
            }
        })
    }

    function reset() {
        if (!onReset) return
        startTransition(async () => {
            try {
                await onReset()
                toast.success("Reset to workspace default")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to reset")
            }
        })
    }

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {fields.map((field, idx) => (
                    <div key={field.id} className="rounded-lg border border-border/60 bg-background p-3 space-y-2.5">
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() => moveUp(idx)}
                                        disabled={idx === 0}
                                        className="p-0.5 text-muted-foreground/50 hover:text-muted-foreground disabled:opacity-30 transition-colors"
                                    >
                                        <ArrowUp className="h-3 w-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveDown(idx)}
                                        disabled={idx === fields.length - 1}
                                        className="p-0.5 text-muted-foreground/50 hover:text-muted-foreground disabled:opacity-30 transition-colors"
                                    >
                                        <ArrowDown className="h-3 w-3" />
                                    </button>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-muted-foreground">Label</Label>
                                        <Input
                                            value={field.label}
                                            onChange={e => update(idx, { label: e.target.value })}
                                            placeholder="e.g. What happened?"
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-muted-foreground">Type</Label>
                                        <Select
                                            value={field.type ?? "textarea"}
                                            onValueChange={v => update(idx, { type: v as AcceptanceFieldType, options: v === "select" ? (field.options ?? [""]) : undefined })}
                                        >
                                            <SelectTrigger className="h-7 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(Object.entries(FIELD_TYPE_LABELS) as [AcceptanceFieldType, string][]).map(([val, label]) => (
                                                    <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <Switch
                                            id={`required-${idx}`}
                                            checked={field.required}
                                            onCheckedChange={v => update(idx, { required: v })}
                                            className="scale-75"
                                        />
                                        <Label htmlFor={`required-${idx}`} className="text-[11px] text-muted-foreground cursor-pointer">
                                            Required
                                        </Label>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => remove(idx)}
                                        disabled={fields.length <= 1}
                                        className="p-1 text-muted-foreground/50 hover:text-destructive disabled:opacity-30 transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Placeholder + Default Value — hidden for checkbox/select */}
                            {field.type !== "checkbox" && field.type !== "select" && (
                                <div className="ml-7 grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-muted-foreground">Placeholder</Label>
                                        <Input
                                            value={field.placeholder ?? ""}
                                            onChange={e => update(idx, { placeholder: e.target.value })}
                                            placeholder="Hint shown when empty…"
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-muted-foreground">Default value</Label>
                                        <Input
                                            value={field.defaultValue ?? ""}
                                            onChange={e => update(idx, { defaultValue: e.target.value || undefined })}
                                            placeholder="Pre-filled content…"
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Options — only for select */}
                            {field.type === "select" && (
                                <div className="ml-7 space-y-1.5">
                                    <Label className="text-[11px] text-muted-foreground">Options</Label>
                                    <div className="space-y-1">
                                        {(field.options ?? []).map((opt, optIdx) => (
                                            <div key={optIdx} className="flex items-center gap-1">
                                                <Input
                                                    value={opt}
                                                    onChange={e => updateOption(idx, optIdx, e.target.value)}
                                                    placeholder={`Option ${optIdx + 1}`}
                                                    className="h-6 text-xs flex-1"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(idx, optIdx)}
                                                    className="p-0.5 text-muted-foreground/40 hover:text-destructive transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addOption(idx)}
                                            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Add option
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={addField} disabled={isPending}>
                        <Plus className="h-3 w-3" />
                        Add field
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={resetToDefaults} disabled={isPending}>
                        <RotateCcw className="h-3 w-3" />
                        Reset to defaults
                    </Button>
                    {onReset && (
                        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground/70" onClick={reset} disabled={isPending}>
                            Use workspace default
                        </Button>
                    )}
                </div>
                {!hideSave && (
                    <Button size="sm" className="h-7 text-xs" onClick={save} disabled={isPending}>
                        {isPending ? "Saving…" : "Save"}
                    </Button>
                )}
            </div>
        </div>
    )
}

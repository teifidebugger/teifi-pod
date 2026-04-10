"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Bug, Lightbulb, Pencil, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AcceptanceFieldsEditor } from "@/components/portal/AcceptanceFieldsEditor"
import type { AcceptanceIssueField, IssueTemplateType } from "@/lib/portal-acceptance-fields"
import { DEFAULT_BUG_FIELDS, DEFAULT_FEATURE_FIELDS, TEMPLATE_TYPE_LABELS } from "@/lib/portal-acceptance-fields"
import { createAcceptanceTemplate, updateAcceptanceTemplate, deleteAcceptanceTemplate } from "@/app/actions/portal-admin"

interface PortalIssueTemplatesProps {
    bugTemplate: { id: string; name: string; fields: AcceptanceIssueField[]; isDefault: boolean } | null
    featureTemplate: { id: string; name: string; fields: AcceptanceIssueField[]; isDefault: boolean } | null
}

const TYPES: { type: IssueTemplateType; label: string; icon: typeof Bug; defaults: AcceptanceIssueField[]; description: string }[] = [
    { type: "bug", label: "Bug Report", icon: Bug, defaults: DEFAULT_BUG_FIELDS, description: "Fields shown when clients report a bug" },
    { type: "feature", label: "Feature Request", icon: Lightbulb, defaults: DEFAULT_FEATURE_FIELDS, description: "Fields shown when clients request a feature" },
]

export function PortalIssueTemplates({ bugTemplate, featureTemplate }: PortalIssueTemplatesProps) {
    const templates = useMemo(() => ({
        bug: bugTemplate,
        feature: featureTemplate,
    }), [bugTemplate, featureTemplate])

    const router = useRouter()
    const [editing, setEditing] = useState<{ type: IssueTemplateType; name: string; fields: AcceptanceIssueField[]; existingId: string | null } | null>(null)
    const [isPending, startTransition] = useTransition()

    function openEdit(type: IssueTemplateType) {
        const existing = templates[type as "bug" | "feature"]
        setEditing({
            type,
            name: existing?.name ?? `${TEMPLATE_TYPE_LABELS[type]} Template`,
            fields: existing ? (existing.fields as AcceptanceIssueField[]) : type === "bug" ? [...DEFAULT_BUG_FIELDS] : [...DEFAULT_FEATURE_FIELDS],
            existingId: existing?.id ?? null,
        })
    }

    function handleSave() {
        if (!editing) return
        const validFields = editing.fields.filter(f => f.label.trim())
        if (validFields.length === 0) { toast.error("Add at least one field"); return }

        startTransition(async () => {
            try {
                if (editing.existingId) {
                    await updateAcceptanceTemplate(editing.existingId, editing.name, validFields)
                } else {
                    await createAcceptanceTemplate(editing.name, validFields, editing.type)
                }
                toast.success("Template saved")
                router.refresh()
                setEditing(null)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to save")
            }
        })
    }

    function handleReset(type: IssueTemplateType) {
        const existing = templates[type as "bug" | "feature"]
        if (!existing) return
        startTransition(async () => {
            try {
                await deleteAcceptanceTemplate(existing.id)
                toast.success("Reset to defaults")
                router.refresh()
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to reset")
            }
        })
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>Issue Templates</CardTitle>
                        <CardDescription className="mt-0.5">
                            Customize the fields clients fill out when creating Bug Reports or Feature Requests. Default fields are used when no custom template is set.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {TYPES.map(({ type, label, icon: Icon, defaults, description }) => {
                        const tpl = templates[type as "bug" | "feature"]
                        const fields = tpl ? (tpl.fields as AcceptanceIssueField[]) : defaults
                        return (
                            <div key={type} className="rounded-lg border border-border px-4 py-3 flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{label}</span>
                                            {tpl ? (
                                                <Badge variant="secondary" className="text-[10px]">Custom</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px]">Default</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">
                                            {fields.length} field{fields.length !== 1 ? "s" : ""}: {fields.map(f => f.label).join(", ")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {tpl && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => handleReset(type)} disabled={isPending}>
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => openEdit(type)} disabled={isPending}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {editing && (
                <Dialog open onOpenChange={open => { if (!open) setEditing(null) }}>
                    <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit {TEMPLATE_TYPE_LABELS[editing.type]} Fields</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Template Name</Label>
                                <Input
                                    value={editing.name}
                                    onChange={e => setEditing(prev => prev ? { ...prev, name: e.target.value } : prev)}
                                    placeholder="e.g. Bug Report Template"
                                    className="h-8 text-sm"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Fields</Label>
                                <AcceptanceFieldsEditor
                                    initialFields={editing.fields}
                                    defaultFields={editing.type === "bug" ? DEFAULT_BUG_FIELDS : editing.type === "feature" ? DEFAULT_FEATURE_FIELDS : undefined}
                                    hideSave
                                    onChange={fields => setEditing(prev => prev ? { ...prev, fields } : prev)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button size="sm" onClick={handleSave} disabled={isPending}>
                                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}

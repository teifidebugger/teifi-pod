"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Star, FileText } from "lucide-react"
import { AcceptanceFieldsEditor } from "@/components/portal/AcceptanceFieldsEditor"
import { RichTextEditor } from "@/components/portal/RichTextEditor"
import { DEFAULT_ACCEPTANCE_FIELDS, parseTemplateFields } from "@/lib/portal-acceptance-fields"
import type { AcceptanceIssueField } from "@/lib/portal-acceptance-fields"
import {
    createAcceptanceTemplate,
    updateAcceptanceTemplate,
    deleteAcceptanceTemplate,
    setDefaultTemplate,
} from "@/app/actions/portal-admin"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Template = {
    id: string
    name: string
    fields: unknown
    isDefault: boolean
}

function parseFields(fields: unknown): AcceptanceIssueField[] {
    const parsed = parseTemplateFields(fields)
    return parsed.length > 0 ? parsed : DEFAULT_ACCEPTANCE_FIELDS.map(f => ({ ...f }))
}

function FieldPreview({ field }: { field: AcceptanceIssueField }) {
    const type = field.type ?? "textarea"
    return (
        <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                {field.label || <span className="italic opacity-40">Untitled</span>}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {type === "text" && (
                <Input
                    readOnly
                    value={field.defaultValue ?? ""}
                    placeholder={field.placeholder || "Text…"}
                    className="h-8 text-sm pointer-events-none opacity-70"
                />
            )}
            {type === "textarea" && (
                <RichTextEditor
                    value={field.defaultValue ?? ""}
                    onChange={() => {}}
                    placeholder={field.placeholder}
                    minHeight="80px"
                    disabled
                />
            )}
            {type === "select" && (
                <Select disabled>
                    <SelectTrigger className="h-8 text-sm opacity-70">
                        <SelectValue placeholder={field.options?.[0] ?? "Select an option…"} />
                    </SelectTrigger>
                    <SelectContent>
                        {(field.options ?? []).map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            {type === "checkbox" && (
                <div className="flex items-center gap-2 opacity-70 pointer-events-none">
                    <Switch disabled />
                    <span className="text-sm text-muted-foreground">No</span>
                </div>
            )}
        </div>
    )
}

function TemplateDialog({
    open,
    onOpenChange,
    initial,
    onSave,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    initial?: { id: string; name: string; fields: AcceptanceIssueField[] }
    onSave: () => void
}) {
    const [name, setName] = useState(initial?.name ?? "")
    const [pendingFields, setPendingFields] = useState<AcceptanceIssueField[]>(
        initial?.fields ?? DEFAULT_ACCEPTANCE_FIELDS.map(f => ({ ...f }))
    )
    const [isPending, startTransition] = useTransition()

    function save() {
        if (!name.trim()) {
            toast.error("Template name is required")
            return
        }
        const invalid = pendingFields.find(f => !f.id?.trim() || !f.label?.trim())
        if (invalid) {
            toast.error("Each field must have an ID and label")
            return
        }
        startTransition(async () => {
            try {
                if (initial) {
                    await updateAcceptanceTemplate(initial.id, name, pendingFields)
                } else {
                    await createAcceptanceTemplate(name, pendingFields)
                }
                toast.success(initial ? "Template updated" : "Template created")
                onSave()
                onOpenChange(false)
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initial ? "Edit Template" : "New Template"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Template Name</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Standard UAT Fields"
                            className="h-8 text-sm"
                            disabled={isPending}
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Fields</Label>
                        <AcceptanceFieldsEditor
                            initialFields={pendingFields}
                            hideSave
                            onChange={setPendingFields}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={save} disabled={isPending}>
                        {isPending ? "Saving…" : initial ? "Save changes" : "Create template"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function PortalAcceptanceTemplates({ initialTemplates }: { initialTemplates: Template[] }) {
    const [dialog, setDialog] = useState<{ open: boolean; template?: Template }>({ open: false })
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    function refresh() {
        router.refresh()
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            try {
                await deleteAcceptanceTemplate(id)
                toast.success("Template deleted")
                refresh()
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to delete")
            }
        })
    }

    function handleSetDefault(id: string) {
        startTransition(async () => {
            try {
                await setDefaultTemplate(id)
                toast.success("Default template updated")
                refresh()
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to update")
            }
        })
    }

    const editingTemplate = dialog.template

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <CardTitle>Acceptance Criteria Templates</CardTitle>
                        <CardDescription className="mt-0.5">
                            Field templates for acceptance criteria sub-issues. When a client adds acceptance criteria to a parent issue, these fields define what information is collected.
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 shrink-0"
                        onClick={() => setDialog({ open: true, template: undefined })}
                        disabled={isPending}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add template
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {initialTemplates.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 py-10 text-center space-y-2">
                        <FileText className="h-7 w-7 text-muted-foreground/30 mx-auto" />
                        <p className="text-sm text-muted-foreground">No templates yet</p>
                        <p className="text-xs text-muted-foreground/60">Create one to override the built-in acceptance fields</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {initialTemplates.map(t => {
                            const fields = Array.isArray(t.fields) ? t.fields as Array<{ label?: string }> : []
                            return (
                                <div
                                    key={t.id}
                                    className="rounded-lg border border-border px-4 py-3 flex items-start justify-between gap-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{t.name}</span>
                                                {t.isDefault ? (
                                                    <Badge variant="secondary" className="text-[10px]">Default</Badge>
                                                ) : (
                                                    <button
                                                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                                                        onClick={() => handleSetDefault(t.id)}
                                                        disabled={isPending}
                                                    >
                                                        <Star className="h-3 w-3" /> Set default
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground/60 mt-1">
                                                {fields.length} field{fields.length !== 1 ? "s" : ""}: {fields.map(f => f.label ?? "").filter(Boolean).join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground"
                                            onClick={() => setDialog({ open: true, template: t })}
                                            disabled={isPending}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(t.id)}
                                            disabled={isPending || (t.isDefault && initialTemplates.length === 1)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>

            <TemplateDialog
                open={dialog.open}
                onOpenChange={open => setDialog(prev => ({ ...prev, open }))}
                initial={editingTemplate ? {
                    id: editingTemplate.id,
                    name: editingTemplate.name,
                    fields: parseFields(editingTemplate.fields),
                } : undefined}
                onSave={refresh}
            />
        </Card>
    )
}

"use client"

import { useState, useTransition, useRef, useEffect, useCallback } from "react"
import { createPortalIssue, createPortalAttachment, type PortalModuleLabel } from "@/app/actions/portal"
import { getPortalIssueTemplateFields } from "@/app/actions/workspace"
import type { AcceptanceIssueField, IssueTemplateType } from "@/lib/portal-acceptance-fields"
import { getDefaultFieldsForType } from "@/lib/portal-acceptance-fields"
import { Checkbox } from "@/components/ui/checkbox"
import { uploadFileToLinear } from "@/lib/portal-upload"
import { RichTextEditor } from "@/components/portal/RichTextEditor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Bug, Lightbulb, FileText, Plus, X, GripVertical, ChevronLeft, Paperclip, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { detectDeviceInfo, buildDeviceFooter, type DeviceInfo } from "@/components/portal/portal-issue-utils"
import { DeviceInfoPanel, DEVICE_FIELDS, type DeviceFieldState } from "@/components/portal/DeviceInfoPanel"

// ─── Upload constraints (must match server-side route.ts) ────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_FILES = 10
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    "application/pdf",
    "text/plain", "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
])
const ALLOWED_EXTENSIONS = ".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const PRIORITY_OPTIONS = [
    { value: "0", label: "No priority" },
    { value: "1", label: "Urgent" },
    { value: "2", label: "High" },
    { value: "3", label: "Medium" },
    { value: "4", label: "Low" },
]

type TemplateType = "bug" | "request" | "blank" | "acceptance"

interface Template {
    id: TemplateType
    label: string
    icon: React.ComponentType<{ className?: string }>
    description: string
    titlePrefix: string
    body: string
    targetColumn?: string
}

const TEMPLATES: Template[] = [
    {
        id: "bug",
        label: "Bug Report",
        icon: Bug,
        description: "Something isn't working as expected",
        titlePrefix: "[Bug] ",
        body: "## What happened?\n\n\n## What was expected?\n\n\n## Steps to reproduce\n\n1. \n",
    },
    {
        id: "request",
        label: "Feature Request",
        icon: Lightbulb,
        description: "Suggest a new feature or enhancement",
        titlePrefix: "[Feature] ",
        body: "## What would you like?\n\n\n## Why is this needed?\n\n",
        targetColumn: "backlog" as const,
    },
    {
        id: "blank",
        label: "Blank",
        icon: FileText,
        description: "Start from scratch",
        titlePrefix: "",
        body: "",
    },
]

interface ReportIssueModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    teamId: string
    parentIssue: { id: string; identifier: string; title: string } | null
    /** Pre-selected label IDs (e.g. the module the user clicked "Report" on). */
    initialLabelIds?: string[]
    /** Configured module labels for this portal — shown as a picker in the form. */
    moduleLabels?: PortalModuleLabel[]
    onCreated: () => void
}

export function ReportIssueModal({ open, onOpenChange, teamId, parentIssue, initialLabelIds, moduleLabels = [], onCreated }: ReportIssueModalProps) {
    const [step, setStep] = useState<"template" | "form">("template")
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const [title, setTitle] = useState("")
    const [descMd, setDescMd] = useState("")
    const [priority, setPriority] = useState("3")
    const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(initialLabelIds ?? [])
    // Acceptance criteria items
    const [criteria, setCriteria] = useState<string[]>(["", ""])
    const [isPending, startTransition] = useTransition()
    const newCriterionRef = useRef<HTMLInputElement>(null)
    const [deviceFields, setDeviceFields] = useState<Record<string, DeviceFieldState> | null>(null)
    const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true)
    const [attachments, setAttachments] = useState<Array<{ id: string; name: string; size: number; url: string | null; uploading: boolean; error: string | null }>>([])
    const [isDragOver, setIsDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [templateFields, setTemplateFields] = useState<AcceptanceIssueField[]>([])
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

    useEffect(() => {
        const info = detectDeviceInfo()
        if (info) {
            setDeviceFields(
                Object.fromEntries(DEVICE_FIELDS.map(f => [f.key, { value: String(info[f.key]), included: true }]))
            )
        }
    }, [])

    const isAcceptance = selectedTemplate?.id === "acceptance"
    const hasStructuredFields = selectedTemplate && selectedTemplate.id !== "blank" && !isAcceptance && templateFields.length > 0

    function handleTemplateSelect(tpl: Template) {
        setSelectedTemplate(tpl)
        setTitle(tpl.titlePrefix)
        setDescMd(tpl.body)
        setPriority("3")
        setSelectedLabelIds(initialLabelIds ?? [])
        setCriteria(["", ""])
        setIncludeDeviceInfo(true)
        setAttachments([])
        setFieldValues({})
        setStep("form")

        const templateType = tpl.id === "bug" ? "bug" : tpl.id === "request" ? "feature" : null
        if (templateType) {
            const defaults = getDefaultFieldsForType(templateType)
            setTemplateFields(defaults)
            setFieldValues(Object.fromEntries(defaults.filter(f => f.defaultValue).map(f => [f.id, f.defaultValue!])))
            getPortalIssueTemplateFields(teamId, templateType).then(fields => {
                setTemplateFields(fields)
                setFieldValues(Object.fromEntries(fields.filter(f => f.defaultValue).map(f => [f.id, f.defaultValue!])))
            }).catch(() => {})
        } else {
            setTemplateFields([])
        }
    }

    function handleClose() {
        onOpenChange(false)
        setTimeout(() => {
            setStep("template")
            setSelectedTemplate(null)
            setTitle("")
            setDescMd("")
            setPriority("3")
            setSelectedLabelIds(initialLabelIds ?? [])
            setCriteria(["", ""])
            setIncludeDeviceInfo(true)
            setAttachments([])
            setIsDragOver(false)
            setDeviceFields(prev => {
                // reset included flags but keep detected values
                if (!prev) return prev
                return Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, included: true }]))
            })
        }, 300)
    }

    function addCriterion() {
        setCriteria(prev => [...prev, ""])
        setTimeout(() => newCriterionRef.current?.focus(), 50)
    }

    function removeCriterion(idx: number) {
        setCriteria(prev => prev.filter((_, i) => i !== idx))
    }

    function updateCriterion(idx: number, val: string) {
        setCriteria(prev => prev.map((c, i) => i === idx ? val : c))
    }

    const filledCriteria = criteria.filter(c => c.trim())

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmedTitle = title.trim()
        if (!trimmedTitle) return
        if (isAcceptance && filledCriteria.length === 0) {
            toast.error("Add at least one acceptance criterion")
            return
        }
        if (hasStructuredFields) {
            const missing = templateFields.filter(f => f.required && !(fieldValues[f.id] ?? "").trim())
            if (missing.length > 0) {
                toast.error(`Required: ${missing.map(f => f.label).join(", ")}`)
                return
            }
        }

        const footer = (includeDeviceInfo && deviceFields)
            ? buildDeviceFooter(
                Object.fromEntries(
                    DEVICE_FIELDS
                        .filter(f => deviceFields[f.key]?.included)
                        .map(f => [f.key, deviceFields[f.key].value])
                ) as Partial<DeviceInfo>
              )
            : ""
        const uploadedAttachments = attachments.filter(a => a.url)
        let bodyMd = descMd.trim()
        if (hasStructuredFields) {
            bodyMd = templateFields
                .map(f => {
                    const val = (fieldValues[f.id] ?? "").trim()
                    if (!val) return null
                    return `## ${f.label}\n\n${val}`
                })
                .filter(Boolean)
                .join("\n\n")
        }
        const markdown = (bodyMd || footer) ? (bodyMd + footer) : undefined

        startTransition(async () => {
            try {
                const parent = await createPortalIssue({
                    teamId,
                    title: trimmedTitle,
                    description: markdown,
                    priority: parseInt(priority),
                    labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
                    parentId: parentIssue?.id,
                    targetColumn: selectedTemplate?.targetColumn,
                })

                // Create Linear attachments for uploaded files
                if (uploadedAttachments.length > 0) {
                    await Promise.allSettled(
                        uploadedAttachments.map(a => createPortalAttachment(parent.id, a.url!, a.name))
                    )
                }

                if (isAcceptance && filledCriteria.length > 0) {
                    // Create sub-issues for each acceptance criterion
                    const results = await Promise.allSettled(
                        filledCriteria.map(criterion =>
                            createPortalIssue({
                                teamId,
                                title: criterion.trim(),
                                priority: parseInt(priority),
                                labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
                                parentId: parent.id,
                            })
                        )
                    )
                    const failed = results.filter(r => r.status === "rejected").length
                    if (failed > 0) {
                        toast.warning(`${parent.identifier} created — ${filledCriteria.length - failed} of ${filledCriteria.length} acceptance issues created (${failed} failed)`)
                    } else {
                        toast.success(`${parent.identifier} created with ${filledCriteria.length} acceptance issue${filledCriteria.length !== 1 ? "s" : ""}`)
                    }
                } else {
                    toast.success(`Issue created: ${parent.identifier}`)
                }

                handleClose()
                onCreated()
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to create issue")
            }
        })
    }

    async function processFiles(files: File[]) {
        if (files.length === 0) return

        const currentCount = attachments.length
        const remaining = MAX_FILES - currentCount

        if (remaining <= 0) {
            toast.error(`Maximum ${MAX_FILES} files allowed`)
            return
        }

        // Client-side validation
        const valid: File[] = []
        for (const file of files.slice(0, remaining)) {
            if (!ALLOWED_MIME_TYPES.has(file.type)) {
                toast.error(`"${file.name}" — file type not supported`, { description: "Allowed: Images, PDF, Word, Excel, CSV, TXT" })
                continue
            }
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`"${file.name}" — file too large`, { description: `Max size is 10 MB. This file is ${formatBytes(file.size)}.` })
                continue
            }
            valid.push(file)
        }

        if (files.length > remaining) {
            toast.warning(`Only ${remaining} more file${remaining !== 1 ? "s" : ""} can be added (max ${MAX_FILES})`)
        }

        if (valid.length === 0) return

        const newEntries = valid.map(f => ({
            id: `${f.name}-${Date.now()}-${Math.random()}`,
            name: f.name,
            size: f.size,
            url: null,
            uploading: true,
            error: null,
        }))
        setAttachments(prev => [...prev, ...newEntries])

        await Promise.all(newEntries.map(async (entry, i) => {
            try {
                const { url } = await uploadFileToLinear(valid[i])
                setAttachments(prev => prev.map(a => a.id === entry.id ? { ...a, url, uploading: false } : a))
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Upload failed"
                setAttachments(prev => prev.map(a => a.id === entry.id ? { ...a, uploading: false, error: msg } : a))
                toast.error(`Failed to upload "${valid[i].name}"`, { description: msg })
            }
        }))
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? [])
        e.target.value = ""
        await processFiles(files)
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault()
        setIsDragOver(true)
    }

    function handleDragLeave(e: React.DragEvent) {
        e.preventDefault()
        setIsDragOver(false)
    }

    async function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setIsDragOver(false)
        const files = Array.from(e.dataTransfer.files)
        await processFiles(files)
    }

    const uploadingCount = attachments.filter(a => a.uploading).length
    const canSubmit = title.trim() && (!isAcceptance || filledCriteria.length > 0) && uploadingCount === 0

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[820px] max-h-[90vh] overflow-y-auto">
                {step === "template" ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Report an Issue</DialogTitle>
                            {parentIssue && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Under <span className="font-mono">{parentIssue.identifier}</span> · {parentIssue.title}
                                </p>
                            )}
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground -mt-1 mb-1">
                            Choose a template to get started. Templates pre-fill the form with helpful prompts so you can describe your issue clearly.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            {TEMPLATES.map(tpl => {
                                const Icon = tpl.icon
                                const accent =
                                    tpl.id === "bug" ? "text-rose-500 bg-rose-500/10 border-rose-500/20" :
                                    tpl.id === "request" ? "text-blue-500 bg-blue-500/10 border-blue-500/20" :
                                    "text-muted-foreground bg-muted/60 border-border"
                                const hoverBorder =
                                    tpl.id === "bug" ? "hover:border-rose-500/50" :
                                    tpl.id === "request" ? "hover:border-blue-500/50" :
                                    "hover:border-border/80"
                                const hints =
                                    tpl.id === "bug" ? ["Steps to reproduce", "Expected vs actual", "Device info auto-attached"] :
                                    tpl.id === "request" ? ["What you'd like", "Why it's needed", "Goes to backlog"] :
                                    ["Free-form title & description", "No pre-filled prompts", "Full control"]
                                return (
                                    <button
                                        key={tpl.id}
                                        type="button"
                                        className={cn(
                                            "flex flex-col items-start gap-3 p-4 rounded-xl border bg-card hover:bg-muted/40 transition-all text-left group",
                                            hoverBorder,
                                            "border-border"
                                        )}
                                        onClick={() => handleTemplateSelect(tpl)}
                                    >
                                        <div className={cn("p-2 rounded-lg border", accent)}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">{tpl.label}</p>
                                            <p className="text-[12px] text-muted-foreground leading-snug">{tpl.description}</p>
                                        </div>
                                        <ul className="space-y-1 mt-auto pt-1 border-t border-border/50 w-full">
                                            {hints.map(hint => (
                                                <li key={hint} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                                    {hint}
                                                </li>
                                            ))}
                                        </ul>
                                    </button>
                                )
                            })}
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="pb-0">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-xs text-muted-foreground/60">Report an Issue</span>
                                <span className="text-xs text-muted-foreground/40">/</span>
                                <span className="text-xs text-muted-foreground">{selectedTemplate?.label ?? "Issue"}</span>
                            </div>
                            <DialogTitle className="text-base">
                                {selectedTemplate?.label ?? "Create a Ticket"}
                            </DialogTitle>
                            {parentIssue && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Under <span className="font-mono">{parentIssue.identifier}</span> · {parentIssue.title}
                                </p>
                            )}
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-0 pt-3">

                            {/* Title — inline editor feel */}
                            <div className="pb-4">
                                <Input
                                    id="issue-title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder={
                                        isAcceptance
                                            ? "Feature or user story title"
                                            : selectedTemplate?.titlePrefix
                                                ? `${selectedTemplate.titlePrefix}brief summary…`
                                                : "Brief summary of the issue…"
                                    }
                                    required
                                    autoFocus
                                    disabled={isPending}
                                    className="border-0 border-b border-border/60 rounded-none px-0 text-lg font-semibold focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/30 placeholder:font-normal"
                                />
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-border/40 mb-4" />

                            {/* Acceptance criteria editor */}
                            {isAcceptance ? (
                                <div className="space-y-2 pb-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                                            Acceptance Criteria
                                            <span className="ml-1.5 text-muted-foreground/50 normal-case font-normal tracking-normal">
                                                ({filledCriteria.length} item{filledCriteria.length !== 1 ? "s" : ""})
                                            </span>
                                        </Label>
                                        <p className="text-[11px] text-muted-foreground/50">Each becomes a sub-issue</p>
                                    </div>
                                    <div className="rounded-lg border border-border overflow-hidden">
                                        {criteria.map((criterion, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 group",
                                                    idx > 0 && "border-t border-border/60"
                                                )}
                                            >
                                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 cursor-grab" />
                                                <span className="text-xs text-muted-foreground/40 w-4 shrink-0 text-right">{idx + 1}.</span>
                                                <input
                                                    ref={idx === criteria.length - 1 ? newCriterionRef : undefined}
                                                    type="text"
                                                    value={criterion}
                                                    onChange={e => updateCriterion(idx, e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter") { e.preventDefault(); addCriterion() }
                                                        if (e.key === "Backspace" && !criterion && criteria.length > 1) {
                                                            e.preventDefault()
                                                            removeCriterion(idx)
                                                        }
                                                    }}
                                                    placeholder={`Criterion ${idx + 1}…`}
                                                    disabled={isPending}
                                                    className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40 disabled:opacity-50"
                                                />
                                                {criteria.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCriterion(idx)}
                                                        disabled={isPending}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive disabled:pointer-events-none"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <div className="border-t border-border/60">
                                            <button
                                                type="button"
                                                onClick={addCriterion}
                                                disabled={isPending}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors disabled:pointer-events-none"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Add criterion
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground/50">
                                        Press <kbd className="font-mono bg-muted px-1 rounded text-[10px]">Enter</kbd> to add · <kbd className="font-mono bg-muted px-1 rounded text-[10px]">Backspace</kbd> on empty to remove
                                    </p>
                                </div>
                            ) : hasStructuredFields ? (
                                <div className="space-y-4 pb-4">
                                    {templateFields.map(field => (
                                        <div key={field.id} className="space-y-1.5">
                                            <Label className="text-xs font-medium">
                                                {field.label}
                                                {field.required && <span className="text-destructive ml-0.5">*</span>}
                                            </Label>
                                            {field.type === "select" && field.options ? (
                                                <Select value={fieldValues[field.id] ?? ""} onValueChange={v => setFieldValues(prev => ({ ...prev, [field.id]: v }))}>
                                                    <SelectTrigger><SelectValue placeholder={field.placeholder ?? "Select..."} /></SelectTrigger>
                                                    <SelectContent>{field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                                </Select>
                                            ) : field.type === "checkbox" ? (
                                                <div className="flex items-center gap-2">
                                                    <Checkbox checked={fieldValues[field.id] === "true"} onCheckedChange={v => setFieldValues(prev => ({ ...prev, [field.id]: String(v) }))} disabled={isPending} />
                                                    <span className="text-sm text-muted-foreground">{field.placeholder}</span>
                                                </div>
                                            ) : field.type === "textarea" ? (
                                                <RichTextEditor
                                                    value={fieldValues[field.id] ?? (field.defaultValue ?? "")}
                                                    onChange={v => setFieldValues(prev => ({ ...prev, [field.id]: v }))}
                                                    placeholder={field.placeholder}
                                                    minHeight="120px"
                                                    disabled={isPending}
                                                />
                                            ) : (
                                                <Input
                                                    value={fieldValues[field.id] ?? ""}
                                                    onChange={e => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                    placeholder={field.placeholder}
                                                    disabled={isPending}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="pb-4">
                                    <RichTextEditor
                                        value={descMd}
                                        onChange={setDescMd}
                                        placeholder="Describe the issue in detail…"
                                        minHeight="280px"
                                        disabled={isPending}
                                    />
                                </div>
                            )}

                            {/* Optional description for acceptance issues */}
                            {isAcceptance && (
                                <>
                                    <div className="h-px bg-border/40 mb-4" />
                                    <div className="space-y-1.5 pb-4">
                                        <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                                            Description <span className="normal-case font-normal tracking-normal">(optional)</span>
                                        </Label>
                                        <RichTextEditor
                                            value={descMd}
                                            onChange={setDescMd}
                                            placeholder="Additional context for this feature…"
                                            minHeight="120px"
                                            disabled={isPending}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Divider before meta row */}
                            <div className="h-px bg-border/40 mb-4" />

                            {/* Meta row — Priority + Module in one horizontal row */}
                            <div className="flex items-start gap-4 pb-4">
                                {/* Priority */}
                                <div className="space-y-1.5 shrink-0">
                                    <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest block">
                                        Priority
                                    </Label>
                                    <Select value={priority} onValueChange={setPriority} disabled={isPending}>
                                        <SelectTrigger id="issue-priority" className="w-36 h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRIORITY_OPTIONS.map(o => (
                                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Module chip picker */}
                                {moduleLabels.length > 0 && (
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest block">
                                            Module <span className="normal-case font-normal tracking-normal">(optional)</span>
                                        </Label>
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            {moduleLabels.map(label => {
                                                const isSelected = selectedLabelIds.includes(label.id)
                                                return (
                                                    <button
                                                        key={label.id}
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => setSelectedLabelIds(prev =>
                                                            isSelected ? prev.filter(id => id !== label.id) : [...prev, label.id]
                                                        )}
                                                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-all"
                                                        style={isSelected
                                                            ? { borderColor: label.color, color: label.color, backgroundColor: label.color + "20" }
                                                            : { borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "transparent" }
                                                        }
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: isSelected ? label.color : "var(--muted-foreground)" }} />
                                                        {label.name}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Divider before device info */}
                            {deviceFields && <div className="h-px bg-border/40 mb-4" />}

                            {/* Device Info panel */}
                            {deviceFields && (
                                <div className="space-y-1.5 pb-4">
                                    <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">
                                        Environment
                                    </span>
                                    <DeviceInfoPanel
                                        fields={deviceFields}
                                        included={includeDeviceInfo}
                                        onIncludedChange={setIncludeDeviceInfo}
                                        onFieldToggle={key => setDeviceFields(prev => prev && ({
                                            ...prev,
                                            [key]: { ...prev[key], included: !prev[key].included },
                                        }))}
                                        onFieldValueChange={(key, value) => setDeviceFields(prev => prev && ({
                                            ...prev,
                                            [key]: { ...prev[key], value },
                                        }))}
                                    />
                                </div>
                            )}

                            {/* Attachments */}
                            <div className="h-px bg-border/40 mb-4" />
                            <div className="space-y-2 pb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                                        Attachments
                                        {attachments.length > 0 && (
                                            <span className="ml-1.5 normal-case font-normal tracking-normal text-muted-foreground/50">
                                                {attachments.length}/{MAX_FILES}
                                            </span>
                                        )}
                                    </span>
                                    {attachments.length > 0 && attachments.length < MAX_FILES && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isPending}
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Add more
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept={ALLOWED_EXTENSIONS}
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isPending}
                                />

                                {/* Drop zone (shown when no files yet) */}
                                {attachments.length === 0 && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-1.5 w-full py-5 rounded-lg border border-dashed cursor-pointer transition-colors",
                                            isDragOver
                                                ? "border-primary/60 bg-primary/5 text-foreground"
                                                : "border-border/60 text-muted-foreground/50 hover:border-border hover:text-muted-foreground",
                                            isPending && "pointer-events-none opacity-50"
                                        )}
                                    >
                                        <Paperclip className="h-4 w-4" />
                                        <span className="text-xs font-medium">{isDragOver ? "Drop files here" : "Click or drag & drop files"}</span>
                                        <span className="text-[11px] text-muted-foreground/40">Images, PDF, Word, Excel, CSV, TXT · max 10 MB each · up to {MAX_FILES} files</span>
                                    </div>
                                )}

                                {/* File list */}
                                {attachments.length > 0 && (
                                    <div
                                        className={cn("space-y-1", attachments.length < MAX_FILES && "pb-1")}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        {attachments.map(a => {
                                            const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(a.name)
                                            return (
                                                <div
                                                    key={a.id}
                                                    className={cn(
                                                        "flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs group",
                                                        a.error
                                                            ? "border-destructive/40 bg-destructive/5"
                                                            : "border-border/60 bg-muted/30"
                                                    )}
                                                >
                                                    {a.uploading
                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                                                        : a.error
                                                            ? <X className="h-3.5 w-3.5 text-destructive shrink-0" />
                                                            : isImage
                                                                ? <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                : <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                    }
                                                    <span className={cn("truncate flex-1", a.error ? "text-destructive" : "text-muted-foreground")}>
                                                        {a.name}
                                                    </span>
                                                    {a.uploading
                                                        ? <span className="text-[10px] text-muted-foreground/50 shrink-0">Uploading…</span>
                                                        : a.error
                                                            ? <span className="text-[10px] text-destructive/70 shrink-0 max-w-[120px] truncate" title={a.error}>Failed</span>
                                                            : <span className="text-[10px] text-muted-foreground/40 shrink-0">{formatBytes(a.size)}</span>
                                                    }
                                                    {!a.uploading && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setAttachments(prev => prev.filter(x => x.id !== a.id))}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive shrink-0"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        {isDragOver && (
                                            <div className="flex items-center justify-center gap-2 py-2 rounded-md border border-dashed border-primary/60 bg-primary/5 text-xs text-primary">
                                                <Paperclip className="h-3.5 w-3.5" />
                                                Drop to add
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setStep("template")}
                                    disabled={isPending}
                                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    Back to templates
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isPending || !canSubmit}
                                    className="min-w-[120px]"
                                >
                                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                    {uploadingCount > 0
                                        ? `Uploading ${uploadingCount} file${uploadingCount !== 1 ? "s" : ""}…`
                                        : isAcceptance
                                            ? `Submit${filledCriteria.length > 0 ? ` (1 + ${filledCriteria.length})` : ""}`
                                            : "Submit Issue"
                                    }
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

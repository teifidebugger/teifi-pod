"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserPlus, ExternalLink, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { getEmailPreviewHtml } from "@/app/actions/email"
import type { ComponentType } from "react"

const TEMPLATES: {
    type: string
    title: string
    description: string
    trigger: string
    icon: ComponentType<{ className?: string }>
}[] = [
    { type: "workspace-invite", title: "Workspace Invite", description: "Sent when an admin invites a new team member", trigger: "On invite", icon: UserPlus },
    { type: "portal-invite", title: "Portal Invite", description: "Sent when a client portal user is invited", trigger: "On invite", icon: ExternalLink },
    { type: "time-reminder", title: "Time Reminder", description: "Daily reminder to log time when no entries today", trigger: "Daily cron", icon: Clock },
    { type: "timesheet-approved", title: "Timesheet Approved", description: "Notification when a manager approves a timesheet", trigger: "On approval", icon: CheckCircle2 },
    { type: "timesheet-rejected", title: "Timesheet Rejected", description: "Notification when a manager returns a timesheet", trigger: "On rejection", icon: XCircle },
    { type: "budget-alert", title: "Budget Alert", description: "Warning when a project exceeds its budget threshold", trigger: "Daily cron", icon: AlertTriangle },
]

export function EmailTemplatesGrid() {
    const [previewHtml, setPreviewHtml] = useState<string | null>(null)
    const [previewTitle, setPreviewTitle] = useState("")
    const [loadingType, setLoadingType] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    function handlePreview(type: string, title: string) {
        setLoadingType(type)
        startTransition(async () => {
            try {
                const html = await getEmailPreviewHtml(type)
                setPreviewHtml(html)
                setPreviewTitle(title)
            } catch {
                setPreviewHtml(null)
            } finally {
                setLoadingType(null)
            }
        })
    }

    return (
        <>
            <div>
                <h2 className="text-lg font-semibold mb-3">Email Templates</h2>
                <div className="grid grid-cols-2 gap-3">
                    {TEMPLATES.map((tpl) => (
                        <Card key={tpl.type}>
                            <CardContent className="pt-4 pb-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <tpl.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-medium">{tpl.title}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{tpl.description}</p>
                                <div className="flex items-center justify-between pt-1">
                                    <Badge variant="secondary" className="text-xs">{tpl.trigger}</Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handlePreview(tpl.type, tpl.title)}
                                        disabled={isPending && loadingType === tpl.type}
                                    >
                                        {isPending && loadingType === tpl.type ? (
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        ) : null}
                                        Preview
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Dialog open={!!previewHtml} onOpenChange={(open) => { if (!open) setPreviewHtml(null) }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{previewTitle}</DialogTitle>
                    </DialogHeader>
                    {previewHtml && (
                        <iframe
                            srcDoc={previewHtml}
                            className="w-full h-[520px] border-0 rounded-md"
                            title="Email preview"
                            sandbox=""
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

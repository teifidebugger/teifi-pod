"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TicketPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReportIssueModal } from "@/components/portal/ReportIssueModal"
import type { PortalModuleLabel } from "@/app/actions/portal/types"

interface Props {
    teamId: string
    moduleLabels?: PortalModuleLabel[]
    parentIssue?: { id: string; identifier: string; title: string } | null
}

export function ReportIssueTrigger({ teamId, moduleLabels = [], parentIssue = null }: Props) {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpen(true)}>
                <TicketPlus className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Create a Ticket</span>
            </Button>
            <ReportIssueModal
                open={open}
                onOpenChange={setOpen}
                teamId={teamId}
                parentIssue={parentIssue}
                moduleLabels={moduleLabels}
                onCreated={() => router.refresh()}
            />
        </>
    )
}

"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export interface SessionCSVRow {
    sessionName: string
    projectName: string
    roundTitle: string
    finalEstimate: string
    voteCount: number
    consensusPct: string
    createdAt: string
}

export function ExportCSVButton({
    rows,
    filename,
}: {
    rows: SessionCSVRow[]
    filename: string
}) {
    function handleExport() {
        const headers = [
            "Session",
            "Project",
            "Round",
            "Final Estimate",
            "Votes",
            "Consensus %",
            "Date",
        ]
        const csvRows = [
            headers,
            ...rows.map((r) => [
                r.sessionName,
                r.projectName,
                r.roundTitle,
                r.finalEstimate,
                String(r.voteCount),
                r.consensusPct,
                r.createdAt,
            ]),
        ]
        const csv = csvRows
            .map((row) =>
                row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
            )
            .join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
        </Button>
    )
}

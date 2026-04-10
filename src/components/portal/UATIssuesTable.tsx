"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { PortalIssue, PortalModuleLabel } from "@/app/actions/portal/types"
import { UAT_COLUMNS, type UATColumn, type AllowedTransitions } from "@/lib/uat-mapping"
import { PRIORITY_CONFIG, getIssueUATColumn } from "@/components/portal/portal-issue-utils"
import { PortalIssueActions } from "@/components/portal/PortalIssueActions"
import { ReportIssueTrigger } from "@/components/portal/ReportIssueTrigger"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ExternalLink, Download, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePortalUser } from "@/components/portal/PortalUserContext"

interface UATIssuesTableProps {
    teamId: string
    issues: PortalIssue[]
    allowedTransitions: AllowedTransitions
    moduleLabels?: PortalModuleLabel[]
}

function exportCSV(issues: PortalIssue[]) {
    const headers = ["Identifier", "Title", "Status", "Priority", "Project", "Labels", "Assignee", "Created", "Updated"]
    const rows = issues.map(i => {
        const col = getIssueUATColumn(i)
        const colTitle = UAT_COLUMNS.find(c => c.id === col)?.title ?? i.state.name
        return [
            i.identifier,
            `"${i.title.replace(/"/g, '""')}"`,
            colTitle,
            PRIORITY_CONFIG[i.priority]?.label ?? String(i.priority),
            i.project?.name ?? "",
            i.labels.map(l => l.name).join("; "),
            i.assignee?.name ?? "",
            i.createdAt.slice(0, 10),
            i.updatedAt.slice(0, 10),
        ]
    })

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `uat-issues-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
}

export function UATIssuesTable({ teamId, issues, allowedTransitions, moduleLabels = [] }: UATIssuesTableProps) {
    const router = useRouter()
    const { isStaffOrPreview } = usePortalUser()
    const [search, setSearch] = useState("")
    const [filterColumn, setFilterColumn] = useState<UATColumn | "__all__">("__all__")
    const [filterPriority, setFilterPriority] = useState<string>("__all__")

    const filtered = useMemo(() => {
        return issues.filter(i => {
            const col = getIssueUATColumn(i)
            if (filterColumn !== "__all__" && col !== filterColumn) return false
            if (filterPriority !== "__all__" && String(i.priority) !== filterPriority) return false
            if (search) {
                const q = search.toLowerCase()
                if (
                    !i.title.toLowerCase().includes(q) &&
                    !i.identifier.toLowerCase().includes(q) &&
                    !i.labels.some(l => l.name.toLowerCase().includes(q)) &&
                    !(i.project?.name.toLowerCase().includes(q))
                ) return false
            }
            return true
        })
    }, [issues, filterColumn, filterPriority, search])

    const hasFilters = filterColumn !== "__all__" || filterPriority !== "__all__" || search

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search issues…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                    />
                </div>

                <Select value={filterColumn} onValueChange={v => setFilterColumn(v as UATColumn | "__all__")}>
                    <SelectTrigger className="h-8 w-[160px] text-sm">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All statuses</SelectItem>
                        {UAT_COLUMNS.map(col => (
                            <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="h-8 w-[140px] text-sm">
                        <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All priorities</SelectItem>
                        <SelectItem value="1">Urgent</SelectItem>
                        <SelectItem value="2">High</SelectItem>
                        <SelectItem value="3">Medium</SelectItem>
                        <SelectItem value="4">Low</SelectItem>
                        <SelectItem value="0">No priority</SelectItem>
                    </SelectContent>
                </Select>

                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground"
                        onClick={() => { setSearch(""); setFilterColumn("__all__"); setFilterPriority("__all__") }}
                    >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Clear
                    </Button>
                )}

                <div className="ml-auto flex items-center gap-1.5">
                    <ReportIssueTrigger teamId={teamId} moduleLabels={moduleLabels} />
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => exportCSV(filtered)}
                    >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                {filtered.length} of {issues.length} issues
            </p>

            {/* Table */}
            <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground w-20">ID</th>
                                <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">Title</th>
                                <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground w-28">Status</th>
                                <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground w-20">Priority</th>
                                <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground w-32 hidden sm:table-cell">Project</th>
                                <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground w-8"></th>
                                <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                                        No issues match the current filters.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(issue => {
                                    const col = getIssueUATColumn(issue)
                                    const colDef = UAT_COLUMNS.find(c => c.id === col)

                                    return (
                                        <tr key={issue.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-2.5">
                                                <Link href={`/uat/${teamId}/${issue.id}`} className="block">
                                                    <span className="font-mono text-[10px] text-muted-foreground">{issue.identifier}</span>
                                                </Link>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <Link href={`/uat/${teamId}/${issue.id}`} className="flex items-center gap-2">
                                                    <span className="text-sm leading-snug line-clamp-1">{issue.title}</span>
                                                    <div className="flex gap-1 shrink-0">
                                                        {issue.labels.slice(0, 2).map(label => (
                                                            <Badge
                                                                key={label.id}
                                                                variant="outline"
                                                                className="text-[9px] px-1 py-0 h-3.5 font-normal hidden sm:inline-flex"
                                                                style={{ borderColor: label.color + "60", color: label.color }}
                                                            >
                                                                {label.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="h-1.5 w-1.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: colDef?.color ?? "#64748b" }}
                                                    />
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {colDef?.title ?? issue.state.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={cn("text-xs font-medium", PRIORITY_CONFIG[issue.priority]?.textColor)}>
                                                    {PRIORITY_CONFIG[issue.priority]?.label ?? issue.priority}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 hidden sm:table-cell">
                                                <span className="text-xs text-muted-foreground truncate max-w-[120px] block">
                                                    {issue.project?.name ?? "—"}
                                                </span>
                                            </td>
                                            {isStaffOrPreview && (
                                                <td className="px-3 py-2.5">
                                                    <a
                                                        href={issue.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                                        title="Open in Linear"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </td>
                                            )}
                                            <td className="px-3 py-2.5">
                                                {col && (allowedTransitions[col] ?? []).length > 0 && (
                                                    <PortalIssueActions
                                                        issueId={issue.id}
                                                        currentCol={col}
                                                        allowedTransitions={allowedTransitions[col] ?? []}
                                                        onSuccess={() => router.refresh()}
                                                        layout="pill"
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}

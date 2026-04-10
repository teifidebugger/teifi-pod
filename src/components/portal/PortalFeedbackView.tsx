"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import type { PortalIssue, PortalWorkflowState, PortalModuleLabel } from "@/app/actions/portal/types"
import { type AllowedTransitions } from "@/lib/uat-mapping"
import {
    PRIORITY_FILTER_OPTIONS, NEEDS_REVIEW_COLS,
    getIssueUATColumn, separateIssues,
} from "@/components/portal/portal-issue-utils"
import { AcceptanceBoard } from "@/components/portal/AcceptanceBoard"
import { UATKanban } from "@/components/portal/UATKanban"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Search, List, Columns3, X, ChevronDown, Tag } from "lucide-react"


type ViewMode = "list" | "board"
type Scope = "needs-review" | "all"

const STORAGE_KEY_PREFIX = "portal-feedback-view-"

interface PortalFeedbackViewProps {
    teamId: string
    issues: PortalIssue[]
    states: PortalWorkflowState[]
    moduleLabels: PortalModuleLabel[]
    allowedTransitions?: AllowedTransitions
    onActionComplete?: () => void
}

export function PortalFeedbackView({ teamId, issues, states, moduleLabels, allowedTransitions = {}, onActionComplete }: PortalFeedbackViewProps) {
    // Persist view mode per team in localStorage
    const [viewMode, setViewMode] = useState<ViewMode>("board")
    const [scope, setScope] = useState<Scope>("needs-review")
    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [selectedModuleLabelId, setSelectedModuleLabelId] = useState<string | null>(null)
    const [selectedPriorities, setSelectedPriorities] = useState<Set<number>>(new Set())

    // Load persisted view mode
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_PREFIX + teamId)
            if (saved === "list" || saved === "board") setViewMode(saved)
        } catch {}
    }, [teamId])

    // Persist view mode changes
    const handleViewChange = useCallback((mode: ViewMode) => {
        setViewMode(mode)
        try { localStorage.setItem(STORAGE_KEY_PREFIX + teamId, mode) } catch {}
    }, [teamId])

    // Debounce search input (150ms)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 150)
        return () => clearTimeout(timer)
    }, [search])

    // Filter issues by scope, search, module, priority
    const filteredIssues = useMemo(() => {
        let result = issues

        // Scope filter: "needs-review" = submitted + client-review + blocked
        if (scope === "needs-review") {
            result = result.filter(issue => {
                const col = getIssueUATColumn(issue)
                return col !== null && NEEDS_REVIEW_COLS.includes(col)
            })
        }

        // Module filter
        if (selectedModuleLabelId !== null) {
            result = result.filter(issue => issue.labels.some(l => l.id === selectedModuleLabelId))
        }

        // Priority filter
        if (selectedPriorities.size > 0) {
            result = result.filter(issue => selectedPriorities.has(issue.priority))
        }

        // Search filter
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase()
            result = result.filter(issue =>
                issue.title.toLowerCase().includes(q) ||
                issue.identifier.toLowerCase().includes(q) ||
                issue.labels.some(l => l.name.toLowerCase().includes(q))
            )
        }

        return result
    }, [issues, scope, selectedModuleLabelId, selectedPriorities, debouncedSearch])

    // Available labels for Module filter: configured moduleLabels, or derived from issues
    const availableLabels = useMemo(() => {
        if (moduleLabels.length > 0) return moduleLabels
        return Array.from(
            new Map(issues.flatMap(i => i.labels).map(l => [l.id, l])).values()
        ).sort((a, b) => a.name.localeCompare(b.name))
    }, [issues, moduleLabels])

    // Counts — top-level issues only (exclude sub-issues / acceptance criteria)
    const { topLevelCount, subIssueCount, needsReviewCount } = useMemo(() => {
        const { topLevel, subIssueMap } = separateIssues(issues)
        const subIssueCount = [...subIssueMap.values()].reduce((s, a) => s + a.length, 0)
        const needsReviewCount = topLevel.filter(i => {
            const col = getIssueUATColumn(i)
            return col !== null && NEEDS_REVIEW_COLS.includes(col)
        }).length
        return { topLevelCount: topLevel.length, subIssueCount, needsReviewCount }
    }, [issues])

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 md:px-6 py-3 border-b border-border/50">
                {/* Scope pills */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                    <button
                        onClick={() => setScope("needs-review")}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                            scope === "needs-review"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Needs Review
                        {needsReviewCount > 0 && (
                            <span className={cn(
                                "ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0 text-[10px] font-semibold tabular-nums min-w-[18px] h-[18px]",
                                scope === "needs-review"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                    : "bg-muted-foreground/20 text-muted-foreground"
                            )}>
                                {needsReviewCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setScope("all")}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                            scope === "all"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        All
                        <span className={cn(
                            "ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0 text-[10px] font-semibold tabular-nums min-w-[18px] h-[18px]",
                            scope === "all"
                                ? "bg-muted text-muted-foreground"
                                : "bg-muted-foreground/20 text-muted-foreground"
                        )}>
                            {topLevelCount}
                        </span>
                        {subIssueCount > 0 && (
                            <span className="ml-1 text-[10px] text-muted-foreground/60 font-normal tabular-nums">
                                +{subIssueCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search issues…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Label / Module filter */}
                {availableLabels.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className={cn(
                                "h-8 gap-1.5 text-xs",
                                selectedModuleLabelId && "border-primary/50 text-primary"
                            )}>
                                <Tag className="h-3.5 w-3.5" />
                                {selectedModuleLabelId
                                    ? (availableLabels.find(m => m.id === selectedModuleLabelId)?.name ?? "Label")
                                    : "Label"}
                                <ChevronDown className="h-3 w-3 opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[160px]">
                            <DropdownMenuItem
                                onSelect={() => setSelectedModuleLabelId(null)}
                                className={cn("text-xs", selectedModuleLabelId === null && "font-semibold")}
                            >
                                All labels
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {availableLabels.map(label => (
                                <DropdownMenuItem
                                    key={label.id}
                                    onSelect={() => setSelectedModuleLabelId(label.id === selectedModuleLabelId ? null : label.id)}
                                    className={cn("text-xs gap-2", selectedModuleLabelId === label.id && "font-semibold")}
                                >
                                    <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                                    {label.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Priority filter pills */}
                <div className="flex items-center gap-0.5">
                    {PRIORITY_FILTER_OPTIONS.map(p => {
                        const active = selectedPriorities.has(p.value)
                        return (
                            <button
                                key={p.value}
                                onClick={() => setSelectedPriorities(prev => {
                                    const next = new Set(prev)
                                    if (next.has(p.value)) next.delete(p.value)
                                    else next.add(p.value)
                                    return next
                                })}
                                title={p.label}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors border",
                                    active
                                        ? "bg-accent text-accent-foreground border-border"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                                )}
                            >
                                <span className={cn("h-1.5 w-1.5 rounded-full", p.colorClass)} />
                                <span className="hidden sm:inline">{p.label}</span>
                            </button>
                        )
                    })}
                    {selectedPriorities.size > 0 && (
                        <button
                            onClick={() => setSelectedPriorities(new Set())}
                            className="ml-1 text-muted-foreground hover:text-foreground"
                            title="Clear priority filter"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                <div className="flex-1" />

                {/* View toggle */}
                <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
                    <button
                        onClick={() => handleViewChange("list")}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                            viewMode === "list"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        title="List view"
                    >
                        <List className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">List</span>
                    </button>
                    <button
                        onClick={() => handleViewChange("board")}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                            viewMode === "board"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Board view"
                    >
                        <Columns3 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Board</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {viewMode === "list" ? (
                    <div className="h-full overflow-y-auto px-4 md:px-6 py-4">
                        <AcceptanceBoard
                            teamId={teamId}
                            issues={filteredIssues}
                            allIssues={issues}
                            moduleLabels={moduleLabels}
                            allowedTransitions={allowedTransitions}
                            onActionComplete={onActionComplete}
                        />
                    </div>
                ) : (
                    <UATKanban
                        teamId={teamId}
                        initialIssues={filteredIssues}
                        states={states}
                        moduleLabels={moduleLabels}
                        allowedTransitions={allowedTransitions}
                        onActionComplete={onActionComplete}
                    />
                )}
            </div>
        </div>
    )
}

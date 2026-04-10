"use client"

import { useState, useCallback, useMemo } from "react"
import { UATDashboard } from "@/components/portal/UATDashboard"
import { UATIssuesTable } from "@/components/portal/UATIssuesTable"
import { PortalFeedbackView } from "@/components/portal/PortalFeedbackView"
import type { PortalIssue, PortalWorkflowState, PortalModuleLabel } from "@/app/actions/portal/types"
import { getPortalStats, type PortalStats } from "@/app/actions/portal-stats"
import { type AllowedTransitions } from "@/lib/uat-mapping"
import { getIssueUATColumn } from "@/components/portal/portal-issue-utils"
import { cn } from "@/lib/utils"
import { LayoutDashboard, MessageSquare, List } from "lucide-react"
import { useRouter } from "next/navigation"

interface PortalTeamTabsProps {
    teamId: string
    initialIssues: PortalIssue[]
    states: PortalWorkflowState[]
    initialStats: PortalStats
    moduleLabels: PortalModuleLabel[]
    allowedTransitions: AllowedTransitions
    isAdmin?: boolean
}

type Tab = "dashboard" | "feedback" | "issues"

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "dashboard", label: "Dashboard",  icon: LayoutDashboard },
    { id: "feedback",  label: "Feedback",   icon: MessageSquare },
    { id: "issues",    label: "All Issues", icon: List },
]

export function PortalTeamTabs({ teamId, initialIssues, states, initialStats, moduleLabels, allowedTransitions, isAdmin }: PortalTeamTabsProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<Tab>("feedback")
    const [stats, setStats] = useState<PortalStats>(initialStats)

    const refreshStats = useCallback(async () => {
        try {
            const fresh = await getPortalStats(teamId)
            setStats(fresh)
        } catch {}
    }, [teamId])

    // Badge count: top-level issues where the client has at least one allowed transition
    const feedbackCount = useMemo(() =>
        initialIssues.filter(i => {
            if (i.parent !== null) return false
            const col = getIssueUATColumn(i)
            return col !== null && (allowedTransitions[col]?.length ?? 0) > 0
        }).length,
        [initialIssues, allowedTransitions]
    )

    const badges: Partial<Record<Tab, { count: number; color: string }>> = {
        feedback: feedbackCount > 0 ? { count: feedbackCount, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" } : undefined,
    }

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* Tab bar */}
            <div className="shrink-0 flex items-center border-b border-border px-4 md:px-6">
                <div className="flex items-center gap-0.5 flex-1">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const badge = badges[tab.id]
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px rounded-t-sm",
                                    isActive
                                        ? "border-primary text-foreground bg-transparent"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                                )}
                            >
                                <Icon className={cn("h-3.5 w-3.5", isActive ? "text-foreground" : "text-muted-foreground")} />
                                <span>{tab.label}</span>
                                {badge && (
                                    <span className={cn(
                                        "ml-0.5 inline-flex items-center justify-center rounded-full px-1.5 py-0 text-[10px] font-semibold tabular-nums min-w-[18px] h-[18px]",
                                        badge.color
                                    )}>
                                        {badge.count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "dashboard" && (
                    <div className="h-full overflow-y-auto px-4 md:px-6 py-4">
                        <UATDashboard stats={stats} teamId={teamId} onGoToBoard={() => setActiveTab("feedback")} isAdmin={isAdmin} />
                    </div>
                )}
                {activeTab === "feedback" && (
                    <PortalFeedbackView
                        teamId={teamId}
                        issues={initialIssues}
                        states={states}
                        moduleLabels={moduleLabels}
                        allowedTransitions={allowedTransitions}
                        onActionComplete={() => { router.refresh(); refreshStats() }}
                    />
                )}
                {activeTab === "issues" && (
                    <div className="h-full overflow-y-auto px-4 md:px-6 py-4">
                        <UATIssuesTable teamId={teamId} issues={initialIssues} allowedTransitions={allowedTransitions} moduleLabels={moduleLabels} />
                    </div>
                )}
            </div>
        </div>
    )
}

"use server"

import { getPortalIssues } from "@/app/actions/portal"
import { type UATColumn } from "@/lib/uat-mapping"
import { getIssueUATColumn, PRIORITY_CONFIG, separateIssues } from "@/components/portal/portal-issue-utils"
import { getAdminMetrics, type AdminMetrics } from "./events"

export type PortalStats = {
    // KPI cards
    total: number
    pendingReview: number
    approved: number
    blocked: number
    passRate: number // 0–100

    // Aging: issues in client-review for >N days
    aging: Array<{ id: string; identifier: string; title: string; daysWaiting: number }>

    // By label
    byLabel: Array<{ name: string; color: string; count: number }>

    // By project
    byProject: Array<{ name: string; count: number }>

    // By priority
    byPriority: Array<{ priority: number; label: string; count: number }>

    // Approval trend: last 7 days
    approvalTrend: Array<{ date: string; approved: number; blocked: number }>

    // Burndown: last 30 days
    burndown: Array<{ date: string; total: number; completed: number }>

    // Column distribution
    byColumn: Record<UATColumn, number>

    // Admin-only metrics (populated when opts.includeAdminMetrics = true)
    adminMetrics?: AdminMetrics
}


export async function getPortalStats(
    teamId: string,
    opts?: { includeAdminMetrics?: boolean },
): Promise<PortalStats> {
    const allIssues = await getPortalIssues(teamId)

    // All KPIs are scoped to top-level issues only (parent === null).
    // Sub-issues are counted in the context of their parent, never added to top-level totals.
    const { topLevel: issues } = separateIssues(allIssues)

    const now = new Date()
    const total = issues.length

    // Column buckets
    const byColumn: Record<UATColumn, number> = {
        backlog: 0,
        submitted: 0,
        "not-started": 0,
        "in-development": 0,
        "client-review": 0,
        blocked: 0,
        done: 0,
        released: 0,
        archived: 0,
        canceled: 0,
    }

    for (const issue of issues) {
        const col = getIssueUATColumn(issue)
        if (col) byColumn[col]++
    }

    const pendingReview = byColumn["client-review"]
    const approved = byColumn["done"] + byColumn["released"]
    const blocked = byColumn["blocked"]
    const total_resolved = approved + blocked
    const passRate = total_resolved > 0 ? Math.round((approved / total_resolved) * 100) : 0

    // Aging: top-level issues in client-review column
    const aging = issues
        .filter(i => getIssueUATColumn(i) === "client-review")
        .map(i => {
            const createdAt = new Date(i.updatedAt)
            const daysWaiting = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
            return { id: i.id, identifier: i.identifier, title: i.title, daysWaiting }
        })
        .sort((a, b) => b.daysWaiting - a.daysWaiting)
        .slice(0, 10)

    // By label
    const labelMap = new Map<string, { name: string; color: string; count: number }>()
    for (const issue of issues) {
        for (const label of issue.labels) {
            const existing = labelMap.get(label.id)
            if (existing) {
                existing.count++
            } else {
                labelMap.set(label.id, { name: label.name, color: label.color, count: 1 })
            }
        }
    }
    const byLabel = Array.from(labelMap.values()).sort((a, b) => b.count - a.count).slice(0, 10)

    // By project
    const projectMap = new Map<string, { name: string; count: number }>()
    for (const issue of issues) {
        if (!issue.project) continue
        const existing = projectMap.get(issue.project.id)
        if (existing) {
            existing.count++
        } else {
            projectMap.set(issue.project.id, { name: issue.project.name, count: 1 })
        }
    }
    const byProject = Array.from(projectMap.values()).sort((a, b) => b.count - a.count).slice(0, 10)

    // By priority
    const priorityMap = new Map<number, number>()
    for (const issue of issues) {
        priorityMap.set(issue.priority, (priorityMap.get(issue.priority) ?? 0) + 1)
    }
    const byPriority = Array.from(priorityMap.entries())
        .map(([priority, count]) => ({ priority, label: PRIORITY_CONFIG[priority]?.label ?? `P${priority}`, count }))
        .sort((a, b) => a.priority - b.priority)

    // Approval trend: bucket approved/blocked issues by updatedAt into last 7 days
    const trend = new Map<string, { approved: number; blocked: number }>()
    for (let d = 6; d >= 0; d--) {
        const date = new Date(now)
        date.setDate(date.getDate() - d)
        const key = date.toISOString().slice(0, 10)
        trend.set(key, { approved: 0, blocked: 0 })
    }
    for (const issue of issues) {
        const col = getIssueUATColumn(issue)
        if (col !== "done" && col !== "blocked") continue
        const key = issue.updatedAt.slice(0, 10)
        const entry = trend.get(key)
        if (!entry) continue
        if (col === "done") entry.approved++
        else entry.blocked++
    }
    const approvalTrend = Array.from(trend.entries()).map(([date, v]) => ({ date, ...v }))

    // Burndown: cumulative created + completed over last 30 days
    const burndownDates: string[] = []
    for (let d = 29; d >= 0; d--) {
        const date = new Date(now)
        date.setDate(date.getDate() - d)
        burndownDates.push(date.toISOString().slice(0, 10))
    }
    const createdByDate = new Map<string, number>()
    for (const issue of issues) {
        const key = issue.createdAt.slice(0, 10)
        createdByDate.set(key, (createdByDate.get(key) ?? 0) + 1)
    }
    const completedByDate = new Map<string, number>()
    for (const issue of issues) {
        if (!issue.completedAt) continue
        const key = issue.completedAt.slice(0, 10)
        completedByDate.set(key, (completedByDate.get(key) ?? 0) + 1)
    }
    // Count issues created before the 30-day window for baseline
    const windowStart = burndownDates[0]
    let cumulativeTotal = 0
    let cumulativeCompleted = 0
    for (const issue of issues) {
        if (issue.createdAt.slice(0, 10) < windowStart) cumulativeTotal++
        if (issue.completedAt && issue.completedAt.slice(0, 10) < windowStart) cumulativeCompleted++
    }
    const burndown = burndownDates.map(date => {
        cumulativeTotal += createdByDate.get(date) ?? 0
        cumulativeCompleted += completedByDate.get(date) ?? 0
        return { date, total: cumulativeTotal, completed: cumulativeCompleted }
    })

    const adminMetrics = opts?.includeAdminMetrics
        ? await getAdminMetrics(teamId, allIssues)
        : undefined

    return {
        total,
        pendingReview,
        approved,
        blocked,
        passRate,
        aging,
        byLabel,
        byProject,
        byPriority,
        approvalTrend,
        burndown,
        byColumn,
        adminMetrics,
    }
}

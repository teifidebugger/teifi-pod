"use server"

import { prisma } from "@/lib/prisma"
import { PortalEventType } from "@prisma/client"
import type { PortalIssue } from "@/app/actions/portal/types"

const SLA_DAYS = 3

export type AdminMetrics = {
    avgCycleTimeDays: number | null
    avgVelocityDays: number | null
    firstPassRate: number | null
    reworkIndex: number | null
    clientResponsivenessRate: number | null
    throughput: Array<{ week: string; created: number; resolved: number; net: number }>
    blockRateByLabel: Array<{ name: string; color: string; blockRate: number; total: number }>
    velocitySampleSize: number
    cycleTimeSampleSize: number
}

function median(nums: number[]): number | null {
    if (nums.length === 0) return null
    const sorted = [...nums].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid]
}

function isoWeek(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const day = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - day)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

function last8Weeks(): string[] {
    const weeks: string[] = []
    const now = new Date()
    for (let i = 7; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i * 7)
        const w = isoWeek(d)
        if (!weeks.includes(w)) weeks.push(w)
    }
    return weeks.slice(-8)
}

type TeamEvent = {
    teamId: string | null
    issueId: string | null
    eventType: PortalEventType
    fromColumn: string | null
    toColumn: string | null
    createdAt: Date
}

function computeTeamMetrics(
    byIssue: Map<string, TeamEvent[]>,
    teamEvents: TeamEvent[],
    teamIssues: PortalIssue[],
    weekLabels: string[],
): AdminMetrics {
    const RESOLVED_COLS = new Set(["done", "released"])

    const cycleDurations: number[] = []
    for (const [, evs] of byIssue) {
        const createdEv = evs.find(e => e.eventType === PortalEventType.issue_created)
        const resolvedEv = evs.find(e => e.eventType === PortalEventType.issue_column_moved && e.toColumn && RESOLVED_COLS.has(e.toColumn))
        if (createdEv && resolvedEv) {
            const days = (resolvedEv.createdAt.getTime() - createdEv.createdAt.getTime()) / 86400000
            if (days >= 0) cycleDurations.push(days)
        }
    }

    const velocityDurations: number[] = []
    for (const [, evs] of byIssue) {
        const handoff = [...evs].reverse().find(e =>
            e.eventType === PortalEventType.issue_column_moved && e.toColumn === "client-review"
        )
        if (!handoff) continue
        const response = evs.find(e =>
            e.eventType === PortalEventType.issue_column_moved &&
            (e.toColumn === "done" || e.toColumn === "blocked") &&
            e.createdAt > handoff.createdAt
        )
        if (response) {
            const days = (response.createdAt.getTime() - handoff.createdAt.getTime()) / 86400000
            if (days >= 0) velocityDurations.push(days)
        }
    }

    const resolvedIssueIds = new Set<string>()
    for (const [id, evs] of byIssue) {
        if (evs.some(e => e.eventType === PortalEventType.issue_column_moved && e.toColumn && RESOLVED_COLS.has(e.toColumn))) {
            resolvedIssueIds.add(id)
        }
    }

    let firstPassCount = 0
    let reworkCount = 0
    for (const id of resolvedIssueIds) {
        const evs = byIssue.get(id)
        if (!evs) continue
        const resolvedEv = evs.find(e => e.eventType === PortalEventType.issue_column_moved && e.toColumn && RESOLVED_COLS.has(e.toColumn))
        if (!resolvedEv) continue
        const resolvedAt = resolvedEv.createdAt
        const blockedTimes = evs.filter(e =>
            e.eventType === PortalEventType.issue_column_moved &&
            e.toColumn === "blocked" &&
            e.createdAt < resolvedAt
        ).length
        if (blockedTimes === 0) firstPassCount++
        if (blockedTimes >= 2) reworkCount++
    }
    const totalResolved = resolvedIssueIds.size

    let totalHandoffs = 0
    let responsiveHandoffs = 0
    for (const [, evs] of byIssue) {
        const handoffs = evs.filter(e =>
            e.eventType === PortalEventType.issue_column_moved && e.toColumn === "client-review"
        )
        for (const handoff of handoffs) {
            totalHandoffs++
            const response = evs.find(e =>
                e.eventType === PortalEventType.issue_column_moved &&
                (e.toColumn === "done" || e.toColumn === "blocked") &&
                e.createdAt > handoff.createdAt
            )
            if (response) {
                const days = (response.createdAt.getTime() - handoff.createdAt.getTime()) / 86400000
                if (days <= SLA_DAYS) responsiveHandoffs++
            }
        }
    }

    const weekSet = new Set(weekLabels)
    const createdByWeek = new Map<string, number>()
    const resolvedByWeek = new Map<string, number>()
    for (const w of weekLabels) {
        createdByWeek.set(w, 0)
        resolvedByWeek.set(w, 0)
    }
    for (const ev of teamEvents) {
        const w = isoWeek(ev.createdAt)
        if (!weekSet.has(w)) continue
        if (ev.eventType === PortalEventType.issue_created) {
            createdByWeek.set(w, (createdByWeek.get(w) ?? 0) + 1)
        } else if (ev.eventType === PortalEventType.issue_column_moved && ev.toColumn && RESOLVED_COLS.has(ev.toColumn)) {
            resolvedByWeek.set(w, (resolvedByWeek.get(w) ?? 0) + 1)
        }
    }
    const throughput = weekLabels.map(week => {
        const created = createdByWeek.get(week) ?? 0
        const resolved = resolvedByWeek.get(week) ?? 0
        return { week, created, resolved, net: resolved - created }
    })

    const blockedIssueIds = new Set<string>()
    for (const [id, evs] of byIssue) {
        if (evs.some(e => e.eventType === PortalEventType.issue_column_moved && e.toColumn === "blocked")) {
            blockedIssueIds.add(id)
        }
    }
    const labelMap = new Map<string, { name: string; color: string; total: number; blocked: number }>()
    for (const issue of teamIssues) {
        for (const label of issue.labels) {
            const entry = labelMap.get(label.id) ?? { name: label.name, color: label.color, total: 0, blocked: 0 }
            entry.total++
            if (blockedIssueIds.has(issue.id)) entry.blocked++
            labelMap.set(label.id, entry)
        }
    }
    const blockRateByLabel = Array.from(labelMap.values())
        .filter(l => l.total > 0)
        .map(l => ({
            name: l.name,
            color: l.color,
            blockRate: Math.round((l.blocked / l.total) * 100),
            total: l.total,
        }))
        .sort((a, b) => b.blockRate - a.blockRate)
        .slice(0, 10)

    return {
        avgCycleTimeDays: cycleDurations.length >= 3 ? median(cycleDurations) : null,
        avgVelocityDays: velocityDurations.length >= 3 ? median(velocityDurations) : null,
        firstPassRate: totalResolved > 0 ? Math.round((firstPassCount / totalResolved) * 100) : null,
        reworkIndex: totalResolved > 0 ? Math.round((reworkCount / totalResolved) * 100) : null,
        clientResponsivenessRate: totalHandoffs > 0 ? Math.round((responsiveHandoffs / totalHandoffs) * 100) : null,
        throughput,
        blockRateByLabel,
        velocitySampleSize: velocityDurations.length,
        cycleTimeSampleSize: cycleDurations.length,
    }
}

export async function getAdminMetrics(teamId: string, issues: PortalIssue[]): Promise<AdminMetrics> {
    const events = await prisma.portalEvent.findMany({
        where: { teamId },
        select: {
            teamId: true,
            issueId: true,
            eventType: true,
            fromColumn: true,
            toColumn: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    })

    const byIssue = new Map<string, typeof events>()
    for (const ev of events) {
        if (!ev.issueId) continue
        const arr = byIssue.get(ev.issueId)
        if (arr) arr.push(ev)
        else byIssue.set(ev.issueId, [ev])
    }

    return computeTeamMetrics(byIssue, events, issues, last8Weeks())
}

export async function getWorkspaceAdminMetrics(
    workspaceId: string,
    issuesByTeam: Map<string, PortalIssue[]>,
): Promise<Map<string, AdminMetrics>> {
    const teamIds = Array.from(issuesByTeam.keys())
    if (teamIds.length === 0) return new Map()

    const since = new Date()
    since.setDate(since.getDate() - 60)

    const events = await prisma.portalEvent.findMany({
        where: {
            workspaceId,
            teamId: { in: teamIds },
            createdAt: { gte: since },
        },
        select: {
            teamId: true,
            issueId: true,
            eventType: true,
            fromColumn: true,
            toColumn: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    })

    const eventsByTeam = new Map<string, typeof events>()
    for (const ev of events) {
        if (!ev.teamId) continue
        const arr = eventsByTeam.get(ev.teamId)
        if (arr) arr.push(ev)
        else eventsByTeam.set(ev.teamId, [ev])
    }

    const weekLabels = last8Weeks()
    const result = new Map<string, AdminMetrics>()

    for (const teamId of teamIds) {
        const teamEvents = eventsByTeam.get(teamId) ?? []
        const teamIssues = issuesByTeam.get(teamId) ?? []

        const byIssue = new Map<string, typeof teamEvents>()
        for (const ev of teamEvents) {
            if (!ev.issueId) continue
            const arr = byIssue.get(ev.issueId)
            if (arr) arr.push(ev)
            else byIssue.set(ev.issueId, [ev])
        }

        result.set(teamId, computeTeamMetrics(byIssue, teamEvents, teamIssues, weekLabels))
    }

    return result
}

export type ClientEngagementStats = {
    loginCount30d: number
    uniqueActiveUsers30d: number
    issueViewCount30d: number
}

export async function getWorkspaceEngagementStats(workspaceId: string): Promise<Map<string, ClientEngagementStats>> {
    const since = new Date()
    since.setDate(since.getDate() - 30)

    const events = await prisma.portalEvent.findMany({
        where: {
            workspaceId,
            eventType: { in: [PortalEventType.user_login, PortalEventType.issue_viewed] },
            createdAt: { gte: since },
        },
        select: { clientId: true, userId: true, eventType: true },
    })

    const result = new Map<string, ClientEngagementStats>()
    const clientLogins = new Map<string, number>()
    const clientUsers = new Map<string, Set<string>>()
    const clientViews = new Map<string, number>()

    for (const ev of events) {
        if (ev.eventType === PortalEventType.user_login) {
            clientLogins.set(ev.clientId, (clientLogins.get(ev.clientId) ?? 0) + 1)
            if (!clientUsers.has(ev.clientId)) clientUsers.set(ev.clientId, new Set())
            clientUsers.get(ev.clientId)?.add(ev.userId)
        } else if (ev.eventType === PortalEventType.issue_viewed) {
            clientViews.set(ev.clientId, (clientViews.get(ev.clientId) ?? 0) + 1)
        }
    }

    const allClientIds = new Set([...clientLogins.keys(), ...clientViews.keys()])
    for (const clientId of allClientIds) {
        result.set(clientId, {
            loginCount30d: clientLogins.get(clientId) ?? 0,
            uniqueActiveUsers30d: clientUsers.get(clientId)?.size ?? 0,
            issueViewCount30d: clientViews.get(clientId) ?? 0,
        })
    }

    return result
}

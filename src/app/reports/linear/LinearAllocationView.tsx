'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalLink, ChevronDown, ChevronRight, Search, Users, LayoutList, AlertCircle, BarChart2, Layers, Bookmark, BookmarkCheck } from 'lucide-react'
import { format, parseISO, formatDistanceToNow, differenceInMinutes } from 'date-fns'
import type { MemberAllocationData, LinearIssue, LinearReportFilters, InvolvedUser, WeekAllocation } from './page'

const STATUS_ORDER = [
    'In Progress',
    'QA',
    'Pending Code Review',
    'Client Review',
    'Blocked',
    'Client Blocked',
    'Evaluation',
    'Not Started',
]

// States where knowing who else is involved is most critical (Release Ready excluded — task is done, just queued for deploy)
const WAITING_STATES = new Set(['QA', 'Pending Code Review', 'Client Review', 'Client Blocked', 'Blocked'])

// Urgency order for waiting panel
const WAITING_URGENCY: Record<string, number> = {
    'Blocked': 0,
    'Client Blocked': 1,
    'QA': 2,
    'Client Review': 3,
    'Pending Code Review': 4,
}

const PRIORITY_LABEL: Record<number, string> = {
    0: '—',
    1: 'Urgent',
    2: 'High',
    3: 'Medium',
    4: 'Low',
}

// State bar segment colors
const STATE_BAR_COLOR: Record<string, string> = {
    'In Progress': 'bg-blue-500',
    'QA': 'bg-purple-500',
    'Pending Code Review': 'bg-yellow-500',
    'Release Ready': 'bg-emerald-500',
    'Client Review': 'bg-emerald-400',
    'Blocked': 'bg-red-500',
    'Client Blocked': 'bg-red-400',
}

function statusVariant(name: string): string {
    switch (name) {
        case 'In Progress':
            return 'border-blue-500/40 bg-blue-500/10 text-blue-400'
        case 'QA':
            return 'border-purple-500/40 bg-purple-500/10 text-purple-400'
        case 'Pending Code Review':
            return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
        case 'Release Ready':
        case 'Client Review':
            return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
        case 'Blocked':
        case 'Client Blocked':
            return 'border-red-500/40 bg-red-500/10 text-red-400'
        default:
            return 'border-border/60 bg-muted/30 text-muted-foreground'
    }
}

function coverageColor(pct: number, hasLinear: boolean): string {
    if (!hasLinear) return 'text-muted-foreground'
    if (pct >= 80) return 'text-emerald-500 dark:text-emerald-400'
    if (pct >= 50) return 'text-amber-500 dark:text-amber-400'
    return 'text-red-500 dark:text-red-400'
}

function coverageBadge(pct: number): string {
    if (pct >= 80)
        return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
    if (pct >= 50)
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
    return 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
}

function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
}

function formatDueDate(dueDate: string): string {
    const d = parseISO(dueDate)
    const sameYear = d.getFullYear() === new Date().getFullYear()
    return format(d, sameYear ? 'MMM d' : 'MMM d, yyyy')
}

function memberInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
}

const AVATAR_COLORS = [
    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
]


function avatarColor(name: string): string {
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function MemberAvatar({ member, size = 24 }: { member: { name: string; avatarUrl: string | null; isPlaceholder?: boolean }; size?: number }) {
    const sizeClass = size === 20 ? 'h-5 w-5 text-[9px]' : size === 24 ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'
    if (member.isPlaceholder) {
        return (
            <span className={`${sizeClass} rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-medium`}>
                {memberInitials(member.name)}
            </span>
        )
    }
    if (member.avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={member.avatarUrl}
                alt={member.name}
                className={`${sizeClass} rounded-full object-cover shrink-0`}
            />
        )
    }
    return (
        <span className={`${sizeClass} rounded-full flex items-center justify-center font-medium shrink-0 ${avatarColor(member.name)}`}>
            {memberInitials(member.name)}
        </span>
    )
}

function InvolvedAvatars({ users, stateName, size = 20 }: { users: InvolvedUser[]; stateName: string; size?: number }) {
    if (users.length === 0) return null
    const isWaiting = WAITING_STATES.has(stateName)
    const sz = size === 20 ? 'h-5 w-5 text-[9px]' : 'h-6 w-6 text-[10px]'
    return (
        <div className="flex items-center" title={users.map((u) => u.name).join(', ')}>
            {users.slice(0, 4).map((u, i) => (
                <span
                    key={u.id}
                    style={{ zIndex: 4 - i, marginLeft: i > 0 ? '-6px' : 0 }}
                    className="relative"
                >
                    {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={u.avatarUrl}
                            alt={u.name}
                            title={u.name}
                            className={`${sz} rounded-full object-cover border-2 ${isWaiting ? 'border-amber-400/60' : 'border-card'}`}
                        />
                    ) : (
                        <span
                            title={u.name}
                            className={`${sz} rounded-full flex items-center justify-center font-medium border-2 ${isWaiting ? 'border-amber-400/60' : 'border-card'} ${avatarColor(u.name)}`}
                        >
                            {memberInitials(u.name)}
                        </span>
                    )}
                </span>
            ))}
            {users.length > 4 && (
                <span className="text-[9px] text-muted-foreground ml-2">+{users.length - 4}</span>
            )}
        </div>
    )
}

// ─── Schedule Gap ──────────────────────────────────────────────────────────────

type InvolvedIssue = LinearIssue & { assigneeName: string; assigneeAvatar: string | null }

type AlignmentStatus = 'misaligned' | 'partial' | 'minor' | 'aligned' | 'no-schedule'

/** States that count as "actively being worked on" for alignment purposes.
 *  Excludes Not Started / Evaluation (backlog/discovery) and Release Ready (deployment queue, not active work). */
const ALIGNMENT_ACTIVE_STATES = new Set([
    'In Progress', 'QA', 'Pending Code Review',
    'Client Review', 'Blocked', 'Client Blocked',
])

const STALE_DAYS = 14

function daysSinceUpdate(updatedAt: string | null): number {
    if (!updatedAt) return 0
    return Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000)
}

function isStale(issue: LinearIssue): boolean {
    return daysSinceUpdate(issue.updatedAt) > STALE_DAYS
}

type AlignmentRow = {
    m: MemberAllocationData
    /** Scheduled project codes (all) */
    forecastCodes: string[]
    /** Scheduled teams that have active issues */
    matchedTeams: string[]
    /** Scheduled teams with NO active issues */
    missingTeams: string[]
    /** Active teams NOT in schedule (schedule has linked teams → genuinely unplanned) */
    extraTeams: string[]
    /** Active teams when schedule has NO linked projects — can't evaluate, show neutral */
    unlinkedActiveTeams: string[]
    alignment: AlignmentStatus
    priority: 'High' | 'Medium' | 'Low' | '—'
}

function computeAlignmentRow(m: MemberAllocationData): AlignmentRow {
    // Only issues that are "active" (exclude Not Started/Evaluation) AND not stale
    const activeIssues = m.issues.filter(
        (i) => ALIGNMENT_ACTIVE_STATES.has(i.stateName) && !isStale(i),
    )
    const activeTeams = new Set(activeIssues.map((i) => i.teamName).filter(Boolean) as string[])

    const allAllocations = m.currentWeekAllocations
    const linkedAllocations = allAllocations.filter((a) => a.linearTeamName)
    const scheduledLinkedTeams = linkedAllocations.map((a) => a.linearTeamName as string)
    const scheduledLinkedSet = new Set(scheduledLinkedTeams)

    // If ANY scheduled project is unlinked, we can't confirm active teams outside
    // scheduledLinkedSet are "extra" — they may come from those unlinked projects.
    const hasUnlinkedSchedule = allAllocations.length > linkedAllocations.length

    const matchedTeams = [...new Set(scheduledLinkedTeams.filter((t) => activeTeams.has(t)))]
    const missingTeams = [...new Set(scheduledLinkedTeams.filter((t) => !activeTeams.has(t)))]
    const potentialExtraTeams = [...activeTeams].filter((t) => !scheduledLinkedSet.has(t))

    // Only flag as confirmed extras when ALL scheduled projects are linked
    const extraTeams = hasUnlinkedSchedule ? [] : potentialExtraTeams
    const unlinkedActiveTeams = hasUnlinkedSchedule ? potentialExtraTeams : []

    const forecastCodes = allAllocations.map((a) => a.projectCode)

    let alignment: AlignmentStatus
    let priority: AlignmentRow['priority']

    if (scheduledLinkedTeams.length === 0) {
        // No projects in schedule have Linear team links — can't evaluate alignment.
        // If there are active issues, surface them neutrally (no ⚠).
        alignment = 'no-schedule'; priority = '—'
        return { m, forecastCodes, matchedTeams: [], missingTeams: [], extraTeams: [], unlinkedActiveTeams: [...activeTeams], alignment, priority }
    } else if (matchedTeams.length === 0 && extraTeams.length > 0) {
        // All linked teams have no active issues, and confirmed-extra teams exist
        alignment = 'misaligned'; priority = 'High'
    } else if (matchedTeams.length < scheduledLinkedTeams.length || extraTeams.length > 1) {
        alignment = 'partial'; priority = 'Medium'
    } else if (extraTeams.length === 1 || missingTeams.length === 1) {
        alignment = 'minor'; priority = 'Low'
    } else {
        alignment = 'aligned'; priority = '—'
    }

    return { m, forecastCodes, matchedTeams, missingTeams, extraTeams, unlinkedActiveTeams, alignment, priority }
}

// ─── Waiting Issues Panel ──────────────────────────────────────────────────────

type WaitingIssue = LinearIssue & {
    assigneeName: string
    assigneeAvatar: string | null
}

function WaitingIssuesPanel({ members }: { members: MemberAllocationData[] }) {
    const [expanded, setExpanded] = useState(true)

    const waitingIssues: WaitingIssue[] = members
        .filter((m) => m.hasLinearToken && !m.isPlaceholder)
        .flatMap((m) =>
            m.issues
                .filter((i) => WAITING_STATES.has(i.stateName))
                .map((i) => ({ ...i, assigneeName: m.name, assigneeAvatar: m.avatarUrl })),
        )
        .sort((a, b) => (WAITING_URGENCY[a.stateName] ?? 99) - (WAITING_URGENCY[b.stateName] ?? 99))

    const count = waitingIssues.length

    return (
        <div className={`rounded-lg border overflow-hidden ${count > 0 ? 'border-amber-400/30 bg-amber-400/5' : 'border-border/40 bg-card'}`}>
            <button
                onClick={() => setExpanded((e) => !e)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/20 transition-colors text-left"
            >
                {count > 0 ? (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                )}
                <span className="text-sm font-medium text-foreground flex-1">
                    {count > 0 ? (
                        <>{count} issue{count !== 1 ? 's' : ''} waiting / blocked</>
                    ) : (
                        'No issues currently blocked or waiting'
                    )}
                </span>
                {count > 0 && (
                    <div className="flex items-center gap-1.5 mr-2">
                        {(['Blocked', 'Client Blocked', 'QA', 'Client Review', 'Pending Code Review'] as const).map((state) => {
                            const n = waitingIssues.filter((i) => i.stateName === state).length
                            if (!n) return null
                            return (
                                <span key={state} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusVariant(state)}`}>
                                    {n} {state === 'Pending Code Review' ? 'PCR' : state}
                                </span>
                            )
                        })}
                    </div>
                )}
                {expanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
            </button>

            {expanded && count > 0 && (
                <div className="border-t border-amber-400/20 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-amber-400/20 bg-amber-400/5">
                                {['Status', 'Issue', 'Title', 'Assignee', 'Involved', 'Pts', 'Due'].map((h) => (
                                    <th key={h} className="py-2 px-3 first:pl-4 last:pr-4 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {waitingIssues.map((issue) => (
                                <tr key={`${issue.id}-${issue.assigneeName}`} className="border-b border-amber-400/10 hover:bg-amber-400/5 transition-colors">
                                    <td className="py-2 pl-4 pr-3 whitespace-nowrap">
                                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusVariant(issue.stateName)}`}>
                                            {issue.stateName === 'Pending Code Review' ? 'PCR' : issue.stateName}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 whitespace-nowrap">
                                        <a
                                            href={issue.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-mono text-xs text-blue-500 hover:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            {issue.identifier}
                                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                        </a>
                                    </td>
                                    <td className="py-2 px-3 max-w-xs">
                                        <span className="text-sm text-foreground/80 line-clamp-1">{issue.title}</span>
                                    </td>
                                    <td className="py-2 px-3 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <MemberAvatar member={{ name: issue.assigneeName, avatarUrl: issue.assigneeAvatar }} size={20} />
                                            <span className="text-xs text-foreground/80">{issue.assigneeName.split(' ')[0]}</span>
                                        </div>
                                    </td>
                                    <td className="py-2 px-3 whitespace-nowrap">
                                        {issue.involvedUsers.length > 0 ? (
                                            <InvolvedAvatars users={issue.involvedUsers} stateName={issue.stateName} size={20} />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-3 whitespace-nowrap">
                                        {issue.estimate !== null ? (
                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{issue.estimate}</span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="py-2 pl-3 pr-4 whitespace-nowrap">
                                        {issue.dueDate ? (
                                            <span className={`text-xs ${isOverdue(issue.dueDate) ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                                {formatDueDate(issue.dueDate)}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {expanded && count === 0 && (
                <div className="border-t border-border/40 px-4 py-3">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ All active issues are in progress — nothing blocked or waiting.</p>
                </div>
            )}
        </div>
    )
}

// ─── Issue Row (table — used in WaitingIssuesPanel) ───────────────────────────

function IssueRow({ issue }: { issue: LinearIssue }) {
    return (
        <tr className="border-b border-border/40 hover:bg-muted/20 transition-colors">
            <td className="py-2 pl-4 pr-2 w-28">
                <a href={issue.url} target="_blank" rel="noreferrer"
                    className="font-mono text-xs text-blue-500 hover:text-blue-400 hover:underline flex items-center gap-1 whitespace-nowrap">
                    {issue.identifier}
                    <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                </a>
            </td>
            <td className="py-2 px-2 max-w-xs">
                <span className="text-sm text-foreground/80 line-clamp-1">{issue.title}</span>
            </td>
            <td className="py-2 px-2 whitespace-nowrap">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusVariant(issue.stateName)}`}>
                    {issue.stateName}
                </span>
            </td>
            <td className="py-2 px-2 whitespace-nowrap">
                {issue.estimate !== null ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{issue.estimate} pts</span>
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                )}
            </td>
            <td className="py-2 px-2 whitespace-nowrap">
                <span className="text-xs text-muted-foreground">{issue.teamName}</span>
            </td>
            <td className="py-2 pl-2 pr-2 whitespace-nowrap">
                {issue.dueDate ? (
                    <span className={`text-xs ${isOverdue(issue.dueDate) ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                        {formatDueDate(issue.dueDate)}
                    </span>
                ) : <span className="text-xs text-muted-foreground">—</span>}
            </td>
            <td className="py-2 pl-1 pr-4 whitespace-nowrap">
                {issue.involvedUsers.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                        {WAITING_STATES.has(issue.stateName) && (
                            <span className="text-[9px] text-amber-500 dark:text-amber-400 font-medium uppercase tracking-wide">waiting</span>
                        )}
                        <InvolvedAvatars users={issue.involvedUsers} stateName={issue.stateName} />
                    </div>
                ) : <span className="text-xs text-muted-foreground">—</span>}
            </td>
        </tr>
    )
}

// ─── Flat issue row (used in MemberCard) ───────────────────────────────────────

const TEAM_IDENT_COLORS = [
    'text-blue-400', 'text-violet-400', 'text-emerald-400',
    'text-amber-400', 'text-pink-400', 'text-cyan-400', 'text-indigo-400', 'text-rose-400',
]

function teamIdentColor(teamName: string): string {
    const hash = teamName.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return TEAM_IDENT_COLORS[hash % TEAM_IDENT_COLORS.length]
}

function IssueRowFlat({ issue }: { issue: LinearIssue }) {
    const stale = isStale(issue)
    const staleDays = daysSinceUpdate(issue.updatedAt)
    return (
        <a href={issue.url} target="_blank" rel="noreferrer"
            title={stale ? `No update in ${staleDays} days` : undefined}
            className={`flex items-center gap-2.5 px-4 py-1.5 hover:bg-muted/10 transition-colors group ${stale ? 'opacity-40' : ''}`}>
            <span className={`font-mono text-xs font-medium shrink-0 w-[72px] truncate group-hover:underline ${teamIdentColor(issue.teamName)}`}>
                {issue.identifier}
            </span>
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border shrink-0 ${statusVariant(issue.stateName)}`}>
                {issue.stateName === 'Pending Code Review' ? 'Pending Review' : issue.stateName}
            </span>
            <span className="text-sm text-foreground/80 flex-1 truncate">{issue.title}</span>
            {issue.involvedUsers.length > 0 && (
                <InvolvedAvatars users={issue.involvedUsers} stateName={issue.stateName} size={18} />
            )}
            {stale && <span className="text-[9px] text-muted-foreground/40 shrink-0">{staleDays}d</span>}
            <span className="text-[10px] text-muted-foreground/40 shrink-0 w-14 text-right truncate">
                {issue.teamName.split(' ')[0]}
            </span>
        </a>
    )
}

function InvolvedSection({ issues }: { issues: InvolvedIssue[] }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="border-t border-border/30">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-1.5 px-4 py-2 hover:bg-muted/10 transition-colors text-left"
            >
                {open ? <ChevronDown className="h-3 w-3 text-muted-foreground/50 shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Involved in
                </span>
                <span className="text-[10px] text-muted-foreground/50 ml-1">{issues.length}</span>
            </button>
            {open && (
                <div className="px-4 pb-2.5 flex flex-wrap gap-1.5">
                    {issues.map((i) => (
                        <a key={i.id} href={i.url} target="_blank" rel="noreferrer"
                            title={`${i.title}\n→ ${i.assigneeName} · ${i.stateName}`}
                            className="flex items-center gap-1.5 text-[11px] border border-border/40 bg-muted/10 rounded px-2 py-0.5 hover:bg-muted/30 transition-colors group">
                            <span className={`text-[10px] font-mono ${teamIdentColor(i.teamName ?? '')}`}>{i.identifier}</span>
                            <span className="text-foreground/70 group-hover:text-foreground truncate max-w-[160px]">{i.title}</span>
                            <span className="text-[10px] text-muted-foreground/50 shrink-0">→ {i.assigneeName.split(' ')[0]}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Member Card ───────────────────────────────────────────────────────────────

const IMPLEMENTING_STATES = new Set(['In Progress', 'Not Started', 'Evaluation', 'Triage'])
// WAITING_STATES already defined above

function MemberCard({ member, involvedIssues = [] }: { member: MemberAllocationData; involvedIssues?: InvolvedIssue[] }) {
    const implementing = [...member.issues]
        .filter((i) => IMPLEMENTING_STATES.has(i.stateName))
        .sort((a, b) => STATUS_ORDER.indexOf(a.stateName) - STATUS_ORDER.indexOf(b.stateName))
    const waiting = [...member.issues]
        .filter((i) => WAITING_STATES.has(i.stateName))
        .sort((a, b) => STATUS_ORDER.indexOf(a.stateName) - STATUS_ORDER.indexOf(b.stateName))

    const statusCounts: [string, number][] = []
    const rawCounts: Record<string, number> = {}
    for (const i of member.issues) rawCounts[i.stateName] = (rawCounts[i.stateName] ?? 0) + 1
    for (const s of STATUS_ORDER) { if (rawCounts[s]) statusCounts.push([s, rawCounts[s]]) }

    // Alignment
    const alignmentRow = computeAlignmentRow(member)
    const { matchedTeams, missingTeams, extraTeams, unlinkedActiveTeams, alignment } = alignmentRow
    const alignmentSummary = generateAlignmentSummary(alignmentRow)
    const hasSchedule = member.currentWeekAllocations.length > 0

    const alignmentChip = (() => {
        if (alignment === 'misaligned') return (
            <span className="text-[10px] font-medium text-red-500 border border-red-500/30 bg-red-500/10 rounded px-1.5 py-0.5">Misaligned</span>
        )
        if (alignment === 'partial') return (
            <span className="text-[10px] font-medium text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded px-1.5 py-0.5">⚠ Partial</span>
        )
        if (alignment === 'minor') return (
            <span className="text-[10px] text-amber-400 border border-amber-400/20 bg-amber-400/5 rounded px-1.5 py-0.5">Minor gap</span>
        )
        return null
    })()

    const [collapsed, setCollapsed] = useState(false)
    const dim = (!member.hasLinearToken || member.isPlaceholder) ? 'opacity-50' : member.totalTasks === 0 ? 'opacity-40' : ''

    return (
        <div className={`rounded-lg border border-border/40 bg-card overflow-hidden ${dim}`}>
            {/* ── Header ── */}
            <div className="px-4 pt-3 pb-2.5 cursor-pointer select-none" onClick={() => setCollapsed((v) => !v)}>
                <div className="flex items-start gap-3">
                    <MemberAvatar member={member} size={32} />

                    {/* Name + role */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{member.name}</span>
                            {alignmentChip}
                            {!member.hasLinearToken && !member.isPlaceholder && (
                                <span className="text-[10px] text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">No Linear</span>
                            )}
                            {member.isPlaceholder && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 border border-amber-400/40 bg-amber-400/10 rounded px-1.5 py-0.5">Placeholder</span>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {member.roles.join(' / ') || '—'}
                        </div>
                    </div>

                    {/* Collapse indicator + Status count badges */}
                    <div className="flex items-center gap-1 flex-wrap justify-end shrink-0 max-w-xs">
                        {statusCounts.map(([state, count]) => (
                            <span key={state}
                                className={`text-[10px] font-medium border rounded px-1.5 py-0.5 whitespace-nowrap ${statusVariant(state)}`}>
                                {count} {state === 'Pending Code Review' ? 'Pending Review' : state}
                            </span>
                        ))}
                        {member.totalTasks === 0 && member.hasLinearToken && !member.isPlaceholder && (
                            <span className="text-[10px] text-muted-foreground italic">no active issues</span>
                        )}
                        {collapsed
                            ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 ml-1" />
                            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 ml-1" />
                        }
                    </div>
                </div>

                {/* ── Schedule vs Actual row ── */}
                {!collapsed && hasSchedule && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider shrink-0">Schedule</span>
                        {member.currentWeekAllocations.map((a) => (
                            <span key={a.projectCode}
                                title={a.linearTeamName ? `${a.projectName} → ${a.linearTeamName}` : a.projectName}
                                className="inline-flex items-center gap-1 text-[10px] border border-border/40 bg-muted/20 rounded px-1.5 py-0.5 font-mono whitespace-nowrap text-foreground/60">
                                {a.projectCode} · {a.hoursPerDay}h/d
                            </span>
                        ))}
                        {(matchedTeams.length > 0 || extraTeams.length > 0 || missingTeams.length > 0 || unlinkedActiveTeams.length > 0) && (
                            <>
                                <span className="text-muted-foreground/30 text-xs px-0.5">→</span>
                                {matchedTeams.map((t) => (
                                    <span key={`matched:${t}`} className="text-[10px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded px-1.5 py-0.5 font-mono whitespace-nowrap">
                                        {t.split(' ')[0]} ✓
                                    </span>
                                ))}
                                {missingTeams.map((t) => (
                                    <span key={`missing:${t}`} title={`Scheduled for ${t} but no active issues`}
                                        className="text-[10px] border border-red-500/30 bg-red-500/10 text-red-500/60 rounded px-1.5 py-0.5 font-mono line-through whitespace-nowrap">
                                        {t.split(' ')[0]}
                                    </span>
                                ))}
                                {extraTeams.map((t) => (
                                    <span key={`extra:${t}`} title={`Working on ${t} — not in schedule`}
                                        className="text-[10px] border border-red-500/40 bg-red-500/10 text-red-500 dark:text-red-400 rounded px-1.5 py-0.5 font-mono whitespace-nowrap">
                                        +{t.split(' ')[0]} ⚠
                                    </span>
                                ))}
                                {unlinkedActiveTeams.map((t) => (
                                    <span key={`unlinked:${t}`} title={`Active issues in ${t} (project not linked to a Linear team)`}
                                        className="text-[10px] border border-border/30 bg-muted/20 text-muted-foreground/60 rounded px-1.5 py-0.5 font-mono whitespace-nowrap">
                                        {t.split(' ')[0]}
                                    </span>
                                ))}
                            </>
                        )}
                    </div>
                )}
                {/* ── Alignment summary ── */}
                {!collapsed && alignmentSummary.length > 0 && (
                    <div className="mt-1.5 flex flex-col gap-0.5">
                        {alignmentSummary.map((msg, i) => (
                            <p key={i} className="text-[11px] text-muted-foreground/60 leading-snug pl-0.5">
                                <span className="text-amber-500/70 mr-1">→</span>{msg}
                            </p>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Issue columns: Implementing | Waiting ── */}
            {!collapsed && (implementing.length > 0 || waiting.length > 0) && (
                <div className="border-t border-border/30 grid grid-cols-2 divide-x divide-border/20">
                    {/* Left: Implementing */}
                    <div>
                        <div className={`px-4 py-1.5 flex items-center gap-1.5 border-b ${implementing.length === 0 && member.hasLinearToken && member.totalTasks > 0 ? 'border-orange-500/30 bg-orange-500/10' : 'border-border/20 bg-muted/10'}`}>
                            <span className={`text-[10px] font-medium uppercase tracking-wider ${implementing.length === 0 && member.hasLinearToken && member.totalTasks > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-muted-foreground'}`}>
                                Implementing
                            </span>
                            {implementing.length > 0 ? (
                                <span className="text-[10px] font-semibold text-blue-500 dark:text-blue-400">{implementing.length}</span>
                            ) : member.hasLinearToken && member.totalTasks > 0 ? (
                                <span className="text-[10px] font-semibold text-orange-500 dark:text-orange-400">0 — available</span>
                            ) : null}
                        </div>
                        {implementing.length === 0 ? (
                            member.hasLinearToken && member.totalTasks > 0 ? (
                                <div className="px-4 py-3 bg-orange-500/5">
                                    <p className="text-xs font-medium text-orange-500 dark:text-orange-400">No active implementation</p>
                                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Available to pick up new work</p>
                                </div>
                            ) : (
                                <div className="px-4 py-3 text-xs text-muted-foreground/40 italic">nothing in progress</div>
                            )
                        ) : (
                            <div className="divide-y divide-border/[0.15]">
                                {implementing.map((issue) => <IssueRowFlat key={issue.id} issue={issue} />)}
                            </div>
                        )}
                    </div>

                    {/* Right: Waiting */}
                    <div>
                        <div className="px-4 py-1.5 flex items-center gap-1.5 border-b border-border/20 bg-muted/10">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Waiting</span>
                            {waiting.length > 0 && (
                                <span className="text-[10px] font-semibold text-amber-500 dark:text-amber-400">{waiting.length}</span>
                            )}
                        </div>
                        {waiting.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-muted-foreground/40 italic">no blocked / waiting issues</div>
                        ) : (
                            <div className="divide-y divide-border/[0.15]">
                                {waiting.map((issue) => <IssueRowFlat key={issue.id} issue={issue} />)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Involved in teammates' issues (collapsed by default) ── */}
            {!collapsed && involvedIssues.length > 0 && <InvolvedSection issues={involvedIssues} />}
        </div>
    )
}

// ─── Alignment Summary Generator ──────────────────────────────────────────────

function generateAlignmentSummary(row: ReturnType<typeof computeAlignmentRow>): string[] {
    const { m, matchedTeams, missingTeams, extraTeams, unlinkedActiveTeams, alignment } = row
    const msgs: string[] = []

    if (!m.hasLinearToken) return msgs

    const activeIssues = m.issues.filter((i) => ALIGNMENT_ACTIVE_STATES.has(i.stateName) && !isStale(i))
    const waitingIssues = m.issues.filter((i) => WAITING_STATES.has(i.stateName))
    const overdueIssues = waitingIssues.filter((i) => isOverdue(i.dueDate))

    // ── No implementing tasks = available capacity ──
    const implementingIssues = m.issues.filter((i) => IMPLEMENTING_STATES.has(i.stateName))
    if (m.hasLinearToken && implementingIssues.length === 0 && m.totalTasks > 0) {
        msgs.push(`No in-progress tasks — available to pick up new work (${waitingIssues.length} tickets waiting on others)`)
    } else if (m.hasLinearToken && implementingIssues.length === 1 && waitingIssues.length >= 5) {
        msgs.push(`Only 1 implementing task vs ${waitingIssues.length} waiting — capacity available`)
    }

    // ── Waiting backlog insight ──
    if (waitingIssues.length >= 5) {
        // Group by team
        const byTeam: Record<string, number> = {}
        for (const i of waitingIssues) byTeam[i.teamName] = (byTeam[i.teamName] ?? 0) + 1
        const teamList = Object.entries(byTeam)
            .sort((a, b) => b[1] - a[1])
            .map(([t, n]) => `${t.split(' ')[0]} (${n})`)
            .join(', ')
        // Dominant state
        const stateCounts: Record<string, number> = {}
        for (const i of waitingIssues) stateCounts[i.stateName] = (stateCounts[i.stateName] ?? 0) + 1
        const dominantState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]
        const stateLabel = dominantState[0] === 'Pending Code Review' ? 'PCR' : dominantState[0]
        msgs.push(`${waitingIssues.length} waiting — ${dominantState[1]} in ${stateLabel} · across ${teamList}`)
    }

    // ── Overdue issues ──
    if (overdueIssues.length > 0) {
        const ids = overdueIssues.slice(0, 3).map((i) => i.identifier).join(', ')
        const more = overdueIssues.length > 3 ? ` +${overdueIssues.length - 3} more` : ''
        msgs.push(`${overdueIssues.length} overdue: ${ids}${more}`)
    }

    // ── Schedule gap: scheduled for team but no active tickets ──
    for (const team of missingTeams) {
        const allocs = m.currentWeekAllocations.filter((a) => a.linearTeamName === team)
        const totalH = allocs.reduce((s, a) => s + a.hoursPerDay, 0)
        const codes = allocs.map((a) => a.projectCode).join(', ')
        const hLabel = Number.isInteger(totalH) ? `${totalH}h/d` : `${totalH.toFixed(1)}h/d`
        msgs.push(`No active ${team} tickets — ${hLabel} allocated via ${codes}`)
    }

    // ── Extra confirmed: working outside schedule ──
    for (const team of extraTeams) {
        const count = activeIssues.filter((i) => i.teamName === team).length
        msgs.push(`+${team}: ${count} active ticket${count !== 1 ? 's' : ''} not in schedule`)
    }

    // ── Fully misaligned ──
    if (alignment === 'misaligned' && matchedTeams.length === 0 && extraTeams.length === 0) {
        const linkedTeams = m.currentWeekAllocations.filter((a) => a.linearTeamName).map((a) => a.linearTeamName).join(', ')
        if (linkedTeams) msgs.push(`All active work is outside scheduled teams (${linkedTeams})`)
    }

    // ── Unlinked projects: informational ──
    if (unlinkedActiveTeams.length > 0) {
        const unmapped = m.currentWeekAllocations.filter((a) => !a.linearTeamName).map((a) => a.projectCode).join(', ')
        msgs.push(`${unlinkedActiveTeams.map((t) => t.split(' ')[0]).join(', ')} tickets active — ${unmapped || '?'} not linked to Linear team`)
    }

    return msgs
}

// ─── Alignment Cross-Reference Table ──────────────────────────────────────────

const ALIGNMENT_BADGE: Record<AlignmentStatus, React.ReactNode> = {
    misaligned: <span className="text-[10px] font-medium text-red-500 border border-red-500/30 bg-red-500/10 rounded px-1.5 py-0.5 whitespace-nowrap">● Misaligned</span>,
    partial:    <span className="text-[10px] font-medium text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded px-1.5 py-0.5 whitespace-nowrap">⚠ Partial</span>,
    minor:      <span className="text-[10px] text-amber-400 border border-amber-400/20 bg-amber-400/5 rounded px-1.5 py-0.5 whitespace-nowrap">⚠ Minor</span>,
    aligned:    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 rounded px-1.5 py-0.5 whitespace-nowrap">✓ Aligned</span>,
    'no-schedule': <span className="text-[10px] text-muted-foreground border border-border/40 rounded px-1.5 py-0.5 whitespace-nowrap">—</span>,
}

const PRIORITY_BADGE: Record<AlignmentRow['priority'], React.ReactNode> = {
    'High':   <span className="text-[10px] font-medium text-red-500 whitespace-nowrap">High</span>,
    'Medium': <span className="text-[10px] font-medium text-amber-500 whitespace-nowrap">Medium</span>,
    'Low':    <span className="text-[10px] text-muted-foreground whitespace-nowrap">Low</span>,
    '—':      <span className="text-[10px] text-muted-foreground/40">—</span>,
}

function AlignmentCrossRefTable({ members }: { members: MemberAllocationData[] }) {
    const rows = members
        .filter((m) => m.hasLinearToken && !m.isPlaceholder)
        .map((m) => { const row = computeAlignmentRow(m); return { member: m, ...row } })

    if (rows.length === 0) return null

    return (
        <div className="rounded-lg border border-border/40 bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border/40 bg-muted/10">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Schedule vs Linear Cross-Reference</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/40 bg-muted/10">
                            {['Member', 'Forecast Projects', 'Linear Active Teams', 'Alignment', 'Priority'].map((h) => (
                                <th key={h} className="py-2 px-4 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ member, forecastCodes, matchedTeams, missingTeams, extraTeams, unlinkedActiveTeams, alignment, priority }) => {
                            const m = member
                            const linkedAllocs = m.currentWeekAllocations.filter(a => a.linearTeamName)
                            const unlinkedAllocs = m.currentWeekAllocations.filter(a => !a.linearTeamName)
                            return (
                                <tr key={m.memberId} className={`border-b border-border/30 hover:bg-muted/10 transition-colors ${m.totalTasks === 0 ? 'opacity-40' : ''}`}>
                                    {/* Member */}
                                    <td className="py-2.5 px-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <MemberAvatar member={m} size={24} />
                                            <span className="text-sm font-medium text-foreground/80">{m.name}</span>
                                        </div>
                                    </td>

                                    {/* Forecast projects — linked (bold) vs unlinked (muted) */}
                                    <td className="py-2.5 px-4">
                                        {m.currentWeekAllocations.length === 0 ? (
                                            <span className="text-xs text-muted-foreground/40">no schedule</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {linkedAllocs.map((a) => (
                                                    <span key={a.projectCode}
                                                        title={`${a.projectName} → ${a.linearTeamName}`}
                                                        className="text-[10px] font-mono font-semibold border border-blue-500/30 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded px-1.5 py-0.5 whitespace-nowrap">
                                                        {a.projectCode}
                                                        <span className="text-[9px] opacity-60 ml-0.5 font-sans normal-case">→{a.linearTeamName!.split(' ')[0]}</span>
                                                    </span>
                                                ))}
                                                {unlinkedAllocs.map((a) => (
                                                    <span key={a.projectCode}
                                                        title={`${a.projectName} (no Linear team link)`}
                                                        className="text-[10px] font-mono border border-border/30 text-muted-foreground/50 rounded px-1.5 py-0.5 whitespace-nowrap">
                                                        {a.projectCode}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>

                                    {/* Active teams breakdown */}
                                    <td className="py-2.5 px-4">
                                        {!m.hasLinearToken ? (
                                            <span className="text-xs text-muted-foreground/40">no linear</span>
                                        ) : matchedTeams.length === 0 && missingTeams.length === 0 && extraTeams.length === 0 && unlinkedActiveTeams.length === 0 ? (
                                            <span className="text-xs text-muted-foreground/40">no active issues</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {matchedTeams.map((t) => (
                                                    <span key={`xmatch:${t}`} className="text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded px-1.5 py-0.5 whitespace-nowrap">
                                                        {t.split(' ')[0]} ✓
                                                    </span>
                                                ))}
                                                {missingTeams.map((t) => (
                                                    <span key={`xmiss:${t}`} title={`Scheduled for ${t} — no active issues`}
                                                        className="text-[10px] font-mono border border-red-500/30 bg-red-500/10 text-red-500/60 rounded px-1.5 py-0.5 whitespace-nowrap line-through">
                                                        {t.split(' ')[0]}
                                                    </span>
                                                ))}
                                                {extraTeams.map((t) => (
                                                    <span key={`xextra:${t}`} title={`Active in ${t} — not in schedule`}
                                                        className="text-[10px] font-mono border border-red-500/40 bg-red-500/10 text-red-500 dark:text-red-400 rounded px-1.5 py-0.5 whitespace-nowrap">
                                                        +{t.split(' ')[0]} ⚠
                                                    </span>
                                                ))}
                                                {unlinkedActiveTeams.map((t) => (
                                                    <span key={`xunlinked:${t}`} title={`Active in ${t} — project not mapped to Linear team`}
                                                        className="text-[10px] font-mono border border-border/30 bg-muted/20 text-muted-foreground/50 rounded px-1.5 py-0.5 whitespace-nowrap">
                                                        {t.split(' ')[0]}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>

                                    {/* Alignment */}
                                    <td className="py-2.5 px-4 whitespace-nowrap">
                                        {ALIGNMENT_BADGE[alignment]}
                                    </td>

                                    {/* Priority */}
                                    <td className="py-2.5 px-4 whitespace-nowrap">
                                        {PRIORITY_BADGE[priority]}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── Main View ─────────────────────────────────────────────────────────────────

export function LinearAllocationView({
    members,
    placeholders,
    allTeams,
    allRoles,
    fetchedAt,
    filters,
}: {
    members: MemberAllocationData[]
    placeholders: MemberAllocationData[]
    allTeams: string[]
    allRoles: string[]
    fetchedAt: string
    filters: LinearReportFilters
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [showNoLinear, setShowNoLinear] = useState(false)
    const [showPlaceholders, setShowPlaceholders] = useState(false)
    const [savedDefault, setSavedDefault] = useState<string | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const STORAGE_KEY = 'linear-report-filter-defaults'

    // On mount: load saved default; if no active filters → redirect to saved default
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        setSavedDefault(saved)
        const hasParams = searchParams.get('q') || searchParams.get('team') || searchParams.get('role') || (searchParams.get('sort') && searchParams.get('sort') !== 'default')
        if (!hasParams && saved) {
            router.replace(`${pathname}?${saved}`)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function saveDefault() {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('tab')
        const str = params.toString()
        localStorage.setItem(STORAGE_KEY, str)
        setSavedDefault(str)
    }

    function clearDefault() {
        localStorage.removeItem(STORAGE_KEY)
        setSavedDefault(null)
    }

    const currentParamStr = (() => {
        const p = new URLSearchParams(searchParams.toString())
        p.delete('tab')
        return p.toString()
    })()
    const isDefaultSaved = savedDefault === currentParamStr && !!currentParamStr

    const withLinear = members.filter((m) => m.hasLinearToken)
    const withoutLinear = members.filter((m) => !m.hasLinearToken)

    // Cross-member involvement map: linearUserId → issues from other members where they interacted
    const involvedMap = useMemo(() => {
        const map = new Map<string, InvolvedIssue[]>()
        for (const assignee of withLinear) {
            if (assignee.isPlaceholder) continue
            for (const issue of assignee.issues) {
                for (const u of issue.involvedUsers) {
                    if (!map.has(u.id)) map.set(u.id, [])
                    map.get(u.id)!.push({ ...issue, assigneeName: assignee.name, assigneeAvatar: assignee.avatarUrl })
                }
            }
        }
        return map
    }, [withLinear])
    const visible = [
        ...withLinear,
        ...(showNoLinear ? withoutLinear : []),
        ...(showPlaceholders ? placeholders : []),
    ]

    const availableMembers = withLinear.filter((m) => !m.isPlaceholder && m.totalTasks > 0 && m.ipTasks === 0).length
    const totalIP = withLinear.reduce((s, m) => s + m.ipTasks, 0)
    const totalIPPts = withLinear.reduce((s, m) => s + m.ipPts, 0)
    const totalIPUnest = withLinear.reduce((s, m) => s + m.ipUnestimated, 0)
    const totalTasks = withLinear.reduce((s, m) => s + m.totalTasks, 0)
    const totalPts = withLinear.reduce((s, m) => s + m.totalPts, 0)
    const totalUnest = withLinear.reduce((s, m) => s + (m.totalTasks - Math.round((m.coveragePct / 100) * m.totalTasks)), 0)
    const teamCoverage = totalTasks > 0 ? Math.round(((totalTasks - totalUnest) / totalTasks) * 100) : 0

    const fetchedAtDate = new Date(fetchedAt)
    const staleMinutes = differenceInMinutes(new Date(), fetchedAtDate)
    const isStale = staleMinutes > 5

    const handleSearch = useCallback(
        (value: string) => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => {
                const params = new URLSearchParams(searchParams.toString())
                if (value) params.set('q', value)
                else params.delete('q')
                router.replace(`${pathname}?${params.toString()}`)
            }, 300)
        },
        [router, pathname, searchParams],
    )

    function buildUrl(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== '__all__') params.set(key, value)
        else params.delete(key)
        // preserve search query when switching tabs; clear it for other filter changes
        if (key !== 'q' && key !== 'tab') params.delete('q')
        return `${pathname}?${params.toString()}`
    }

    const activeTab = searchParams.get('tab') ?? 'overview'
    const isFiltered = filters.q || filters.team || filters.role || filters.sort !== 'default'

    // Tab badge counts
    const waitingTotal = withLinear.reduce(
        (s, m) => s + m.issues.filter((i) => WAITING_STATES.has(i.stateName)).length,
        0,
    )
    return (
        <div className="flex-1 space-y-4 px-4 md:px-8 pb-8">
            {/* Filter bar — always visible across all tabs */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-48 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        defaultValue={filters.q}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search members..."
                        className="pl-8 h-8 text-sm bg-muted/20 border-border/50"
                    />
                </div>

                {allTeams.length > 0 && (
                    <Select
                        defaultValue={filters.team || '__all__'}
                        onValueChange={(v) => router.replace(buildUrl('team', v))}
                    >
                        <SelectTrigger className="h-8 text-sm w-44 bg-muted/20 border-border/50">
                            <SelectValue placeholder="All teams" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All teams</SelectItem>
                            {allTeams.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {allRoles.length > 0 && (
                    <Select
                        defaultValue={filters.role || '__all__'}
                        onValueChange={(v) => router.replace(buildUrl('role', v))}
                    >
                        <SelectTrigger className="h-8 text-sm w-40 bg-muted/20 border-border/50">
                            <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All roles</SelectItem>
                            {allRoles.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                <Select
                    defaultValue={filters.sort}
                    onValueChange={(v) => router.replace(buildUrl('sort', v))}
                >
                    <SelectTrigger className="h-8 text-sm w-48 bg-muted/20 border-border/50">
                        <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">Sort: Join date</SelectItem>
                        <SelectItem value="ip_desc">Sort: Most In Progress</SelectItem>
                        <SelectItem value="tasks_desc">Sort: Most Active Tasks</SelectItem>
                        <SelectItem value="coverage_asc">Sort: Lowest Coverage</SelectItem>
                        <SelectItem value="name_asc">Sort: Name A–Z</SelectItem>
                    </SelectContent>
                </Select>

                {withoutLinear.length > 0 && (
                    <button
                        onClick={() => setShowNoLinear((v) => !v)}
                        className="flex items-center gap-1.5 h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border/50 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                        <Users className="h-3.5 w-3.5" />
                        {showNoLinear ? 'Hide' : 'Show'} {withoutLinear.length} without Linear
                    </button>
                )}

                {placeholders.length > 0 && (
                    <button
                        onClick={() => setShowPlaceholders((v) => !v)}
                        className={`flex items-center gap-1.5 h-8 px-3 text-xs border rounded-md transition-colors ${
                            showPlaceholders
                                ? 'text-amber-600 dark:text-amber-400 border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20'
                                : 'text-muted-foreground hover:text-foreground border-border/50 bg-muted/20 hover:bg-muted/40'
                        }`}
                    >
                        <LayoutList className="h-3.5 w-3.5" />
                        {showPlaceholders ? 'Hide' : 'Show'} {placeholders.length} placeholder{placeholders.length !== 1 ? 's' : ''}
                    </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                    {isFiltered && (
                        <button
                            type="button"
                            onClick={() => {
                                setSavedDefault(null)
                                router.replace(pathname)
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Clear filters
                        </button>
                    )}
                    {isFiltered && (
                        isDefaultSaved ? (
                            <button
                                onClick={clearDefault}
                                title="Remove saved default"
                                className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-foreground transition-colors"
                            >
                                <BookmarkCheck className="h-3.5 w-3.5" />
                                Default saved
                            </button>
                        ) : (
                            <button
                                onClick={saveDefault}
                                title="Save current filters as default"
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Bookmark className="h-3.5 w-3.5" />
                                Save as default
                            </button>
                        )
                    )}
                </div>

                <span className="text-xs text-muted-foreground">
                    {withLinear.length} member{withLinear.length !== 1 ? 's' : ''}
                    {filters.team && ` · ${filters.team}`}
                    {filters.role && ` · ${filters.role}`}
                </span>
            </div>

            {/* Tabbed sections */}
            <Tabs value={activeTab} onValueChange={(v) => router.replace(buildUrl('tab', v))}>
                <TabsList className="h-9 bg-muted/30 border border-border/40 w-full justify-start gap-0.5 px-1">
                    <TabsTrigger value="overview" className="h-7 text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border data-[state=active]:border-border/50">
                        <BarChart2 className="h-3.5 w-3.5" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="workload" className="h-7 text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border data-[state=active]:border-border/50">
                        <Layers className="h-3.5 w-3.5" />
                        Members
                        <span className="ml-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium px-1.5 py-px">
                            {withLinear.length}
                        </span>
                        {waitingTotal > 0 && (
                            <span className="rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-medium px-1.5 py-px">
                                {waitingTotal} waiting
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* ── Tab 1: Overview ── */}
                <TabsContent value="overview" className="mt-4 space-y-4">
                    {/* KPI cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'In Progress', value: totalIP, sub: `${totalIPPts} pts` },
                            { label: 'Available', value: availableMembers, sub: availableMembers > 0 ? 'no implementing tasks' : 'all members busy', warn: availableMembers > 0 },
                            { label: 'Total Active', value: totalTasks, sub: `${totalPts} pts` },
                            { label: 'Est. Coverage', value: `${teamCoverage}%`, sub: 'team average', color: coverageColor(teamCoverage, true) },
                        ].map((s) => (
                            <div key={s.label} className="rounded-lg border border-border/40 bg-card px-4 py-3">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div>
                                <div className={`text-lg font-semibold tracking-tight ${s.color ?? 'text-foreground'} ${s.warn ? 'text-red-500' : ''}`}>
                                    {s.value}
                                </div>
                                <div className="text-xs text-muted-foreground">{s.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Overview table */}
                    <div className="rounded-lg border border-border/40 bg-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/40 bg-muted/20">
                                        {['Member', 'Roles', 'Sched h/d', 'Active', 'In Progress', 'IP Pts', 'Total Pts', 'Unest.', 'Coverage'].map((h) => (
                                            <th
                                                key={h}
                                                className="py-2 px-4 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((m) => (
                                        <tr
                                            key={m.memberId}
                                            className={`border-b border-border/40 hover:bg-muted/20 transition-colors ${(!m.hasLinearToken || m.isPlaceholder) ? 'opacity-50' : m.totalTasks === 0 ? 'opacity-40' : ''}`}
                                        >
                                            <td className="py-2.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <MemberAvatar member={m} size={24} />
                                                    <span className="text-sm font-medium text-foreground/80">{m.name}</span>
                                                    {m.isPlaceholder && (
                                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 border border-amber-400/40 bg-amber-400/10 rounded px-1 py-0.5">
                                                            Placeholder
                                                        </span>
                                                    )}
                                                    {!m.hasLinearToken && !m.isPlaceholder && (
                                                        <span className="text-[10px] text-muted-foreground border border-border/60 rounded px-1 py-0.5">
                                                            No Linear
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-4 max-w-[128px]">
                                                {m.roles.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1" title={m.roles.join(', ')}>
                                                        {m.roles.slice(0, 2).map((r) => (
                                                            <span key={r} className="text-[10px] text-muted-foreground border border-border/40 rounded px-1.5 py-0.5 whitespace-nowrap truncate max-w-[80px]">
                                                                {r}
                                                            </span>
                                                        ))}
                                                        {m.roles.length > 2 && (
                                                            <span className="text-[10px] text-muted-foreground">+{m.roles.length - 2}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap">
                                                {m.currentWeekAllocations.length > 0 ? (() => {
                                                    const total = m.currentWeekAllocations.reduce((s, a) => s + a.hoursPerDay, 0)
                                                    const label = Number.isInteger(total) ? `${total}h` : `${total.toFixed(1)}h`
                                                    return (
                                                        <span className={`text-sm font-medium ${total > 7.5 ? 'text-amber-500 dark:text-amber-400' : 'text-foreground/80'}`}>
                                                            {label}
                                                        </span>
                                                    )
                                                })() : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4 text-sm text-foreground/80">{m.totalTasks || '—'}</td>
                                            <td className="py-2.5 px-4">
                                                {m.ipTasks > 0 ? (
                                                    <span className="text-sm font-medium text-blue-500 dark:text-blue-400">{m.ipTasks}</span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                {m.ipPts > 0 ? (
                                                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{m.ipPts} pts</span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4 text-sm text-foreground/80">
                                                {m.totalPts > 0 ? `${m.totalPts} pts` : '—'}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                {m.ipUnestimated > 0 ? (
                                                    <span className="text-sm text-red-500">{m.ipUnestimated}</span>
                                                ) : m.ipTasks > 0 ? (
                                                    <span className="text-sm text-emerald-600 dark:text-emerald-400">✓</span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                {m.hasLinearToken && !m.isPlaceholder ? (
                                                    <span className={`text-sm font-semibold ${coverageColor(m.coveragePct, true)}`}>
                                                        {m.coveragePct}%
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-border/50 bg-muted/30">
                                        <td className="py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider" colSpan={2}>Total</td>
                                        <td className="py-2.5 px-4 text-sm text-muted-foreground">—</td>
                                        <td className="py-2.5 px-4 text-sm font-semibold text-foreground">{totalTasks}</td>
                                        <td className="py-2.5 px-4 text-sm font-semibold text-blue-500 dark:text-blue-400">{totalIP}</td>
                                        <td className="py-2.5 px-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">{totalIPPts} pts</td>
                                        <td className="py-2.5 px-4 text-sm font-bold text-foreground">{totalPts} pts</td>
                                        <td className="py-2.5 px-4 text-sm font-semibold text-red-500">{totalIPUnest || '—'}</td>
                                        <td className="py-2.5 px-4">
                                            <span className={`text-sm font-bold ${coverageColor(teamCoverage, true)}`}>{teamCoverage}%</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    {/* Alignment cross-reference */}
                    <AlignmentCrossRefTable members={visible} />
                </TabsContent>

                {/* ── Tab 2: Members ── */}
                <TabsContent value="workload" className="mt-4 space-y-4">
                    <WaitingIssuesPanel members={withLinear} />
                    <div className="space-y-2">
                        {visible.map((m) => (
                            <MemberCard
                                key={m.memberId}
                                member={m}
                                involvedIssues={m.linearUserId ? (involvedMap.get(m.linearUserId) ?? []) : []}
                            />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                {isStale && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />}
                <span>Updated {formatDistanceToNow(fetchedAtDate, { addSuffix: true })}</span>
            </div>
        </div>
    )
}

'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, FolderKanban, GitBranch, CalendarDays, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { LinearAllocationView } from '@/app/reports/linear/LinearAllocationView'
import { CapacitySummary } from './CapacitySummary'
import { COLOR_HEX_MAP } from '@/lib/project-colors'
import type { MemberAllocationData, PodOption, CycleOption } from '@/app/reports/linear/page'
import type { CapacityAllocation } from './CapacitySummary'

interface PodSlot {
    id: string
    roleName: string
    allocationPercent: number | null
    memberId: string | null
    memberName: string | null
    memberEmail: string | null
    memberImage: string | null
    memberRoles: string[]
}

interface PodProject {
    id: string
    name: string
    color: string | null
    status: string
    clientName: string | null
    startsOn: string | null
    endsOn: string | null
    budgetHours: number | null
}

interface PodDetailTabsProps {
    pod: { id: string; name: string; type: string }
    slots: PodSlot[]
    projects: PodProject[]
    allocations: CapacityAllocation[]
    workloadMembers: MemberAllocationData[]
    allTeams: string[]
    allRoles: string[]
    allPods: PodOption[]
    allCycles: CycleOption[]
    fetchedAt: string
    hasLinearKey: boolean
}

const STATUS_LABEL: Record<string, string> = {
    ACTIVE: 'Active', TENTATIVE: 'Pipeline', PAUSED: 'Paused',
    COMPLETED: 'Completed', ARCHIVED: 'Archived',
}
const STATUS_COLOR: Record<string, string> = {
    ACTIVE: 'text-emerald-600 dark:text-emerald-400',
    TENTATIVE: 'text-violet-600 dark:text-violet-400',
    PAUSED: 'text-amber-600 dark:text-amber-400',
    COMPLETED: 'text-muted-foreground',
}

export function PodDetailTabs({
    pod, slots, projects, allocations, workloadMembers,
    allTeams, allRoles, allPods, allCycles, fetchedAt, hasLinearKey,
}: PodDetailTabsProps) {
    const filledSlots = slots.filter((s) => s.memberId !== null)
    const memberNames = new Map(filledSlots.map((s) => [s.memberId!, s.memberName ?? 'Unknown']))
    const memberIds = slots.map((s) => s.memberId)

    return (
        <Tabs defaultValue="members">
            <TabsList className="mb-4">
                <TabsTrigger value="members" className="gap-1.5">
                    <Users className="size-3.5" />
                    Members
                    {slots.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                            {slots.length}
                        </Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="projects" className="gap-1.5">
                    <FolderKanban className="size-3.5" />
                    Projects
                    {projects.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                            {projects.length}
                        </Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="workload" className="gap-1.5">
                    <GitBranch className="size-3.5" />
                    Workload
                </TabsTrigger>
                <TabsTrigger value="capacity" className="gap-1.5">
                    <CalendarDays className="size-3.5" />
                    Capacity
                </TabsTrigger>
            </TabsList>

            {/* ── Members ── */}
            <TabsContent value="members">
                <div className="rounded-lg border border-border/50 overflow-hidden">
                    {slots.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground/50 italic">
                            No slots defined for this pod yet.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Member</th>
                                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Role</th>
                                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Guilds</th>
                                    <th className="text-right px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Allocation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slots.map((slot, i) => (
                                    <tr key={slot.id} className={i > 0 ? 'border-t border-border/40' : ''}>
                                        <td className="px-4 py-3">
                                            {slot.memberId ? (
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar className="size-7 shrink-0">
                                                        <AvatarImage src={slot.memberImage ?? undefined} />
                                                        <AvatarFallback className="text-[10px]">
                                                            {slot.memberName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-sm leading-tight">{slot.memberName}</div>
                                                        <div className="text-[11px] text-muted-foreground">{slot.memberEmail}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2.5">
                                                    <div className="size-7 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0" />
                                                    <span className="text-muted-foreground/50 italic text-sm">Open seat</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{slot.roleName}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {slot.memberRoles.map((r) => (
                                                    <Badge key={r} variant="secondary" className="text-[10px] px-1.5 py-0">{r}</Badge>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {slot.memberId && (
                                                <span className={`text-sm font-medium tabular-nums ${(slot.allocationPercent ?? 100) < 100 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                                    {slot.allocationPercent ?? 100}%
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </TabsContent>

            {/* ── Projects ── */}
            <TabsContent value="projects">
                <div className="rounded-lg border border-border/50 overflow-hidden">
                    {projects.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground/50 italic">
                            No projects assigned to this pod.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Project</th>
                                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Client</th>
                                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Dates</th>
                                    <th className="text-right px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Budget</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((p, i) => {
                                    const hex = COLOR_HEX_MAP[p.color ?? 'blue'] ?? COLOR_HEX_MAP['blue']
                                    return (
                                        <tr key={p.id} className={i > 0 ? 'border-t border-border/40' : ''}>
                                            <td className="px-4 py-3">
                                                <Link href={`/projects/${p.id}`} className="flex items-center gap-2 group">
                                                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                                                    <span className="font-medium group-hover:underline">{p.name}</span>
                                                    <ExternalLink className="size-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{p.clientName ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={STATUS_COLOR[p.status] ?? 'text-muted-foreground'}>
                                                    {STATUS_LABEL[p.status] ?? p.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground text-sm">
                                                {p.startsOn ? new Date(p.startsOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                                                {' – '}
                                                {p.endsOn ? new Date(p.endsOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                                {p.budgetHours != null ? `${p.budgetHours}h` : '—'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </TabsContent>

            {/* ── Workload ── */}
            <TabsContent value="workload">
                {!hasLinearKey ? (
                    <div className="border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 px-4 py-2.5 rounded-md text-sm">
                        <span className="font-medium">LINEAR_SERVICE_ACCOUNT_API_KEY</span> is not configured.
                        Add it to enable workload tracking.
                    </div>
                ) : workloadMembers.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground/50 italic">
                        No members with Linear access in this pod.
                    </div>
                ) : (
                    <LinearAllocationView
                        members={workloadMembers}
                        placeholders={[]}
                        allTeams={allTeams}
                        allRoles={allRoles}
                        allPods={allPods}
                        allCycles={allCycles}
                        currentMemberPodId={pod.id}
                        fetchedAt={fetchedAt}
                        filters={{ q: '', team: '', role: '', pod: pod.id, cycle: '', sort: 'default' }}
                        lockedPodId={pod.id}
                    />
                )}
            </TabsContent>

            {/* ── Capacity ── */}
            <TabsContent value="capacity">
                <CapacitySummary
                    allocations={allocations}
                    memberIds={memberIds}
                    memberNames={memberNames}
                />
            </TabsContent>
        </Tabs>
    )
}

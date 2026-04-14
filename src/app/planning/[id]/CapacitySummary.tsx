'use client'

import { useMemo } from 'react'
import { addDays, format, startOfDay, differenceInDays, startOfWeek, addWeeks } from 'date-fns'
import { COLOR_HEX_MAP } from '@/lib/project-colors'

export type CapacityAllocation = {
    id: string
    memberId: string | null
    memberName: string | null
    projectId: string
    projectName: string
    projectColor: string | null
    startDate: string
    endDate: string
    hoursPerDay: number
}

interface CapacitySummaryProps {
    allocations: CapacityAllocation[]
    memberIds: (string | null)[]
    memberNames: Map<string, string>
}

const WEEKS = 4

export function CapacitySummary({ allocations, memberIds, memberNames }: CapacitySummaryProps) {
    const today = startOfDay(new Date())

    const weekStarts = useMemo(() =>
        Array.from({ length: WEEKS }, (_, i) =>
            startOfWeek(addWeeks(today, i), { weekStartsOn: 1 })
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])

    const filled = memberIds.filter(Boolean) as string[]

    const rows = useMemo(() => {
        return filled.map((memberId) => {
            const name = memberNames.get(memberId) ?? 'Unknown'
            const memberAllocs = allocations.filter((a) => a.memberId === memberId)

            const weeks = weekStarts.map((ws) => {
                const we = addDays(ws, 4) // Mon-Fri
                const active = memberAllocs.filter((a) =>
                    new Date(a.startDate) <= we && new Date(a.endDate) >= ws
                )
                const totalHours = active.reduce((sum, a) => {
                    const start = new Date(a.startDate) > ws ? new Date(a.startDate) : ws
                    const end = new Date(a.endDate) < we ? new Date(a.endDate) : we
                    const days = Math.max(0, differenceInDays(end, start) + 1)
                    return sum + a.hoursPerDay * days
                }, 0)
                return { active, totalHours }
            })

            return { memberId, name, weeks }
        })
    }, [allocations, filled, weekStarts])

    if (filled.length === 0) {
        return (
            <div className="text-sm text-muted-foreground/50 italic py-8 text-center">
                No members assigned to this pod yet.
            </div>
        )
    }

    if (allocations.length === 0) {
        return (
            <div className="text-sm text-muted-foreground/50 italic py-8 text-center">
                No upcoming allocations for pod members.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Week headers */}
            <div className="grid gap-2" style={{ gridTemplateColumns: '160px repeat(4, 1fr)' }}>
                <div />
                {weekStarts.map((ws, i) => (
                    <div key={i} className="text-[11px] font-medium text-muted-foreground text-center">
                        {format(ws, 'MMM d')} – {format(addDays(ws, 4), 'MMM d')}
                    </div>
                ))}
            </div>

            {/* Member rows */}
            {rows.map(({ memberId, name, weeks }) => (
                <div key={memberId} className="grid gap-2 items-center" style={{ gridTemplateColumns: '160px repeat(4, 1fr)' }}>
                    <div className="text-sm font-medium truncate pr-2">{name}</div>
                    {weeks.map((week, wi) => (
                        <div key={wi} className="rounded-md border border-border/50 bg-muted/20 overflow-hidden min-h-[40px]">
                            {week.active.length === 0 ? (
                                <div className="h-10 flex items-center justify-center">
                                    <span className="text-[11px] text-muted-foreground/30">—</span>
                                </div>
                            ) : (
                                <div className="p-1.5 space-y-1">
                                    {week.active.map((a) => {
                                        const hex = COLOR_HEX_MAP[a.projectColor ?? 'blue'] ?? COLOR_HEX_MAP['blue']
                                        return (
                                            <div
                                                key={a.id}
                                                className="flex items-center gap-1.5 rounded px-1.5 py-0.5"
                                                style={{ backgroundColor: `${hex}18`, borderLeft: `2px solid ${hex}` }}
                                            >
                                                <span className="text-[11px] truncate font-medium" style={{ color: hex }}>
                                                    {a.projectName}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">
                                                    {a.hoursPerDay}h/d
                                                </span>
                                            </div>
                                        )
                                    })}
                                    {week.totalHours > 0 && (
                                        <div className="text-[10px] text-muted-foreground text-right pt-0.5">
                                            {week.totalHours % 1 === 0 ? week.totalHours : week.totalHours.toFixed(1)}h total
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}

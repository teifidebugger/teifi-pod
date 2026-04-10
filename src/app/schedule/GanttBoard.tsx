"use client"

import React from "react"
import { useTimelineContext, type Range } from "dnd-timeline"
import { GanttAllocation, GanttProject, ClientOption, ManagerOption } from "./GanttTypes"
import { GanttHeader } from "./GanttHeader"
import { GanttProjectSection } from "./GanttProjectRow"

type GanttBoardProps = {
    visibleProjects: GanttProject[]
    today: string
    range: Range
    mode: "day" | "week" | "month"
    canManage: boolean
    holidays: { date: string; name: string }[]
    collapsed: Set<string>
    onToggleCollapsed: (projectId: string) => void
    onEditAlloc: (alloc: GanttAllocation) => void
    onNewAlloc: (projectId: string, startDate?: string, endDate?: string, rowId?: string) => void
    applyOptimistic: (alloc: GanttAllocation) => GanttAllocation
    clients: ClientOption[]
    managers: ManagerOption[]
}

export function GanttBoard({
    visibleProjects, today, range, mode, canManage, holidays,
    collapsed, onToggleCollapsed, onEditAlloc, onNewAlloc, applyOptimistic,
    clients, managers,
}: GanttBoardProps) {
    const { style, setTimelineRef } = useTimelineContext()

    return (
        <div className="rounded-xl border border-sidebar-border bg-sidebar/30 overflow-clip shadow-sm">
            <GanttHeader mode={mode} today={today} holidays={holidays} range={range} />
            <div
                ref={setTimelineRef as (el: HTMLDivElement | null) => void}
                style={style}
                className="divide-y divide-sidebar-border"
            >
                {visibleProjects.length === 0 && (
                    <div className="py-16 text-center">
                        <p className="text-sm text-muted-foreground">No projects match your filters.</p>
                    </div>
                )}
                {visibleProjects.map((project) => (
                    <GanttProjectSection
                        key={project.id}
                        project={project}
                        isExpanded={!collapsed.has(project.id)}
                        onToggle={() => onToggleCollapsed(project.id)}
                        today={today}
                        range={range}
                        canManage={canManage}
                        holidays={holidays}
                        clients={clients}
                        managers={managers}
                        onEditAlloc={onEditAlloc}
                        onNewAlloc={onNewAlloc}
                        applyOptimistic={applyOptimistic}
                    />
                ))}
            </div>
        </div>
    )
}

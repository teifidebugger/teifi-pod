import type { UATColumn } from "@/lib/uat-mapping"
export type { TeamActionStates } from "@/services/portal/PortalWorkflowService"

export type RawLinearNode = {
    id?: string | null
    identifier?: string | null
    title?: string | null
    description?: string | null
    url?: string | null
    priority?: number | null
    createdAt?: string | null
    updatedAt?: string | null
    completedAt?: string | null
    state?: { id?: string | null; name?: string | null; type?: string | null; color?: string | null } | null
    assignee?: { id?: string | null; name?: string | null; avatarUrl?: string | null } | null
    creator?: { id?: string | null; name?: string | null; avatarUrl?: string | null } | null
    project?: { id?: string | null; name?: string | null } | null
    cycle?: { number?: number | null; name?: string | null } | null
    parent?: { id?: string | null; identifier?: string | null; title?: string | null } | null
    labels?: { nodes?: Array<{ id?: string | null; name?: string | null; color?: string | null }> | null } | null
}

export type PortalAttachment = {
    id: string
    url: string
    title: string
    subtitle: string | null
}

export type PortalIssue = {
    id: string
    identifier: string
    title: string
    description: string | null
    url: string
    priority: number
    state: { id: string; name: string; type: string; color: string }
    assignee: { id: string; name: string; avatarUrl: string | null } | null
    creator: { id: string; name: string; avatarUrl: string | null } | null
    labels: Array<{ id: string; name: string; color: string }>
    project: { id: string; name: string } | null
    cycle: { number: number; name: string | null } | null
    parent: { id: string; identifier: string; title: string } | null
    createdAt: string
    updatedAt: string
    completedAt: string | null
    /** Resolved UAT column: custom mapping overrides heuristic. null = hidden from portal. */
    uatColumn: UATColumn | null
}

export type PortalWorkflowState = {
    id: string
    name: string
    type: string
    color: string
    position: number
    /** Resolved UAT column for this state. null = not mapped / hidden. */
    uatColumn: UATColumn | null
}

export type PortalModuleLabel = {
    id: string
    name: string
    color: string
    parentId: string | null
    children: PortalModuleLabel[]
}

export type PortalComment = {
    id: string
    body: string
    authorName: string
    createdAt: string
}

export type PortalChildIssue = {
    id: string
    identifier: string
    title: string
    state: { id: string; name: string; type: string; color: string }
    priority: number
    /** Resolved UAT column using same DB mapping logic as parent issues. null = not mapped. */
    uatColumn: UATColumn | null
}

export function mapLinearNode(i: RawLinearNode): Omit<PortalIssue, "uatColumn"> {
    return {
        id: i.id!,
        identifier: i.identifier ?? "",
        title: i.title ?? "",
        description: i.description ?? null,
        url: i.url ?? "",
        priority: i.priority ?? 0,
        state: {
            id: i.state?.id ?? "",
            name: i.state?.name ?? "",
            type: i.state?.type ?? "",
            color: i.state?.color ?? "#6b7280",
        },
        assignee: i.assignee?.id ? { id: i.assignee.id, name: i.assignee.name ?? "", avatarUrl: i.assignee.avatarUrl ?? null } : null,
        creator: i.creator?.id ? { id: i.creator.id, name: i.creator.name ?? "", avatarUrl: i.creator.avatarUrl ?? null } : null,
        labels: (i.labels?.nodes ?? []).filter(l => l.id).map(l => ({ id: l.id!, name: l.name ?? "", color: l.color || "#6b7280" })),
        project: i.project?.id ? { id: i.project.id, name: i.project.name ?? "" } : null,
        cycle: i.cycle?.number != null ? { number: i.cycle.number, name: i.cycle.name ?? null } : null,
        parent: i.parent?.id ? { id: i.parent.id, identifier: i.parent.identifier ?? "", title: i.parent.title ?? "" } : null,
        createdAt: i.createdAt ?? new Date().toISOString(),
        updatedAt: i.updatedAt ?? new Date().toISOString(),
        completedAt: i.completedAt ?? null,
    }
}

// ─── Shared types and constants for ScheduleGrid sub-components ───────────────

export type Project = {
    id: string
    name: string
    color: string
    clientName: string | null
    isTentative?: boolean
}

export type Allocation = {
    id: string
    rowId: string
    memberId: string | null
    placeholderId: string | null
    projectId: string
    startDate: string
    endDate: string
    hoursPerDay: number
    type: "SOFT" | "HARD"
    notes: string | null
    project: Project
}

export type TimeEntryBlock = {
    projectId: string
    projectName: string
    dateIndex: number
    durationSeconds: number
}

export type Holiday = { date: string; name: string }

export const SIDEBAR_WIDTH = 256
export const BAR_HEIGHT = 32
export const BAR_GAP = 4
export const PROJ_ROW_PAD = 4
export const DAY_MS = 24 * 60 * 60 * 1000
export const SIX_HOURS_MS = 6 * 60 * 60 * 1000

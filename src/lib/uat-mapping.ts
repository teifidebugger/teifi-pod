/**
 * UAT Column Mapping — ported from teifi-portal/src/utils/clientTasksMapping.ts
 *
 * Maps Linear workflow state names to client-friendly UAT columns.
 * Strict name-based matching — no fallback. Issues that don't match any rule
 * are not displayed on the UAT board.
 */

export type UATColumn = "in-development" | "submitted" | "client-review" | "blocked" | "done" | "released" | "archived" | "canceled"
    | "backlog" | "not-started"

export interface UATColumnConfig {
    id: UATColumn
    title: string
    description: string
    color: string
    allowIssueCreation: boolean
}

export const UAT_COLUMNS: UATColumnConfig[] = [
    {
        id: "backlog",
        title: "Backlog",
        description: "Roadmap items planned for future work",
        color: "#bec2c8",
        allowIssueCreation: false,
    },
    {
        id: "submitted",
        title: "In Evaluation",
        description: "Newly reported — awaiting team triage",
        color: "#6366f1",
        allowIssueCreation: true,
    },
    {
        id: "not-started",
        title: "Not Started",
        description: "Ready for development",
        color: "#94a3b8",
        allowIssueCreation: false,
    },
    {
        id: "in-development",
        title: "In Progress",
        description: "Being worked on — not yet ready for client review",
        color: "#3b82f6",
        allowIssueCreation: false,
    },
    {
        id: "blocked",
        title: "Blocked / Needs Input",
        description: "Waiting for information or client feedback",
        color: "#f59e0b",
        allowIssueCreation: false,
    },
    {
        id: "client-review",
        title: "Needs Review",
        description: "Ready for your review and feedback",
        color: "#8b5cf6",
        allowIssueCreation: false,
    },
    {
        id: "done",
        title: "Approved",
        description: "Approved and completed",
        color: "#10b981",
        allowIssueCreation: false,
    },
    {
        id: "released",
        title: "Released",
        description: "Shipped to production",
        color: "#059669",
        allowIssueCreation: false,
    },
    {
        id: "canceled",
        title: "Canceled",
        description: "Canceled issues",
        color: "#ef4444",
        allowIssueCreation: false,
    },
    {
        id: "archived",
        title: "Archived",
        description: "Rejected, failed, or duplicate issues",
        color: "#64748b",
        allowIssueCreation: false,
    },
]

/**
 * Map a Linear workflow state to a UAT column.
 *
 * Strategy (highest priority first):
 * 1. Name-based patterns for UAT-specific states (most specific)
 * 2. Linear state.type fallback for generic workflows:
 *    - completed  → "done"  (any "Done"/"Closed" state)
 *    - cancelled  → "canceled"
 *    - backlog / unstarted → null (still in development, not client-facing yet)
 *    - started    → null (in progress internally, not yet ready for client)
 *
 * Returns null if the issue should not appear on the UAT board.
 */
/** All Linear workflow state types */
export const LINEAR_STATE_TYPES = ["triage", "backlog", "unstarted", "started", "completed", "cancelled"] as const
export type LinearStateType = typeof LINEAR_STATE_TYPES[number]

/**
 * Hard-coded default state-type → UAT column mapping.
 * Only types that have a deterministic default are included.
 * Notably "completed" is absent — see mapStateToUATColumn comment.
 */
export const DEFAULT_STATE_TYPE_MAPPING: Partial<Record<LinearStateType, UATColumn | null>> = {
    triage:    "submitted",
    backlog:   "backlog",
    unstarted: "not-started",
    started:   "in-development",
    cancelled: "canceled",
}

export function mapStateToUATColumn(
    state: { name: string; type: string },
    /** Workspace-level type mapping override — applied between name patterns and hard-coded fallback */
    workspaceTypeMapping?: Partial<Record<string, UATColumn | null>>,
): UATColumn | null {
    const name = state.name.toLowerCase()
    const type = state.type

    // ── Name-based rules (highest priority) ─────────────────────────────────

    // Triage / Submitted / In Evaluation (new portal submissions)
    if (
        name.includes("triage") ||
        name.includes("submitted") ||
        name.includes("new issue") ||
        name.includes("reported") ||
        name.includes("evaluation") ||
        name.includes("pending discovery")
    ) return "submitted"

    // Not Started (ready for dev, not yet picked up)
    if (name.includes("not started")) return "not-started"

    // Client Blocked → Blocked / Needs Input (client must provide info)
    // Must come BEFORE generic "blocked" check below
    if (name.includes("client blocked")) return "blocked"

    // In Progress / internal dev states (includes generic "Blocked" per Notion spec)
    if (
        name.includes("in progress") ||
        name.includes("blocked") ||
        name.includes("pending code review") ||
        name.includes("internal qa") ||
        name === "qa"
    ) return "in-development"

    // Shipped/Released → Released
    if (
        name.includes("shipped") ||
        name.includes("released") ||
        name.includes("live") ||
        name.includes("deployed") ||
        name.includes("production")
    ) return "released"

    // Client Review / UAT → Pending Review
    if (
        name.includes("client review") ||
        name.includes("client-review") ||
        name.includes("uat") ||
        name.includes("pending review") ||
        name.includes("needs review") ||
        name.includes("ready for review") ||
        name.includes("ready to review") ||
        name.includes("in review") ||
        name.includes("qa review")
    ) return "client-review"

    // Duplicate/Rejected/Failed/Archived → Archived
    if (
        name.includes("duplicate") ||
        name.includes("rejected") ||
        name.includes("failed") ||
        name.includes("wont fix") ||
        name.includes("won't fix") ||
        name.includes("archived")
    ) return "archived"

    // Canceled → Canceled (Linear API uses "canceled" American spelling for type)
    if (type === "canceled" || type === "cancelled" || name.includes("canceled") || name.includes("cancelled")) return "canceled"

    // Release Ready / Approved → Approved
    if (
        name.includes("release ready") ||
        name.includes("ready for release") ||
        name.includes("ready to release") ||
        name.includes("approved") ||
        name.includes("accepted")
    ) return "done"

    // Waiting / On Hold → Blocked (client-facing wait states)
    if (
        name.includes("waiting") ||
        name.includes("on hold") ||
        name.includes("paused") ||
        name.includes("needs input") ||
        name.includes("needs clarification")
    ) return "blocked"

    // ── Workspace-level type mapping (between name patterns and hard-coded fallback) ───
    if (workspaceTypeMapping && type in workspaceTypeMapping) {
        return workspaceTypeMapping[type] ?? null
    }

    // ── Hard-coded state.type fallback ───────────────────────────────────────
    // NOTE: "completed" type is intentionally NOT mapped here by default.
    // Linear teams share dev + UAT workflows; a generic "Done" state would expose
    // all internal dev tasks to the client. Admins can opt-in via workspace settings.

    // Triage type → Submitted (new portal submissions land here)
    if (type === "triage") return "submitted"

    // Backlog type → Backlog
    if (type === "backlog") return "backlog"

    // Cancelled type → Canceled (Linear API uses "canceled" American spelling)
    if (type === "canceled" || type === "cancelled") return "canceled"

    // All other states (backlog / unstarted / started / completed without UAT name) → hidden
    return null
}

export type AllowedTransitions = Partial<Record<UATColumn, UATColumn[]>>

/**
 * Columns portal clients can move issues FROM.
 * Only the columns clients actively interact with — staff-only columns (in-development)
 * and passive end-states (released, archived, canceled) are excluded.
 */
export const CLIENT_FROM_COLUMNS: UATColumn[] = ["submitted", "client-review", "blocked", "done"]

/**
 * Columns portal clients can move issues TO.
 * All columns are included so admins can enable any target.
 */
export const CLIENT_TO_COLUMNS: UATColumn[] = ["submitted", "client-review", "blocked", "in-development", "done", "released", "archived", "canceled"]

/** All UAT columns staff can move issues FROM (full access). */
export const STAFF_FROM_COLUMNS: UATColumn[] = ["backlog", "submitted", "not-started", "in-development", "client-review", "blocked", "done", "released", "archived", "canceled"]

/** All UAT columns staff can move issues TO (full access). */
export const STAFF_TO_COLUMNS: UATColumn[] = ["backlog", "submitted", "not-started", "in-development", "client-review", "blocked", "done", "released", "archived", "canceled"]

/**
 * Default portal-user transitions between UAT columns.
 * Used when no per-team DB configuration is set.
 * Admin preview can bypass these restrictions.
 */
export const DEFAULT_CLIENT_TRANSITIONS: AllowedTransitions = {
    "client-review": ["done", "submitted", "archived"],
    "blocked": ["client-review", "archived"],
}

/**
 * Build a fully-open AllowedTransitions where every FROM → every TO is allowed.
 * Used as the default staff transitions (staff can move issues freely).
 */
export function buildOpenTransitions(fromCols: UATColumn[], toCols: UATColumn[]): AllowedTransitions {
    const result: AllowedTransitions = {}
    for (const from of fromCols) {
        result[from] = toCols.filter(to => to !== from)
    }
    return result
}

/** Staff default: all transitions open (built from STAFF_FROM/TO_COLUMNS). */
export const DEFAULT_STAFF_TRANSITIONS: AllowedTransitions = buildOpenTransitions(STAFF_FROM_COLUMNS, STAFF_TO_COLUMNS)


/**
 * Find the Linear state ID for a target UAT column.
 * Checks admin-configured custom mappings first, then falls back to the heuristic.
 */
export function findStateForUATColumn(
    states: Array<{ id: string; name: string; type: string }>,
    target: UATColumn,
    customMappings?: Map<string, UATColumn | null>
): string | null {
    // Custom mappings take priority (admin-configured overrides)
    if (customMappings) {
        for (const [stateId, col] of customMappings) {
            if (col === target && states.some(s => s.id === stateId)) return stateId
        }
    }
    // Heuristic fallback
    for (const s of states) {
        if (mapStateToUATColumn(s) === target) return s.id
    }
    return null
}

/**
 * Shared utilities for portal issue display and logic.
 *
 * Single source of truth for constants and helpers used by both
 * UATKanban (board view) and AcceptanceBoard (list view), as well as
 * PortalFeedbackView and portal-stats.
 */

import type { PortalIssue } from "@/app/actions/portal/types"
import type { Editor } from "@tiptap/react"
import { mapStateToUATColumn, type UATColumn, type AllowedTransitions } from "@/lib/uat-mapping"

// ─── Column progress colors (match UAT_COLUMNS color values) ─────────────────

export const DONE_COLOR    = "#10b981"  // emerald-500
export const BLOCKED_COLOR = "#f59e0b"  // amber-400
export const PENDING_COLOR = "#3b82f6"  // blue-500

// ─── Priority ────────────────────────────────────────────────────────────────

/** Tailwind color class + display label for each priority level. */
export const PRIORITY_CONFIG: Record<number, { label: string; colorClass: string; textColor: string; dotColor: string }> = {
    0: { label: "No priority", colorClass: "bg-muted-foreground/30", textColor: "text-muted-foreground", dotColor: "#9ca3af" },
    1: { label: "Urgent",      colorClass: "bg-red-500",            textColor: "text-red-600",          dotColor: "#dc2626" },
    2: { label: "High",        colorClass: "bg-orange-400",         textColor: "text-orange-500",       dotColor: "#f97316" },
    3: { label: "Medium",      colorClass: "bg-yellow-400",         textColor: "text-yellow-500",       dotColor: "#eab308" },
    4: { label: "Low",         colorClass: "bg-green-500",          textColor: "text-green-500",        dotColor: "#22c55e" },
}

/** Ordered array for priority filter UI (Urgent → Low → None). */
export const PRIORITY_FILTER_OPTIONS = [1, 2, 3, 4, 0].map(v => ({
    value: v,
    label: PRIORITY_CONFIG[v].label,
    colorClass: PRIORITY_CONFIG[v].colorClass,
}))

// ─── Scope ───────────────────────────────────────────────────────────────────

/** UAT columns that represent "needs client review". Used for scope filtering. */
export const NEEDS_REVIEW_COLS: readonly UATColumn[] = ["submitted", "not-started", "client-review", "blocked"]

// ─── Description parsing ─────────────────────────────────────────────────────

/** Parse a Linear issue description that may contain a portal metadata footer.
 *  Returns the visible body and the raw footer block (empty string if none). */
export function parsePortalDescription(raw: string): { body: string; footer: string } {
    const s = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    // Linear escapes square brackets in markdown → \[Portal Metadata\]; check both forms
    const tag = s.includes("[Portal Metadata]") ? "[Portal Metadata]" :
                s.includes("\\[Portal Metadata\\]") ? "\\[Portal Metadata\\]" : null
    const metaIdx = tag ? s.indexOf(tag) : -1
    if (metaIdx !== -1) {
        // Backtrack to the start of the line containing the tag, so we don't split mid-line
        const lineStart = metaIdx === 0 ? 0 : s.lastIndexOf("\n", metaIdx - 1) + 1
        const body = s.slice(0, lineStart).trimEnd()
        return { body, footer: "\n" + s.slice(lineStart) }
    }
    // Legacy format: ---\n*Portal submission ...*
    const legacyMatch = s.match(/\n+---\n+\*Portal submission/i)
    if (legacyMatch?.index !== undefined) return { body: s.slice(0, legacyMatch.index), footer: s.slice(legacyMatch.index) }
    // Edge: description is ONLY the footer
    if (/^-{3}\n+\*Portal submission/i.test(s)) return { body: "", footer: s }
    return { body: s, footer: "" }
}

/** Extract the portal submitter name + email from an issue description footer.
 *  Handles both `**Name** (email)` and legacy `**Name**` formats. */
export function parsePortalSubmitter(raw: string | null): { name: string; email: string | null } | null {
    if (!raw) return null
    const { footer } = parsePortalDescription(raw)
    if (!footer) return null
    // Match: Submitted by: **Name** `email` or legacy **Name** (email) or just **Name**
    const m = footer.match(/Submitted by:\s*\*\*(.+?)\*\*(?:\s*`([^`]+)`|\s*\(([^)]+)\))?/i)
    if (!m) return null
    return { name: m[1].trim(), email: (m[2] ?? m[3])?.trim() ?? null }
}

// ─── TipTap helpers ──────────────────────────────────────────────────────────

/** Type-safe accessor for tiptap-markdown storage (no official type export). */
export function getEditorMarkdown(editor: Editor): string {
    return (editor.storage as unknown as Record<string, { getMarkdown(): string }>).markdown.getMarkdown()
}

// ─── Column resolution ───────────────────────────────────────────────────────

/**
 * Resolve the UAT column for an issue.
 * Prefers the pre-computed `issue.uatColumn` (set by the server with custom
 * state-mapping config), falls back to the heuristic name/type mapping.
 */
export function getIssueUATColumn(issue: PortalIssue): UATColumn | null {
    return issue.uatColumn ?? mapStateToUATColumn({ name: issue.state.name, type: issue.state.type })
}

/**
 * Resolve the allowed transition targets for an issue given its current column.
 */
export function getIssueTransitions(issue: PortalIssue, allowedTransitions: AllowedTransitions): UATColumn[] {
    const col = getIssueUATColumn(issue)
    return col ? (allowedTransitions[col] ?? []) : []
}

// ─── Assignee ────────────────────────────────────────────────────────────────

/** Derive up to 2-character initials from a full name. */
export function getAssigneeInitials(name: string | null | undefined, fallback = ""): string {
    return name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? fallback
}

// ─── Issue separation ────────────────────────────────────────────────────────

/**
 * Separate a flat issue list into top-level issues and a sub-issue map.
 *
 * Mirrors the kanboard filter: only `parent === null` issues are "main" issues.
 * Sub-issues are grouped under their parent's ID.
 */
export function separateIssues(issues: PortalIssue[]): {
    topLevel: PortalIssue[]
    subIssueMap: Map<string, PortalIssue[]>
} {
    const topLevel: PortalIssue[] = []
    const subIssueMap = new Map<string, PortalIssue[]>()

    for (const issue of issues) {
        if (issue.parent === null) {
            topLevel.push(issue)
        } else {
            const arr = subIssueMap.get(issue.parent.id) ?? []
            arr.push(issue)
            subIssueMap.set(issue.parent.id, arr)
        }
    }

    return { topLevel, subIssueMap }
}

// ─── Sub-issue approval gate ─────────────────────────────────────────────────

/** Terminal columns that count as "resolved" for the sub-issue approval gate. */
const RESOLVED_COLS: readonly UATColumn[] = ["done", "released", "archived", "canceled"]

/**
 * Check whether a parent issue can be approved given its sub-issues.
 *
 * A parent may only be approved (moved to "done" / "released") when every
 * sub-issue is in a terminal column: done, released, archived, or canceled.
 *
 * Returns `{ blocked: false }` when there are no sub-issues (gate is open).
 */
export function getSubIssueApprovalBlock(subIssues: PortalIssue[]): {
    blocked: boolean
    pendingCount: number
} {
    if (subIssues.length === 0) return { blocked: false, pendingCount: 0 }
    const pendingCount = subIssues.filter(s => {
        const col = getIssueUATColumn(s)
        return col === null || !RESOLVED_COLS.includes(col)
    }).length
    return { blocked: pendingCount > 0, pendingCount }
}

// ─── Device detection ─────────────────────────────────────────────────────────

export interface DeviceInfo {
    deviceType: "Desktop" | "Mobile" | "Tablet"
    browser: string
    os: string
    screenSize: string
    viewportSize: string
    pixelRatio: string
    url: string
}

export function detectDeviceInfo(): DeviceInfo | null {
    if (typeof window === "undefined") return null
    const ua = navigator.userAgent
    // Browser (order matters: Edge > Opera > Chrome > Firefox > Safari)
    let browser = "Unknown"
    if (/Edg\//.test(ua)) browser = `Edge ${ua.match(/Edg\/([\d]+)/)?.[1] ?? ""}`
    else if (/OPR\//.test(ua)) browser = `Opera ${ua.match(/OPR\/([\d]+)/)?.[1] ?? ""}`
    else if (/Chrome\//.test(ua)) browser = `Chrome ${ua.match(/Chrome\/([\d]+)/)?.[1] ?? ""}`
    else if (/Firefox\//.test(ua)) browser = `Firefox ${ua.match(/Firefox\/([\d]+)/)?.[1] ?? ""}`
    else if (/Safari\//.test(ua)) browser = `Safari ${ua.match(/Version\/([\d]+)/)?.[1] ?? ""}`
    // OS
    let os = "Unknown"
    if (/Windows NT 10/.test(ua)) os = "Windows 10/11"
    else if (/Windows NT 6\.3/.test(ua)) os = "Windows 8.1"
    else if (/Windows NT 6\.1/.test(ua)) os = "Windows 7"
    else if (/Mac OS X ([\d_]+)/.test(ua)) { const m = ua.match(/Mac OS X ([\d_]+)/); os = m ? `macOS ${m[1].replace(/_/g, ".")}` : "macOS" }
    else if (/Android ([\d.]+)/.test(ua)) { const m = ua.match(/Android ([\d.]+)/); os = m ? `Android ${m[1]}` : "Android" }
    else if (/iPhone OS ([\d_]+)/.test(ua)) { const m = ua.match(/iPhone OS ([\d_]+)/); os = m ? `iOS ${m[1].replace(/_/g, ".")}` : "iOS" }
    else if (/Linux/.test(ua)) os = "Linux"
    // Device type
    let deviceType: DeviceInfo["deviceType"] = "Desktop"
    if (/iPad|Tablet/i.test(ua)) deviceType = "Tablet"
    else if (/Mobi|Android|iPhone/i.test(ua)) deviceType = "Mobile"

    return {
        deviceType,
        browser: browser.trim(),
        os,
        screenSize: `${window.screen.width} × ${window.screen.height}`,
        viewportSize: `${window.innerWidth} × ${window.innerHeight}`,
        pixelRatio: `@${window.devicePixelRatio}x`,
        url: window.location.href,
    }
}

export function buildDeviceFooter(info: Partial<DeviceInfo>): string {
    const lines: string[] = []
    if (info.deviceType)    lines.push(`- **Device:** ${info.deviceType}`)
    if (info.browser)       lines.push(`- **Browser:** ${info.browser}`)
    if (info.os)            lines.push(`- **OS:** ${info.os}`)
    if (info.screenSize)    lines.push(`- **Screen:** ${info.screenSize}`)
    if (info.viewportSize)  lines.push(`- **Viewport:** ${info.viewportSize}`)
    if (info.pixelRatio)    lines.push(`- **Pixel Ratio:** ${info.pixelRatio}`)
    if (info.url)           lines.push(`- **URL:** ${info.url}`)
    if (lines.length === 0) return ""
    // Use pre-escaped brackets so the string round-trips correctly through Linear's markdown normalisation
    return ["", "\\[Portal Metadata\\]", ...lines, "\\[/Portal Metadata\\]"].join("\n")
}

export function parseDeviceFooter(footer: string): Partial<DeviceInfo> | null {
    if (!footer || (!footer.includes("[Portal Metadata]") && !footer.includes("\\[Portal Metadata\\]"))) return null
    const get = (key: string) => {
        const m = footer.match(new RegExp(`\\*\\*${key}:\\*\\* ([^\\n]+)`))
        // Strip trailing closing tag — Linear may escape it as \[/Portal Metadata\] or leave it unescaped
        const raw = m?.[1]?.trim()
            .replace(/\s*\\\[\/Portal Metadata\\\]\s*$/, "")
            .replace(/\s*\[\/Portal Metadata\]\s*$/, "") ?? null
        if (!raw) return null
        // Strip markdown link syntax [label](url) → extract url
        const linkMatch = raw.match(/^\[.*?\]\((.+?)\)$/)
        return linkMatch ? linkMatch[1] : raw
    }
    const deviceType = get("Device") as DeviceInfo["deviceType"] | null
    const browser = get("Browser")
    if (!deviceType && !browser) return null
    return {
        deviceType: deviceType ?? undefined,
        browser: browser ?? undefined,
        os: get("OS") ?? undefined,
        screenSize: get("Screen") ?? undefined,
        viewportSize: get("Viewport") ?? undefined,
        pixelRatio: get("Pixel Ratio") ?? undefined,
        url: get("URL") ?? undefined,
    }
}

// ─── Stats ───────────────────────────────────────────────────────────────────

/**
 * Compute progress stats for a list of issues.
 *
 * - `active`  = total excluding archived/canceled (the denominator for %)
 * - `pct`     = done / active (approval rate)
 */
export function computeIssueStats(issues: PortalIssue[]) {
    const cols = issues.map(getIssueUATColumn)
    const done    = cols.filter(c => c === "done" || c === "released").length
    const pending = cols.filter(c => c === "client-review").length
    const blocked = cols.filter(c => c === "blocked").length
    const closed  = cols.filter(c => c === "archived" || c === "canceled").length
    const active  = issues.length - closed
    const pct     = active === 0 ? 0 : Math.round((done / active) * 100)
    return { total: issues.length, done, pending, blocked, closed, active, pct }
}

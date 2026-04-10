"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember } from "@/app/actions"
import { format, startOfWeek, startOfMonth, startOfDay, endOfDay } from "date-fns"

// ─── Expense Report ───────────────────────────────────────────────────────────

export interface ExpenseReportFilters {
    from: string        // ISO date string yyyy-MM-dd
    to: string          // ISO date string yyyy-MM-dd
    projectId: string   // "" = all
    userId: string      // "" = all
    categoryId: string  // "" = all
    billable: "all" | "billable" | "nonbillable"
}

export interface ExpenseReportEntry {
    id: string
    date: string          // ISO date string
    userName: string
    userEmail: string
    projectName: string
    categoryName: string | null
    description: string
    amountCents: number
    isBillable: boolean
    notes: string | null
}

export interface ExpenseReportData {
    entries: ExpenseReportEntry[]
    totalCents: number
    billableCents: number
    nonBillableCents: number
}

export async function getExpenseReport(filters: ExpenseReportFilters): Promise<ExpenseReportData> {
    const { user, member } = await getSessionMember()

    const isAdmin = ["OWNER", "ADMIN", "MANAGER"].includes(member.role)
    if (!isAdmin) {
        filters = { ...filters, userId: user.id }
    }

    const startDate = filters.from ? startOfDay(new Date(filters.from + "T12:00:00")) : undefined
    const endDate = filters.to ? endOfDay(new Date(filters.to + "T12:00:00")) : undefined

    const rows = await prisma.expense.findMany({
        where: {
            project: { workspaceId: member.workspaceId },
            ...(startDate || endDate ? { date: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } } : {}),
            ...(filters.projectId ? { projectId: filters.projectId } : {}),
            ...(filters.userId ? { userId: filters.userId } : {}),
            ...(filters.categoryId ? { expenseCategoryId: filters.categoryId } : {}),
            ...(filters.billable === "billable" ? { isBillable: true } : filters.billable === "nonbillable" ? { isBillable: false } : {}),
        },
        include: {
            project: { select: { name: true } },
            user: { select: { name: true, email: true } },
            expenseCategory: { select: { name: true } },
        },
        orderBy: { date: "desc" },
    })

    const entries: ExpenseReportEntry[] = rows.map((r) => ({
        id: r.id,
        date: r.date.toISOString().slice(0, 10),
        userName: r.user.name ?? r.user.email,
        userEmail: r.user.email,
        projectName: r.project.name,
        categoryName: r.expenseCategory?.name ?? null,
        description: r.description,
        amountCents: r.amountCents,
        isBillable: r.isBillable,
        notes: r.notes,
    }))

    const totalCents = entries.reduce((s, e) => s + e.amountCents, 0)
    const billableCents = entries.filter((e) => e.isBillable).reduce((s, e) => s + e.amountCents, 0)
    const nonBillableCents = totalCents - billableCents

    return { entries, totalCents, billableCents, nonBillableCents }
}

export type GroupBy = "day" | "week" | "month" | "project" | "client" | "member"

export interface ReportFilters {
    from: string        // ISO date string yyyy-MM-dd
    to: string          // ISO date string yyyy-MM-dd
    projectId: string   // "" = all
    clientId: string    // "" = all
    userId: string      // "" = all
    billable: "all" | "billable" | "non-billable"
    approvalStatus: "all" | "approved" | "pending"
    groupBy: GroupBy
}

export interface ReportRow {
    label: string
    displayLabel: string
    totalSeconds: number
    billableSeconds: number
    entries: number
    billableAmountCents: number
}

export interface ReportData {
    rows: ReportRow[]
    totalSeconds: number
    billableSeconds: number
    billableAmountCents: number
    entryCount: number
}

function displayLabelFromKey(key: string, groupBy: GroupBy): string {
    if (groupBy === "day")   return format(new Date(key + "T12:00:00"), "MMM d, yyyy")
    if (groupBy === "week")  return "Week of " + format(new Date(key + "T12:00:00"), "MMM d")
    if (groupBy === "month") return format(new Date(key + "-15"), "MMM yyyy")
    return key
}

// Raw aggregation row returned by $queryRaw for date-based groupings
interface DateGroupRaw {
    grp_key: string
    total_seconds: bigint
    billable_seconds: bigint
    entry_count: bigint
    billable_amount_cents: bigint
}

// Raw aggregation row returned for project/client/member groupings via prisma.timeEntry.groupBy
interface EntityGroupRaw {
    groupId: string
    total_seconds: number
    billable_seconds: number
    entry_count: number
    billable_amount_cents: number
}

export async function getReportData(filters: ReportFilters): Promise<ReportData> {
    const { user, member } = await getSessionMember()

    // MEMBER/CONTRACTOR can only see their own data
    const canViewAll = ["OWNER", "ADMIN", "MANAGER"].includes(member.role)
    const scopedUserId = canViewAll ? filters.userId : user.id

    const { groupBy } = filters

    // ── Date-based groupings: use $queryRaw with DATE_TRUNC / raw date for GROUP BY ──
    if (groupBy === "day" || groupBy === "week" || groupBy === "month") {
        // Build parameterised filter conditions for the raw query.
        // We build a WHERE clause dynamically but all values go through parameters — no interpolation.
        const params: (string | boolean)[] = [member.workspaceId]
        const clauses: string[] = [`p."workspaceId" = $${params.length}`]

        if (filters.from) {
            params.push(filters.from)
            clauses.push(`te.date >= $${params.length}`)
        }
        if (filters.to) {
            params.push(filters.to)
            clauses.push(`te.date <= $${params.length}`)
        }
        if (filters.projectId) {
            params.push(filters.projectId)
            clauses.push(`te."projectId" = $${params.length}`)
        }
        if (scopedUserId) {
            params.push(scopedUserId)
            clauses.push(`te."userId" = $${params.length}`)
        }
        if (filters.clientId) {
            params.push(filters.clientId)
            clauses.push(`p."clientId" = $${params.length}`)
        }
        if (filters.billable === "billable") {
            params.push(true)
            clauses.push(`te."isBillable" = $${params.length}`)
        } else if (filters.billable === "non-billable") {
            params.push(false)
            clauses.push(`te."isBillable" = $${params.length}`)
        }
        if (filters.approvalStatus === "approved") {
            params.push("APPROVED")
            clauses.push(`te."approvalStatus" = $${params.length}`)
        } else if (filters.approvalStatus === "pending") {
            params.push("PENDING")
            clauses.push(`te."approvalStatus" = $${params.length}`)
        }
        // Exclude active timers
        clauses.push(`te."timerStartedAt" IS NULL`)

        const whereClause = clauses.join(" AND ")

        // Group key expression per period
        const grpExpr =
            groupBy === "day"
                ? `te.date`
                : groupBy === "week"
                ? `to_char(date_trunc('week', (te.date || 'T12:00:00')::timestamp), 'YYYY-MM-DD')`
                : `to_char(date_trunc('month', (te.date || 'T12:00:00')::timestamp), 'YYYY-MM')`

        const sql = `
            SELECT
                ${grpExpr} AS grp_key,
                SUM(te."durationSeconds")::bigint AS total_seconds,
                SUM(CASE WHEN te."isBillable" THEN te."durationSeconds" ELSE 0 END)::bigint AS billable_seconds,
                COUNT(*)::bigint AS entry_count,
                SUM(CASE WHEN te."isBillable"
                    THEN ROUND(te."durationSeconds"::numeric / 3600 * te."billableRateCents")
                    ELSE 0 END)::bigint AS billable_amount_cents
            FROM "TimeEntry" te
            JOIN "TeifiProject" p ON p.id = te."projectId"
            WHERE ${whereClause}
            GROUP BY grp_key
            ORDER BY grp_key ASC
        `

        const rawRows = await prisma.$queryRawUnsafe<DateGroupRaw[]>(sql, ...params)

        const rows: ReportRow[] = rawRows.map((r) => ({
            label: r.grp_key,
            displayLabel: displayLabelFromKey(r.grp_key, groupBy),
            totalSeconds: Number(r.total_seconds),
            billableSeconds: Number(r.billable_seconds),
            entries: Number(r.entry_count),
            billableAmountCents: Number(r.billable_amount_cents),
        }))

        const totalSeconds = rows.reduce((s, r) => s + r.totalSeconds, 0)
        const billableSeconds = rows.reduce((s, r) => s + r.billableSeconds, 0)
        const billableAmountCents = rows.reduce((s, r) => s + r.billableAmountCents, 0)
        const entryCount = rows.reduce((s, r) => s + r.entries, 0)

        return { rows, totalSeconds, billableSeconds, billableAmountCents, entryCount }
    }

    // ── Entity-based groupings: project / client / member ────────────────────────
    // For project and member we can use prisma.timeEntry.groupBy.
    // For client we group by project first, then fold by client in JS (one small pass on project rows, not raw entries).

    const baseWhere = {
        timerStartedAt: null as null,
        project: {
            workspaceId: member.workspaceId,
            ...(filters.clientId ? { clientId: filters.clientId } : {}),
        },
        ...(filters.from || filters.to
            ? { date: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
            : {}),
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(scopedUserId      ? { userId: scopedUserId }         : {}),
        ...(filters.billable === "billable"     ? { isBillable: true }  : {}),
        ...(filters.billable === "non-billable" ? { isBillable: false } : {}),
        ...(filters.approvalStatus === "approved" ? { approvalStatus: "APPROVED" as const }
            : filters.approvalStatus === "pending"  ? { approvalStatus: "PENDING"   as const } : {}),
    }

    if (groupBy === "project" || groupBy === "member") {
        const groupField = groupBy === "project" ? "projectId" : "userId"

        const agg = await prisma.timeEntry.groupBy({
            by: [groupField],
            where: baseWhere,
            _sum: { durationSeconds: true },
            _count: { id: true },
        })

        // Also aggregate billable-only sums in a separate pass (groupBy doesn't support conditional SUM)
        const aggBillable = await prisma.timeEntry.groupBy({
            by: [groupField],
            where: { ...baseWhere, isBillable: true },
            _sum: { durationSeconds: true, billableRateCents: true },
        })

        // Compute billableAmountCents per group — we need per-entry precision so fetch just the billable entries for the calculation
        // But to avoid loading all rows, do it per group via a second aggregation using raw:
        // Actually: ROUND(durationSeconds/3600 * billableRateCents) per entry cannot be exactly reproduced by a simple SUM on aggregated fields.
        // Use a focused $queryRaw for billable amount only, grouped by the same field.
        const billableField = groupBy === "project" ? `te."projectId"` : `te."userId"`

        const params2: (string | boolean)[] = [member.workspaceId]
        const clauses2: string[] = [`p."workspaceId" = $${params2.length}`, `te."isBillable" = true`, `te."timerStartedAt" IS NULL`]

        if (filters.from) { params2.push(filters.from); clauses2.push(`te.date >= $${params2.length}`) }
        if (filters.to)   { params2.push(filters.to);   clauses2.push(`te.date <= $${params2.length}`) }
        if (filters.projectId) { params2.push(filters.projectId); clauses2.push(`te."projectId" = $${params2.length}`) }
        if (scopedUserId)      { params2.push(scopedUserId);      clauses2.push(`te."userId" = $${params2.length}`) }
        if (filters.clientId)  { params2.push(filters.clientId);  clauses2.push(`p."clientId" = $${params2.length}`) }
        if (filters.approvalStatus === "approved") { params2.push("APPROVED"); clauses2.push(`te."approvalStatus" = $${params2.length}`) }
        else if (filters.approvalStatus === "pending") { params2.push("PENDING"); clauses2.push(`te."approvalStatus" = $${params2.length}`) }

        const billableAmountSql = `
            SELECT
                ${billableField} AS "groupId",
                SUM(ROUND(te."durationSeconds"::numeric / 3600 * te."billableRateCents"))::bigint AS billable_amount_cents
            FROM "TimeEntry" te
            JOIN "TeifiProject" p ON p.id = te."projectId"
            WHERE ${clauses2.join(" AND ")}
            GROUP BY ${billableField}
        `
        const billableAmountRaw = await prisma.$queryRawUnsafe<{ groupId: string; billable_amount_cents: bigint }[]>(
            billableAmountSql, ...params2
        )
        const billableAmountMap = new Map(billableAmountRaw.map((r) => [r.groupId, Number(r.billable_amount_cents)]))

        // Build maps for lookups
        const billableSecondsMap = new Map(aggBillable.map((r) => [
            groupBy === "project" ? r.projectId : r.userId,
            r._sum.durationSeconds ?? 0,
        ]))

        // Fetch display names: projects or users
        const groupIds = agg.map((r) => groupBy === "project" ? r.projectId : r.userId)

        let labelMap = new Map<string, string>()
        if (groupBy === "project") {
            const projects = await prisma.teifiProject.findMany({
                where: { id: { in: groupIds } },
                select: { id: true, name: true },
            })
            labelMap = new Map(projects.map((p) => [p.id, p.name]))
        } else {
            const users = await prisma.user.findMany({
                where: { id: { in: groupIds } },
                select: { id: true, name: true, email: true },
            })
            labelMap = new Map(users.map((u) => [u.id, u.name ?? u.email]))
        }

        const rows: ReportRow[] = agg.map((r) => {
            const id = groupBy === "project" ? r.projectId : r.userId
            return {
                label: id,
                displayLabel: labelMap.get(id) ?? id,
                totalSeconds: r._sum.durationSeconds ?? 0,
                billableSeconds: billableSecondsMap.get(id) ?? 0,
                entries: r._count.id,
                billableAmountCents: billableAmountMap.get(id) ?? 0,
            }
        })

        const totalSeconds = rows.reduce((s, r) => s + r.totalSeconds, 0)
        const billableSeconds = rows.reduce((s, r) => s + r.billableSeconds, 0)
        const billableAmountCents = rows.reduce((s, r) => s + r.billableAmountCents, 0)
        const entryCount = rows.reduce((s, r) => s + r.entries, 0)

        return { rows, totalSeconds, billableSeconds, billableAmountCents, entryCount }
    }

    // groupBy === "client": group by projectId first via DB, then fold by clientId in JS
    // (clientId lives on TeifiProject, not TimeEntry — one extra JOIN in raw query)
    {
        const params3: (string | boolean)[] = [member.workspaceId]
        const clauses3: string[] = [`p."workspaceId" = $${params3.length}`, `te."timerStartedAt" IS NULL`]

        if (filters.from) { params3.push(filters.from); clauses3.push(`te.date >= $${params3.length}`) }
        if (filters.to)   { params3.push(filters.to);   clauses3.push(`te.date <= $${params3.length}`) }
        if (filters.projectId) { params3.push(filters.projectId); clauses3.push(`te."projectId" = $${params3.length}`) }
        if (scopedUserId)      { params3.push(scopedUserId);      clauses3.push(`te."userId" = $${params3.length}`) }
        if (filters.clientId)  { params3.push(filters.clientId);  clauses3.push(`p."clientId" = $${params3.length}`) }
        if (filters.billable === "billable")     { params3.push(true);  clauses3.push(`te."isBillable" = $${params3.length}`) }
        else if (filters.billable === "non-billable") { params3.push(false); clauses3.push(`te."isBillable" = $${params3.length}`) }
        if (filters.approvalStatus === "approved") { params3.push("APPROVED"); clauses3.push(`te."approvalStatus" = $${params3.length}`) }
        else if (filters.approvalStatus === "pending") { params3.push("PENDING"); clauses3.push(`te."approvalStatus" = $${params3.length}`) }

        interface ClientGroupRaw {
            client_id: string | null
            client_name: string | null
            total_seconds: bigint
            billable_seconds: bigint
            entry_count: bigint
            billable_amount_cents: bigint
        }

        const clientSql = `
            SELECT
                c.id AS client_id,
                c.name AS client_name,
                SUM(te."durationSeconds")::bigint AS total_seconds,
                SUM(CASE WHEN te."isBillable" THEN te."durationSeconds" ELSE 0 END)::bigint AS billable_seconds,
                COUNT(*)::bigint AS entry_count,
                SUM(CASE WHEN te."isBillable"
                    THEN ROUND(te."durationSeconds"::numeric / 3600 * te."billableRateCents")
                    ELSE 0 END)::bigint AS billable_amount_cents
            FROM "TimeEntry" te
            JOIN "TeifiProject" p ON p.id = te."projectId"
            LEFT JOIN "Client" c ON c.id = p."clientId"
            WHERE ${clauses3.join(" AND ")}
            GROUP BY c.id, c.name
            ORDER BY c.name ASC NULLS LAST
        `

        const rawRows = await prisma.$queryRawUnsafe<ClientGroupRaw[]>(clientSql, ...params3)

        const rows: ReportRow[] = rawRows.map((r) => ({
            label: r.client_id ?? "__none__",
            displayLabel: r.client_name ?? "No Client",
            totalSeconds: Number(r.total_seconds),
            billableSeconds: Number(r.billable_seconds),
            entries: Number(r.entry_count),
            billableAmountCents: Number(r.billable_amount_cents),
        }))

        const totalSeconds = rows.reduce((s, r) => s + r.totalSeconds, 0)
        const billableSeconds = rows.reduce((s, r) => s + r.billableSeconds, 0)
        const billableAmountCents = rows.reduce((s, r) => s + r.billableAmountCents, 0)
        const entryCount = rows.reduce((s, r) => s + r.entries, 0)

        return { rows, totalSeconds, billableSeconds, billableAmountCents, entryCount }
    }
}

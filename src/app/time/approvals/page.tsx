import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { startOfWeek, endOfWeek, format, parseISO } from "date-fns"
import { ApprovalControls } from "./ApprovalControls"
import { ApprovalTable, ApprovalGroupRow, BulkApproveButton } from "./ApprovalTable"
import { SubmittedWeeksTable, type SubmittedWeekRow } from "./SubmittedWeeksTable"
import { Prisma } from "@prisma/client"

export default async function ApprovalsPage({
    searchParams,
}: {
    searchParams: Promise<{ week?: string; status?: string; groupBy?: string }>
}) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const callerMember = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { id: true, workspaceId: true, role: true, canWithdrawApprovals: true },
    })
    if (!callerMember) redirect("/")

    const workspace = await prisma.workspace.findUnique({
        where: { id: callerMember.workspaceId },
        select: { weekStartDay: true },
    })
    const weekStartsOn = (workspace?.weekStartDay ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6

    const params = await searchParams
    const groupBy = (params.groupBy === "project" || params.groupBy === "client")
        ? params.groupBy
        : "person"
    const statusFilter = params.status ?? "__all__"

    // Compute the week range
    const weekAnchor = params.week
        ? parseISO(params.week)
        : startOfWeek(new Date(), { weekStartsOn })
    const weekStartDate = startOfWeek(weekAnchor, { weekStartsOn })
    const weekEndDate = endOfWeek(weekAnchor, { weekStartsOn })
    const weekStart = format(weekStartDate, "yyyy-MM-dd")
    const weekEnd = format(weekEndDate, "yyyy-MM-dd")

    // weekStart / weekEnd are yyyy-MM-dd strings used for date-field range queries

    const canApprove = ["OWNER", "ADMIN", "MANAGER"].includes(callerMember.role)
    const canWithdraw =
        ["OWNER", "ADMIN"].includes(callerMember.role) ||
        (callerMember.role === "MANAGER" && callerMember.canWithdrawApprovals)

    // Compute scoped user IDs once (managers only see their direct reports)
    const scopedUserIds: string[] | null =
        callerMember.role === "MANAGER"
            ? await prisma.workspaceMember.findMany({
                where: { managerId: callerMember.id, workspaceId: callerMember.workspaceId, disabledAt: null },
                select: { userId: true },
            }).then(reports => reports.map(r => r.userId))
            : (callerMember.role === "MEMBER" || callerMember.role === "CONTRACTOR")
                ? [session.user.id]
                : null // OWNER/ADMIN sees all

    const userIdWhere: Prisma.TimeEntryWhereInput["userId"] =
        scopedUserIds ? { in: scopedUserIds } : undefined

    const submittedWeeksUserIdWhere: Prisma.TimesheetWeekWhereInput["userId"] =
        scopedUserIds ? { in: scopedUserIds } : undefined

    // Approval status filter
    const approvalWhere: Prisma.TimeEntryWhereInput =
        (statusFilter === "PENDING" || statusFilter === "APPROVED" || statusFilter === "REJECTED")
            ? { approvalStatus: statusFilter }
            : {}

    const [entries, submittedWeeks] = await Promise.all([
        prisma.timeEntry.findMany({
            where: {
                timerStartedAt: null,
                date: { gte: weekStart, lte: weekEnd },
                project: { workspaceId: callerMember.workspaceId },
                userId: userIdWhere,
                ...approvalWhere,
            },
            orderBy: { date: "asc" },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
                project: {
                    select: {
                        id: true,
                        name: true,
                        client: { select: { id: true, name: true } },
                    },
                },
                task: { select: { name: true } },
            },
        }),
        canApprove
            ? prisma.timesheetWeek.findMany({
                where: {
                    workspaceId: callerMember.workspaceId,
                    status: "SUBMITTED",
                    weekStart: weekStart,
                    userId: submittedWeeksUserIdWhere,
                },
                include: {
                    user: { select: { id: true, name: true, email: true, image: true } },
                },
            }).then(async weeks => {
                if (weeks.length === 0) return [] as SubmittedWeekRow[]
                // Single groupBy replaces N per-user aggregate calls
                const aggByUser = await prisma.timeEntry.groupBy({
                    by: ["userId"],
                    where: {
                        userId: { in: weeks.map(w => w.userId) },
                        project: { workspaceId: callerMember.workspaceId },
                        date: { gte: weekStart, lte: weekEnd },
                        timerStartedAt: null,
                    },
                    _count: { id: true },
                    _sum: { durationSeconds: true },
                })
                const aggMap = new Map(aggByUser.map(a => [a.userId, a]))
                return weeks.map(w => {
                    const agg = aggMap.get(w.userId)
                    return {
                        id: w.id,
                        userId: w.userId,
                        memberName: w.user.name ?? w.user.email,
                        memberEmail: w.user.email,
                        memberImage: w.user.image,
                        weekStart: w.weekStart,
                        submittedAt: w.submittedAt?.toISOString() ?? w.createdAt.toISOString(),
                        entryCount: agg?._count.id ?? 0,
                        totalSeconds: agg?._sum.durationSeconds ?? 0,
                    }
                }) as SubmittedWeekRow[]
            })
            : Promise.resolve([] as SubmittedWeekRow[]),
    ])

    // Build aggregate rows
    const rowMap = new Map<string, ApprovalGroupRow>()

    for (const entry of entries) {
        let key: string
        let partial: Partial<ApprovalGroupRow>

        if (groupBy === "person") {
            key = entry.userId
            partial = {
                userId: entry.userId,
                memberName: entry.user.name ?? entry.user.email,
                memberEmail: entry.user.email,
                memberImage: entry.user.image,
            }
        } else if (groupBy === "project") {
            key = entry.project.id
            partial = {
                projectId: entry.project.id,
                projectName: entry.project.name,
                clientName: entry.project.client?.name ?? null,
                clientId: entry.project.client?.id ?? null,
            }
        } else {
            // client
            key = entry.project.client?.id ?? "__none__"
            partial = {
                clientId: entry.project.client?.id ?? null,
                clientName: entry.project.client?.name ?? null,
            }
        }

        if (!rowMap.has(key)) {
            rowMap.set(key, {
                key,
                ...partial,
                totalSeconds: 0,
                billableSeconds: 0,
                pendingCount: 0,
                approvedCount: 0,
                rejectedCount: 0,
                entries: [],
            } as ApprovalGroupRow)
        }

        const row = rowMap.get(key)!
        row.totalSeconds += entry.durationSeconds
        if (entry.isBillable) row.billableSeconds += entry.durationSeconds
        if (entry.approvalStatus === "PENDING") row.pendingCount++
        else if (entry.approvalStatus === "APPROVED") row.approvedCount++
        else if (entry.approvalStatus === "REJECTED") row.rejectedCount++

        row.entries.push({
            id: entry.id,
            projectName: entry.project.name,
            taskName: entry.task?.name ?? null,
            description: entry.description,
            date: entry.date,
            durationSeconds: entry.durationSeconds,
            isBillable: entry.isBillable,
            approvalStatus: entry.approvalStatus,
            isLocked: entry.isLocked,
        })
    }

    const rows = Array.from(rowMap.values()).sort((a, b) => {
        const aLabel = a.memberName ?? a.projectName ?? a.clientName ?? ""
        const bLabel = b.memberName ?? b.projectName ?? b.clientName ?? ""
        return aLabel.localeCompare(bLabel)
    })

    // Summary stats
    const totalSeconds = rows.reduce((s, r) => s + r.totalSeconds, 0)
    const billableSeconds = rows.reduce((s, r) => s + r.billableSeconds, 0)
    const totalPending = rows.reduce((s, r) => s + r.pendingCount, 0)
    const totalApproved = rows.reduce((s, r) => s + r.approvedCount, 0)

    function fmtH(s: number) {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        return `${h}:${String(m).padStart(2, "0")}`
    }

    const billablePct = totalSeconds > 0 ? Math.round((billableSeconds / totalSeconds) * 100) : 0

    return (
        <div className="flex-1 space-y-6 pt-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Timesheet Approvals</h2>
                    <p className="text-muted-foreground mt-1">
                        {canApprove
                            ? "Review and approve time entries submitted by your team."
                            : "View the approval status of your submitted time entries."}
                    </p>
                </div>
                {canApprove && (
                    <BulkApproveButton
                        weekStart={weekStart}
                        weekEnd={weekEnd}
                        pendingCount={totalPending}
                    />
                )}
            </div>

            {/* Controls */}
            <ApprovalControls
                weekStart={weekStart}
                weekEnd={weekEnd}
                status={statusFilter}
                groupBy={groupBy}
                weekStartsOn={weekStartsOn}
            />

            {/* Submitted weeks */}
            {canApprove && (
                <SubmittedWeeksTable weeks={submittedWeeks} canApprove={canApprove} />
            )}

            {/* Summary bar */}
            <div className="flex items-center gap-6 rounded-lg border border-sidebar-border bg-sidebar/30 px-5 py-3 text-sm">
                <div>
                    <span className="text-muted-foreground">Total hours</span>
                    <span className="ml-2 font-semibold tabular-nums">{fmtH(totalSeconds)}</span>
                </div>
                <div>
                    <span className="text-muted-foreground">Billable</span>
                    <span className="ml-2 font-semibold tabular-nums text-blue-500">
                        {fmtH(billableSeconds)} ({billablePct}%)
                    </span>
                </div>
                {canApprove && (
                    <>
                        <div>
                            <span className="text-muted-foreground">Pending</span>
                            <span className="ml-2 font-semibold tabular-nums">{totalPending}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Approved</span>
                            <span className="ml-2 font-semibold tabular-nums text-emerald-600">{totalApproved}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Table */}
            <ApprovalTable
                rows={rows}
                groupBy={groupBy}
                weekStart={weekStart}
                weekEnd={weekEnd}
                canApprove={canApprove}
                canWithdraw={canWithdraw}
            />
        </div>
    )
}

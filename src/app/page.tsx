import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/app/actions"
import { redirect } from "next/navigation"
import { format, subDays, isWeekend, startOfISOWeek, endOfISOWeek } from "date-fns"
import Link from "next/link"
import { Info } from "lucide-react"
import { ActionItems } from "@/components/dashboard/ActionItems"
import { TimerWidget } from "@/components/dashboard/TimerWidget"
import { LiveSessionBanner } from "@/components/dashboard/LiveSessionBanner"
import { StatCard } from "@/components/dashboard/StatCard"
import { WorkflowShortcuts } from "@/components/dashboard/WorkflowShortcuts"

/** Return the last N business day date strings (yyyy-MM-dd), not including today */
function lastBusinessDays(n: number): string[] {
  const days: string[] = []
  let cursor = new Date()
  while (days.length < n) {
    cursor = subDays(cursor, 1)
    if (!isWeekend(cursor)) days.push(format(cursor, "yyyy-MM-dd"))
  }
  return days
}

function formatHours(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  return `${h}h ${String(m).padStart(2, "0")}m`
}

const timesheetStatusLabel: Record<string, string> = {
  OPEN: "Open",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
}
const timesheetStatusVariant: Record<string, "amber" | "blue" | "green" | "red"> = {
  OPEN: "amber",
  SUBMITTED: "blue",
  APPROVED: "green",
  REJECTED: "red",
}

export default async function Dashboard() {
  const user = await getSessionUser().catch(() => null)
  if (!user) redirect("/login")

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { id: true, workspaceId: true, role: true, workspace: { select: { hiddenNavItems: true } } },
  })

  if (!member) {
    redirect("/login")
  }

  const { workspaceId, role } = member
  const hiddenNavItems = member.workspace?.hiddenNavItems ?? []
  const isManager = ["OWNER", "ADMIN", "MANAGER"].includes(role)
  const recentBusinessDays = lastBusinessDays(2)

  const weekStart = format(startOfISOWeek(new Date()), "yyyy-MM-dd")
  const weekEnd = format(endOfISOWeek(new Date()), "yyyy-MM-dd")

  const [
    pendingApprovalsCount,
    recentEntryCount,
    activeTimerEntry,
    liveSession,
    thisWeekAgg,
  ] = await Promise.all([
    isManager
      ? prisma.timesheetWeek.count({
          where: {
            workspaceId,
            status: "SUBMITTED",
            ...(role === "MANAGER"
              ? { user: { memberships: { some: { managerId: member.id, workspaceId } } } }
              : {}),
          },
        })
      : Promise.resolve(0),

    !isManager
      ? prisma.timeEntry.count({
          where: {
            userId: user.id,
            project: { workspaceId },
            date: { in: recentBusinessDays },
            timerStartedAt: null,
          },
        })
      : Promise.resolve(1),

    prisma.timeEntry.findFirst({
      where: { userId: user.id, project: { workspaceId }, timerStartedAt: { not: null } },
      include: {
        project: { select: { name: true } },
        task: { select: { name: true } },
      },
    }),

    prisma.pokerSession.findFirst({
      where: { workspaceId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),

    prisma.timeEntry.aggregate({
      where: {
        userId: user.id,
        project: { workspaceId },
        date: { gte: weekStart, lte: weekEnd },
        timerStartedAt: null,
      },
      _sum: { durationSeconds: true },
    }),
  ])

  const thisWeekSeconds = thisWeekAgg._sum.durationSeconds ?? 0

  // Admin-only data
  const [hasLinearConnected, activeProjectsCount, podsData, unassignedProjectsCount] = await Promise.all([
    isManager
      ? prisma.linearUserToken.findFirst({ where: { userId: user.id }, select: { id: true } }).then(Boolean)
      : Promise.resolve(true),

    isManager
      ? prisma.teifiProject.count({ where: { workspaceId, status: "ACTIVE" } })
      : Promise.resolve(0),

    isManager
      ? prisma.pod.findMany({
          where: { workspaceId },
          select: { id: true, slots: { select: { memberId: true } } },
        })
      : Promise.resolve([]),

    isManager
      ? prisma.teifiProject.count({ where: { workspaceId, podId: null, status: { not: "ARCHIVED" } } })
      : Promise.resolve(0),
  ])

  const totalPods = podsData.length
  const openSlots = (podsData as { slots: { memberId: string | null }[] }[])
    .flatMap(p => p.slots)
    .filter(s => !s.memberId).length

  // Member-only data
  const timesheetWeek = !isManager
    ? await prisma.timesheetWeek.findFirst({
        where: { userId: user.id, workspaceId, weekStart },
        select: { status: true },
      })
    : null

  const overdueTimesheet = !isManager && recentEntryCount === 0

  const activeTimer = activeTimerEntry
    ? {
        id: activeTimerEntry.id,
        projectName: activeTimerEntry.project?.name ?? "Unknown project",
        taskName: activeTimerEntry.task?.name ?? null,
        description: activeTimerEntry.description ?? null,
        timerStartedAt: activeTimerEntry.timerStartedAt!.toISOString(),
      }
    : null

  const timesheetStatus = timesheetWeek?.status ?? "OPEN"

  return (
    <div className="flex-1 space-y-6 pt-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </p>
      </div>

      {/* Linear setup nudge — admin only */}
      {isManager && !hasLinearConnected && (
        <div className="flex gap-3 rounded-lg border-l-2 border-l-blue-400 border border-border/50 bg-muted/30 px-4 py-3">
          <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80">
            <span className="font-medium text-foreground">Connect Linear to enable the issue picker in the timer.</span>
            {" "}Team members can link time entries to Linear issues once you connect and map your projects.{" "}
            <Link href="/settings/integrations" className="font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors">
              Set up in Integrations →
            </Link>
          </p>
        </div>
      )}

      {/* Live estimation session banner — visible to all */}
      <LiveSessionBanner liveSession={liveSession} />

      {/* Action alerts — role-aware, hidden when empty */}
      <ActionItems
        role={role}
        pendingApprovalsCount={pendingApprovalsCount}
        overdueTimesheet={overdueTimesheet}
        uatIssuesNeedingResponseCount={0}
        hiddenNavItems={hiddenNavItems}
      />

      {isManager ? (
        <>
          {/* POD stat cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <StatCard label="Pods" value={String(totalPods)} href="/planning" />
            <StatCard
              label="Open Slots"
              value={String(openSlots)}
              href="/planning"
              badge={openSlots > 0 ? String(openSlots) : undefined}
              badgeVariant="amber"
            />
            <StatCard
              label="Unassigned Projects"
              value={String(unassignedProjectsCount)}
              href="/planning"
              badge={unassignedProjectsCount > 0 ? String(unassignedProjectsCount) : undefined}
              badgeVariant="amber"
            />
            {!hiddenNavItems.includes("approvals") && (
              <StatCard
                label="Pending Approvals"
                value={String(pendingApprovalsCount)}
                href="/time/approvals"
                badge={pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined}
                badgeVariant="amber"
              />
            )}
          </div>

          {/* Timer — secondary */}
          {!hiddenNavItems.includes("time") && <TimerWidget activeTimer={activeTimer} />}
        </>
      ) : (
        <>
          {/* Member: full-width timer */}
          {!hiddenNavItems.includes("time") && <TimerWidget activeTimer={activeTimer} />}

          {/* Member stat cards */}
          {!hiddenNavItems.includes("time") && (
            <div className="grid gap-4 grid-cols-2">
              <StatCard label="This Week" value={formatHours(thisWeekSeconds)} href="/time" />
              <StatCard
                label="Timesheet"
                value={timesheetStatusLabel[timesheetStatus] ?? "Open"}
                href="/time"
                badge={timesheetStatus !== "OPEN" ? timesheetStatusLabel[timesheetStatus] : undefined}
                badgeVariant={timesheetStatusVariant[timesheetStatus] ?? "amber"}
              />
            </div>
          )}
        </>
      )}

      {/* Module navigation */}
      <WorkflowShortcuts hiddenNavItems={hiddenNavItems} />
    </div>
  )
}

import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { getSessionUser } from "@/app/actions"
import { PlanningView } from "./PlanningView"
import type { PodData, UnassignedProject, WorkspaceMemberOption } from "./types"

export default async function PlanningPage() {
  const user = await getSessionUser().catch(() => null)
  if (!user) redirect("/login")

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { id: true, workspaceId: true, role: true },
  })
  if (!member) redirect("/")
  if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) redirect("/schedule")

  const workspaceId = member.workspaceId

  const [podsRaw, unassignedRaw, membersRaw, workspace] = await Promise.all([
    prisma.pod.findMany({
      where: { workspaceId },
      include: {
        slots: {
          include: {
            member: { select: { id: true, weeklyCapacityHours: true, user: { select: { name: true, image: true } } } },
          },
          orderBy: { roleName: "asc" },
        },
        projects: {
          where: { status: { not: "ARCHIVED" } },
          select: {
            id: true, name: true, color: true, status: true,
            startsOn: true, endsOn: true, budgetHours: true,
            client: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.teifiProject.findMany({
      where: { workspaceId, podId: null, status: { not: "ARCHIVED" } },
      select: {
        id: true, name: true, color: true, status: true,
        startsOn: true, endsOn: true, budgetHours: true,
        client: { select: { name: true } },
      },
      orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: {
        id: true, roles: true,
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { defaultCapacityHours: true },
    }),
  ])

  function toDateStr(d: Date | null | undefined): string | null {
    return d ? format(d, "yyyy-MM-dd") : null
  }

  const pods: PodData[] = podsRaw.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type as "DELIVERY" | "SUPPORT" | "SHARED_SERVICES",
    slots: p.slots.map(s => ({
      id: s.id,
      roleName: s.roleName,
      memberId: s.memberId,
      memberName: s.member?.user?.name ?? null,
      memberImage: s.member?.user?.image ?? null,
      allocationPercent: s.allocationPercent,
      memberWeeklyCapacityHours: s.member?.weeklyCapacityHours ?? workspace?.defaultCapacityHours ?? 40,
    })),
    projects: p.projects.map(pr => ({
      id: pr.id,
      name: pr.name,
      color: pr.color,
      clientName: pr.client?.name ?? null,
      status: pr.status,
      startsOn: toDateStr(pr.startsOn),
      endsOn: toDateStr(pr.endsOn),
      budgetHours: pr.budgetHours,
    })),
  }))

  const unassigned: UnassignedProject[] = unassignedRaw.map(p => ({
    id: p.id,
    name: p.name,
    color: p.color,
    clientName: p.client?.name ?? null,
    status: p.status,
    startsOn: toDateStr(p.startsOn),
    endsOn: toDateStr(p.endsOn),
    budgetHours: p.budgetHours,
  }))

  const workspaceMembers: WorkspaceMemberOption[] = membersRaw.map(m => ({
    id: m.id,
    name: m.user?.name ?? null,
    email: m.user?.email ?? "",
    image: m.user?.image ?? null,
    roles: m.roles,
  }))

  return (
    <div className="flex flex-col h-full -mx-4 md:-mx-8">
      <PlanningView
        pods={pods}
        unassigned={unassigned}
        workspaceMembers={workspaceMembers}
        memberRole={member.role}
      />
    </div>
  )
}

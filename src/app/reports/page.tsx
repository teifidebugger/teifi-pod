import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ReportView } from "./ReportView"
import { format, subDays } from "date-fns"

export default async function ReportsPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true, canSeeRates: true },
    })
    if (!member) redirect("/")

    const canViewAll = ["OWNER", "ADMIN"].includes(member.role) || member.role === "MANAGER"
    const canSeeRates =
        ["OWNER", "ADMIN"].includes(member.role) ||
        (member.role === "MANAGER" && member.canSeeRates)

    const [projects, clients, allMembers] = await Promise.all([
        prisma.teifiProject.findMany({
            where: { workspaceId: member.workspaceId },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
        canViewAll
            ? prisma.client.findMany({
                  where: { workspaceId: member.workspaceId },
                  select: { id: true, name: true },
                  orderBy: { name: "asc" },
              })
            : Promise.resolve([]),
        canViewAll
            ? prisma.workspaceMember.findMany({
                  where: { workspaceId: member.workspaceId },
                  select: { userId: true, user: { select: { id: true, name: true, email: true } } },
                  orderBy: { joinedAt: "asc" },
              })
            : Promise.resolve([]),
    ])

    const defaultFrom = format(subDays(new Date(), 29), "yyyy-MM-dd")
    const defaultTo = format(new Date(), "yyyy-MM-dd")

    return (
        <div className="flex-1 space-y-6 pt-6">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">Reports</h2>
                <p className="text-muted-foreground mt-1">Analyze time by project, client, or team member.</p>
            </div>
            <ReportView
                projects={projects}
                clients={clients}
                members={allMembers.map(m => ({ id: m.userId, name: m.user.name ?? m.user.email }))}
                defaultFrom={defaultFrom}
                defaultTo={defaultTo}
                canSeeRates={canSeeRates}
            />
        </div>
    )
}

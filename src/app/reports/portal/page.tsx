import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/app/actions"
import { redirect } from "next/navigation"
import { getWorkspaceAdminMetrics, getWorkspaceEngagementStats, type AdminMetrics, type ClientEngagementStats } from "@/app/actions/portal-events"
import { getPortalIssues } from "@/app/actions/portal"
import { PortalReportView } from "./PortalReportView"

export default async function PortalReportPage() {
    const user = await getSessionUser().catch(() => null)
    if (!user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")
    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) redirect("/")

    const clients = await prisma.client.findMany({
        where: { workspaceId: member.workspaceId, archivedAt: null },
        include: {
            linearTeams: { select: { id: true, name: true, key: true } },
            portalProfiles: { where: { isActive: true }, select: { id: true } },
        },
        orderBy: { name: "asc" },
    })

    // Only fetch metrics for clients that have portal users + linked teams
    const activeTeamIds = clients
        .filter(c => c.portalProfiles.length > 0 && c.linearTeams.length > 0)
        .flatMap(c => c.linearTeams.map(t => t.id))

    let adminMetricsByTeam = new Map<string, AdminMetrics>()
    if (activeTeamIds.length > 0) {
        const issueResults = await Promise.allSettled(
            activeTeamIds.map(async tid => ({ tid, issues: await getPortalIssues(tid) }))
        )
        const issuesByTeam = new Map<string, Awaited<ReturnType<typeof getPortalIssues>>>()
        for (const r of issueResults) {
            if (r.status === "fulfilled") issuesByTeam.set(r.value.tid, r.value.issues)
        }
        adminMetricsByTeam = await getWorkspaceAdminMetrics(member.workspaceId, issuesByTeam)
    }

    const engagementByClient = await getWorkspaceEngagementStats(member.workspaceId)

    // Map client → metrics (first linked team wins)
    const clientData = clients
        .filter(c => c.linearTeams.length > 0)
        .map(c => {
            const team = c.linearTeams[0]
            const metrics = adminMetricsByTeam.get(team.id) ?? null
            const engagement: ClientEngagementStats = engagementByClient.get(c.id) ?? {
                loginCount30d: 0,
                uniqueActiveUsers30d: 0,
                issueViewCount30d: 0,
            }
            return {
                id: c.id,
                name: c.name,
                teamName: team.name,
                teamKey: team.key,
                portalUserCount: c.portalProfiles.length,
                metrics,
                engagement,
            }
        })

    return (
        <div className="flex-1 space-y-6 pt-6">
            <div className="px-4 md:px-8">
                <h2 className="text-xl font-semibold tracking-tight">Portal Analytics</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    UAT cycle time, client responsiveness, and throughput across all client portals.
                </p>
            </div>
            <PortalReportView clients={clientData} />
        </div>
    )
}

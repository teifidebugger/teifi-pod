import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, AlertTriangle } from "lucide-react"
import { getSUPTeams, getSupportTeamsFromLinearTeamIds, validateLinearServiceAccount } from "@/lib/linear-onboarding"
import { OnboardingWizard, type MemberOption, type SUPTeam } from "./OnboardingWizard"

export default async function ClientOnboardPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { id: true, workspaceId: true, role: true },
    })
    if (!member) redirect("/login")

    if (!["OWNER", "ADMIN"].includes(member.role)) redirect("/clients")

    const workspace = await prisma.workspace.findUnique({
        where: { id: member.workspaceId },
        select: { onboardingEnabled: true, supportProjectIds: true },
    })

    if (!workspace?.onboardingEnabled) redirect("/clients")

    const [workspaceMembers, supTeams, serviceAccountValid] = await Promise.all([
        prisma.workspaceMember.findMany({
            where: { workspaceId: member.workspaceId },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        linearTokens: { select: { linearUserId: true }, take: 1 },
                    },
                },
            },
            orderBy: { user: { name: "asc" } },
        }),
        (async (): Promise<SUPTeam[]> => {
            if (workspace.supportProjectIds.length > 0) {
                const projects = await prisma.teifiProject.findMany({
                    where: { id: { in: workspace.supportProjectIds }, workspaceId: member.workspaceId },
                    select: { linearTeamId: true },
                })
                const teamIds = [...new Set(projects.map((p) => p.linearTeamId).filter(Boolean) as string[])]
                return getSupportTeamsFromLinearTeamIds(teamIds).catch(() => [])
            }
            return getSUPTeams().catch(() => [])
        })(),
        validateLinearServiceAccount().catch(() => false),
    ])

    const members: MemberOption[] = workspaceMembers.map((m) => ({
        id: m.id,
        name: m.user.name ?? m.user.email,
        email: m.user.email,
        linearId: m.user.linearTokens[0]?.linearUserId ?? null,
    }))

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
            <div className="mb-6">
                <Link
                    href="/clients"
                    className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Back to clients
                </Link>
                <h1 className="text-xl font-semibold tracking-tight">Onboard new client</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Run the onboarding wizard to create a client, Linear project, and portal in one
                    step.
                </p>
            </div>

            {!serviceAccountValid && (
                <div className="mb-6 flex items-start gap-2.5 border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 px-4 py-2.5">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <p className="text-sm text-foreground/80">
                        <span className="font-medium text-foreground">
                            Linear service account not configured.
                        </span>{" "}
                        Set{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                            LINEAR_SERVICE_ACCOUNT_API_KEY
                        </code>{" "}
                        in your environment to enable Linear team and project creation.
                    </p>
                </div>
            )}

            <OnboardingWizard members={members} supTeams={supTeams} />
        </div>
    )
}

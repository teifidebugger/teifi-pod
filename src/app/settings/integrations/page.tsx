import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Link2, Link2Off, RefreshCw, AlertTriangle, Info } from 'lucide-react'
import { BulkLinearMapping } from './BulkLinearMapping'
import { HarvestImport } from './HarvestImport'
import { ForecastImport } from './ForecastImport'
import { decryptToken } from '@/lib/linear'

export default async function IntegrationsPage({
    searchParams,
}: {
    searchParams: Promise<{ success?: string; error?: string }>
}) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) redirect('/login')

    const params = await searchParams

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true },
    })

    const [linearToken, harvestToken, forecastToken] = await Promise.all([
        prisma.linearUserToken.findFirst({ where: { userId: session.user.id } }),
        member
            ? prisma.harvestToken.findFirst({ where: { userId: session.user.id, workspaceId: member.workspaceId } })
            : Promise.resolve(null),
        member
            ? prisma.forecastToken.findFirst({ where: { userId: session.user.id, workspaceId: member.workspaceId } })
            : Promise.resolve(null),
    ])

    // Validate token is still active (not just present in DB)
    let isConnected = false
    let tokenExpired = false
    const linearEmail = linearToken?.email
    if (linearToken) {
        try {
            const res = await fetch('https://api.linear.app/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${decryptToken(linearToken.accessToken)}`,
                },
                body: JSON.stringify({ query: '{ viewer { id } }' }),
            })
            const json = await res.json()
            if (json.errors?.some((e: { extensions?: { code?: string } }) => e.extensions?.code === 'AUTHENTICATION_ERROR')) {
                tokenExpired = true
                // Auto-clean revoked token from DB
                await prisma.linearUserToken.deleteMany({ where: { userId: session.user.id } })
            } else {
                isConnected = true
            }
        } catch {
            isConnected = true // network error — assume still connected
        }
    }

    return (
        <div className="flex-1 space-y-6 pt-6 max-w-3xl">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">Integrations</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Connect your tools to unlock time tracking integrations.
                </p>
            </div>

            {/* Linear capabilities nudge — shown when not yet connected */}
            {!isConnected && !tokenExpired && (
                <div className="flex gap-3 rounded-lg border-l-2 border-l-blue-400 border border-border/50 bg-muted/30 px-4 py-2.5">
                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/80">
                        <span className="font-medium">Connect Linear to unlock the issue picker in the timer.</span>
                        {" "}Link issues to time entries so your team can track work against the right Linear tickets — and admins can map projects to Linear teams in bulk.
                    </p>
                </div>
            )}

            {/* Success / Error banners */}
            {params.success === 'linear_connected' && (
                <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-lg px-4 py-3 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Linear account connected successfully!
                </div>
            )}
            {params.error && (
                <div className="flex items-center gap-2 border-l-2 border-l-red-400 border border-border/50 bg-muted/30 rounded-lg px-4 py-3 text-sm font-medium text-foreground/80">
                    Connection failed: {params.error.replace(/_/g, ' ')}
                </div>
            )}

            {/* Linear Card */}
            <div className="rounded-lg border border-border/50 bg-card p-4">
                <div className="flex flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {/* Linear logo (SVG inline) */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#5E6AD2]">
                                <path d="M3.03509 12.9431C3.24245 14.9227 4.10472 16.8468 5.62188 18.364C7.13904 19.8811 9.0631 20.7434 11.0428 20.9508L3.03509 12.9431Z" />
                                <path d="M3 11.4938L12.4921 20.9858C13.2976 20.9407 14.0981 20.7879 14.8704 20.5273L3.4585 9.11548C3.19793 9.88771 3.0451 10.6883 3 11.4938Z" />
                                <path d="M3.86722 8.10999L15.8758 20.1186C16.4988 19.8201 17.0946 19.4458 17.6493 18.9956L4.99021 6.33659C4.54006 6.89125 4.16573 7.487 3.86722 8.10999Z" />
                                <path d="M5.66301 5.59517C9.18091 2.12137 14.8488 2.135 18.3498 5.63604C21.8508 9.13708 21.8645 14.8049 18.3907 18.3228L5.66301 5.59517Z" />
                            </svg>
                            <h3 className="font-semibold tracking-tight">Linear</h3>
                            {isConnected && (
                                <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                                    Connected
                                </Badge>
                            )}
                            {tokenExpired && (
                                <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Token revoked
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {isConnected
                                ? `Connected as ${linearEmail ?? 'Unknown'} — issues and teams are synced.`
                                : tokenExpired
                                ? `Your Linear token for ${linearEmail ?? 'Unknown'} was revoked. Reconnect to restore access.`
                                : 'Connect your Linear account to link issues and teams to your time entries.'}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                        {isConnected ? (
                            <>
                                <form action="/api/linear/auth" method="GET">
                                    <Button type="submit" variant="outline" size="sm" className="gap-2">
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Re-sync Teams
                                    </Button>
                                </form>
                                <form action="/api/linear/disconnect" method="POST">
                                    <Button type="submit" variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
                                        <Link2Off className="w-3.5 h-3.5" />
                                        Disconnect
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <a href="/api/linear/auth">
                                <Button size="sm" className="gap-2">
                                    <Link2 className="w-4 h-4" />
                                    Connect Linear
                                </Button>
                            </a>
                        )}
                    </div>
                </div>

                {isConnected && (
                    <div className="pt-4">
                        <LinearSyncStats userId={session.user.id} />
                    </div>
                )}
            </div>

            {/* Bulk Linear Team Mapping (only when connected) */}
            {isConnected && <BulkLinearMappingCard userId={session.user.id} />}

            {/* Harvest Card */}
            <div className="rounded-lg border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                        <circle cx="12" cy="12" r="12" fill="#FA5C28" />
                        <path d="M7 12.5C7 9.46 9.46 7 12.5 7S18 9.46 18 12.5 15.54 18 12.5 18 7 15.54 7 12.5Z" fill="white" />
                        <path d="M12.5 9v3.5l2.5 1.5" stroke="#FA5C28" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <h3 className="font-semibold tracking-tight">Harvest</h3>
                    {harvestToken && (
                        <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                            Connected
                        </Badge>
                    )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                    One-time import of clients, projects, users, and time entries from Harvest into teifi-pod.
                </p>
                <HarvestImport
                    connected={!!harvestToken}
                    accountName={harvestToken?.accountName ?? null}
                />
            </div>

            {/* Forecast Card — import after Harvest so cross-links resolve correctly */}
            <div className="rounded-lg border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                        <circle cx="12" cy="12" r="12" fill="#E8563A" />
                        <path d="M6 16l3-4 3 2 3-5 3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h3 className="font-semibold tracking-tight">Forecast</h3>
                    {forecastToken && (
                        <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                            Connected
                        </Badge>
                    )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                    One-time import of clients, projects, people, placeholders, and assignments from Forecast. Run Harvest import first — Forecast records will be cross-linked automatically.
                </p>
                <ForecastImport
                    connected={!!forecastToken}
                    accountName={forecastToken?.accountName ?? null}
                />
            </div>
        </div>
    )
}

async function BulkLinearMappingCard({ userId }: { userId: string }) {
    const member = await prisma.workspaceMember.findFirst({
        where: { userId },
        select: { workspaceId: true, role: true },
    })
    if (!member || !["OWNER", "ADMIN", "MANAGER"].includes(member.role)) return null

    const [projectsRaw, linearTeams] = await Promise.all([
        prisma.teifiProject.findMany({
            where: { workspaceId: member.workspaceId, status: { not: "ARCHIVED" } },
            select: {
                id: true, name: true,
                client: { select: { name: true } },
                linearTeam: { select: { id: true, name: true, key: true } },
            },
            orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
        }),
        prisma.linearTeam.findMany({
            where: { workspaceId: member.workspaceId },
            select: { id: true, name: true, key: true },
            orderBy: { name: "asc" },
        }),
    ])

    const projects = projectsRaw.map(p => ({
        id: p.id,
        name: p.name,
        clientName: p.client?.name ?? null,
        linearTeamId: p.linearTeam?.id ?? null,
        linearTeamName: p.linearTeam?.name ?? null,
        linearTeamKey: p.linearTeam?.key ?? null,
    }))

    return (
        <div className="rounded-lg border border-border/50 bg-card p-4">
            <div className="mb-4">
                <h3 className="text-base font-semibold tracking-tight">Bulk Linear Team Mapping</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Select one or more projects and assign them to a Linear team in one click.
                    Useful for mapping all support projects to the [SUP] team at once.
                </p>
            </div>
            <BulkLinearMapping projects={projects} linearTeams={linearTeams} />
        </div>
    )
}

async function LinearSyncStats({ userId }: { userId: string }) {
    const member = await prisma.workspaceMember.findFirst({ where: { userId } })
    if (!member) return null

    const [teamCount, cycleCount] = await Promise.all([
        prisma.linearTeam.count({ where: { workspaceId: member.workspaceId } }),
        prisma.linearCycle.count({
            where: { team: { workspaceId: member.workspaceId } }
        }),
    ])

    return (
        <div className="flex gap-6 text-sm text-muted-foreground border-t border-sidebar-border pt-4">
            <div className="flex flex-col gap-0.5">
                <span className="text-lg font-semibold text-foreground">{teamCount}</span>
                <span>Teams synced</span>
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-lg font-semibold text-foreground">{cycleCount}</span>
                <span>Cycles synced</span>
            </div>
        </div>
    )
}

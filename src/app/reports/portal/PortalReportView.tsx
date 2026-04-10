"use client"

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ReferenceLine, ResponsiveContainer,
} from "recharts"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Users, AlertCircle, LogIn, Eye, FlaskConical, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import type { AdminMetrics, ClientEngagementStats } from "@/app/actions/portal-events"

type ClientData = {
    id: string
    name: string
    teamName: string
    teamKey: string
    portalUserCount: number
    metrics: AdminMetrics | null
    engagement: ClientEngagementStats
}

function AdminKPICard({
    label, value, unit, sub, sampleSize,
}: {
    label: string
    value: number | null
    unit: string
    sub: string
    sampleSize?: number
}) {
    const insufficient = value === null || (sampleSize !== undefined && sampleSize < 3)
    const displayValue = value === null ? "—" : unit === "%" ? `${value}%` : `${value.toFixed(1)} ${unit}`

    return (
        <TooltipProvider>
            <UITooltip>
                <TooltipTrigger asChild>
                    <div className="rounded-lg border border-border/50 bg-card p-3 cursor-default">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                        <p className={`text-lg font-semibold tracking-tight ${insufficient ? "text-muted-foreground/50" : "text-foreground"}`}>
                            {displayValue}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                    </div>
                </TooltipTrigger>
                {insufficient && (
                    <TooltipContent side="bottom" className="text-xs">
                        {sampleSize !== undefined && sampleSize < 3
                            ? `Only ${sampleSize} sample${sampleSize !== 1 ? "s" : ""} — need ≥3 for reliable metric`
                            : "No data yet"}
                    </TooltipContent>
                )}
            </UITooltip>
        </TooltipProvider>
    )
}

function ClientCard({ client }: { client: ClientData }) {
    const m = client.metrics
    const e = client.engagement

    return (
        <div className="rounded-lg border border-border/50 bg-card space-y-4 p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">{client.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono font-normal border-border/60">
                            {client.teamKey}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{client.teamName}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LogIn className="h-3 w-3" />
                        <span className="tabular-nums">{e.loginCount30d}</span>
                        <span className="hidden sm:inline">logins</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span className="tabular-nums">{e.issueViewCount30d}</span>
                        <span className="hidden sm:inline">views</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{client.portalUserCount}</span>
                        <span className="hidden sm:inline">user{client.portalUserCount !== 1 ? "s" : ""}</span>
                    </div>
                </div>
            </div>
            {/* Engagement row (last 30 days) */}
            {(e.loginCount30d > 0 || e.issueViewCount30d > 0) && (
                <div className="flex items-center gap-4 px-3 py-2 rounded-md bg-muted/30 border border-border/40">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">30d</p>
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground tabular-nums">{e.loginCount30d}</span> login{e.loginCount30d !== 1 ? "s" : ""}
                            {e.uniqueActiveUsers30d > 0 && (
                                <span className="ml-1 text-muted-foreground/60">({e.uniqueActiveUsers30d} unique)</span>
                            )}
                        </span>
                        {e.issueViewCount30d > 0 && (
                            <span className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground tabular-nums">{e.issueViewCount30d}</span> issue view{e.issueViewCount30d !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* No data state */}
            {!m || (m.cycleTimeSampleSize === 0 && m.velocitySampleSize === 0) ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60 py-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    No portal activity recorded yet
                </div>
            ) : (
                <TooltipProvider>
                    {/* KPI row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <AdminKPICard label="Cycle Time" value={m.avgCycleTimeDays} unit="days" sub="created → approved" sampleSize={m.cycleTimeSampleSize} />
                        <AdminKPICard label="Response Time" value={m.avgVelocityDays} unit="days" sub="review → response" sampleSize={m.velocitySampleSize} />
                        <AdminKPICard label="First-pass" value={m.firstPassRate} unit="%" sub="approved 1st try" />
                        <AdminKPICard label="Rework" value={m.reworkIndex} unit="%" sub="blocked 2+ times" />
                    </div>

                    {/* Client responsiveness */}
                    {m.clientResponsivenessRate !== null && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Client SLA (3-day):</span>
                            <span className={`text-xs font-semibold ${m.clientResponsivenessRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : m.clientResponsivenessRate >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                                {m.clientResponsivenessRate}%
                            </span>
                            <span className="text-xs text-muted-foreground">responded within 3 days</span>
                        </div>
                    )}

                    {/* Throughput chart */}
                    {m.throughput.length > 0 && (
                        <div>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Throughput — Last 8 Weeks</p>
                            <ResponsiveContainer width="100%" height={120}>
                                <BarChart data={m.throughput} barCategoryGap="30%">
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                    <XAxis dataKey="week" tick={{ fontSize: 9 }} tickFormatter={w => w.replace(/^\d{4}-/, "")} className="fill-muted-foreground" />
                                    <YAxis tick={{ fontSize: 9 }} className="fill-muted-foreground" />
                                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} labelFormatter={w => String(w)} />
                                    <ReferenceLine y={0} className="stroke-border" />
                                    <Bar dataKey="created" name="Created" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Block rate by label */}
                    {m.blockRateByLabel.length > 0 && (
                        <div>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Block Rate by Label</p>
                            <div className="space-y-2">
                                {m.blockRateByLabel.slice(0, 5).map((row, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 w-28 shrink-0 min-w-0">
                                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                                            <span className="text-xs text-muted-foreground truncate">{row.name}</span>
                                        </div>
                                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${row.blockRate}%`, backgroundColor: row.color }} />
                                        </div>
                                        <span className="text-xs tabular-nums text-muted-foreground w-8 text-right shrink-0">{row.blockRate}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </TooltipProvider>
            )}
        </div>
    )
}

const SAMPLE_THROUGHPUT = [
    { week: "2025-W10", created: 4, resolved: 2 },
    { week: "2025-W11", created: 6, resolved: 5 },
    { week: "2025-W12", created: 3, resolved: 4 },
    { week: "2025-W13", created: 7, resolved: 6 },
    { week: "2025-W14", created: 5, resolved: 5 },
    { week: "2025-W15", created: 8, resolved: 7 },
    { week: "2025-W16", created: 4, resolved: 6 },
    { week: "2025-W17", created: 6, resolved: 8 },
]

const SAMPLE_BLOCK_RATE = [
    { name: "Bug", color: "#ef4444", blockRate: 42 },
    { name: "Feature", color: "#3b82f6", blockRate: 18 },
    { name: "Design", color: "#a855f7", blockRate: 27 },
    { name: "Content", color: "#f59e0b", blockRate: 9 },
]

const METRIC_DESCRIPTIONS: { label: string; value: string; unit: string; description: string; color: string }[] = [
    {
        label: "Cycle Time",
        value: "4.2",
        unit: "days",
        description: "Average time from when an issue is created in the portal to when the client marks it Approved. Lower = faster UAT turnaround.",
        color: "text-blue-600 dark:text-blue-400",
    },
    {
        label: "Response Time",
        value: "1.8",
        unit: "days",
        description: "Average time from when Teifi moves an issue to 'Client Review' to when the client responds (Approved or Needs Input). Measures client responsiveness.",
        color: "text-violet-600 dark:text-violet-400",
    },
    {
        label: "First-pass Rate",
        value: "71",
        unit: "%",
        description: "Percentage of issues approved by the client on the very first review — without being sent back as 'Needs Input'. Higher = fewer revision cycles.",
        color: "text-emerald-600 dark:text-emerald-400",
    },
    {
        label: "Rework Index",
        value: "14",
        unit: "%",
        description: "Percentage of issues that were blocked or returned to Needs Input two or more times. Flags recurring miscommunication or unclear acceptance criteria.",
        color: "text-amber-600 dark:text-amber-400",
    },
    {
        label: "Client SLA (3-day)",
        value: "83",
        unit: "%",
        description: "Percentage of client reviews completed within 3 business days of Teifi submitting an issue for review. Tracks how quickly the client acts on pending items.",
        color: "text-teal-600 dark:text-teal-400",
    },
]

function SamplePreviewCard() {
    const [open, setOpen] = useState(false)

    return (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/10">
            <button
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                onClick={() => setOpen(v => !v)}
            >
                <div className="flex items-center gap-2.5">
                    <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-foreground">Metric Reference — Sample Preview</p>
                        <p className="text-xs text-muted-foreground mt-0.5">What each metric means and how it looks with real data</p>
                    </div>
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>

            {open && (
                <div className="px-5 pb-5 space-y-6 border-t border-border/40 pt-4">
                    {/* KPI descriptions */}
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">KPI Cards</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {METRIC_DESCRIPTIONS.map(m => (
                                <div key={m.label} className="rounded-md border border-border/40 bg-card p-3.5 space-y-1.5">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-lg font-semibold tabular-nums ${m.color}`}>{m.value} <span className="text-sm font-normal">{m.unit}</span></span>
                                        <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Throughput chart sample */}
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Throughput — Last 8 Weeks</p>
                        <p className="text-xs text-muted-foreground mb-3">Weekly count of issues created vs resolved in the portal. A healthy team keeps resolved ≥ created to avoid backlog growth.</p>
                        <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={SAMPLE_THROUGHPUT} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                <XAxis dataKey="week" tick={{ fontSize: 9 }} tickFormatter={w => w.replace(/^\d{4}-/, "")} className="fill-muted-foreground" />
                                <YAxis tick={{ fontSize: 9 }} className="fill-muted-foreground" />
                                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} labelFormatter={w => String(w)} />
                                <ReferenceLine y={0} className="stroke-border" />
                                <Bar dataKey="created" name="Created" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-slate-400 shrink-0" /><span className="text-[10px] text-muted-foreground">Created</span></div>
                            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500 shrink-0" /><span className="text-[10px] text-muted-foreground">Resolved</span></div>
                        </div>
                    </div>

                    {/* Block rate sample */}
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Block Rate by Label</p>
                        <p className="text-xs text-muted-foreground mb-3">For each Linear label, what percentage of issues with that label were sent back as "Needs Input" at least once. Helps identify which issue types have the most friction.</p>
                        <div className="space-y-2">
                            {SAMPLE_BLOCK_RATE.map((row, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 w-28 shrink-0 min-w-0">
                                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                                        <span className="text-xs text-muted-foreground truncate">{row.name}</span>
                                    </div>
                                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${row.blockRate}%`, backgroundColor: row.color }} />
                                    </div>
                                    <span className="text-xs tabular-nums text-muted-foreground w-8 text-right shrink-0">{row.blockRate}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Engagement */}
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Engagement (30 days)</p>
                        <p className="text-xs text-muted-foreground">Login count and issue views per client over the last 30 days. Tracks whether clients are actively using the portal or going silent.</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export function PortalReportView({ clients }: { clients: ClientData[] }) {
    // Workspace-wide aggregates (only from clients with data)
    const withData = clients.filter(c => c.metrics)
    const cycleTimes = withData.map(c => c.metrics!.avgCycleTimeDays).filter((v): v is number => v !== null)
    const responseTimes = withData.map(c => c.metrics!.avgVelocityDays).filter((v): v is number => v !== null)
    const firstPassRates = withData.map(c => c.metrics!.firstPassRate).filter((v): v is number => v !== null)
    const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null

    const avgCycleTime = avg(cycleTimes)
    const avgResponseTime = avg(responseTimes)
    const avgFirstPass = firstPassRates.length ? Math.round(firstPassRates.reduce((a, b) => a + b, 0) / firstPassRates.length) : null

    return (
        <div className="space-y-6 px-4 md:px-8 pb-8">
            {/* Metric reference — always visible, collapsed by default */}
            <SamplePreviewCard />

            {/* Workspace-wide KPI summary */}
            {withData.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Workspace Average</p>
                    <div className="grid grid-cols-3 gap-3 max-w-lg">
                        <AdminKPICard label="Avg Cycle Time" value={avgCycleTime} unit="days" sub="across all clients" />
                        <AdminKPICard label="Avg Response" value={avgResponseTime} unit="days" sub="review → action" />
                        <AdminKPICard label="Avg First-pass" value={avgFirstPass} unit="%" sub="1st try approval" />
                    </div>
                </div>
            )}

            {/* Per-client cards */}
            {clients.length === 0 ? (
                <div className="rounded-lg border border-border/50 bg-muted/20 px-6 py-10 text-center">
                    <p className="text-sm text-muted-foreground">No clients with linked Linear teams yet.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Link teams in <a href="/clients" className="underline underline-offset-2">Clients</a> to start tracking UAT metrics.</p>
                </div>
            ) : (
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        {clients.length} Client{clients.length !== 1 ? "s" : ""}
                    </p>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {clients.map(c => <ClientCard key={c.id} client={c} />)}
                    </div>
                </div>
            )}
        </div>
    )
}

"use client"

import type { PortalStats } from "@/app/actions/portal-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ReferenceLine,
} from "recharts"
import { Clock, AlertTriangle, ArrowRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { PRIORITY_CONFIG } from "@/components/portal/portal-issue-utils"
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface UATDashboardProps {
    stats: PortalStats
    teamId: string
    onGoToBoard?: () => void
    isAdmin?: boolean
}

const CIRCUMFERENCE = 2 * Math.PI * 50 // 314.159...

const COLUMN_COLORS = {
    "client-review": "#3b82f6",
    blocked: "#f59e0b",
    done: "#10b981",
    released: "#8b5cf6",
    canceled: "#ef4444",
    archived: "#64748b",
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

function PassRateGauge({ passRate }: { passRate: number }) {
    const offset = CIRCUMFERENCE * (1 - passRate / 100)
    return (
        <svg viewBox="0 0 120 120" width={120} height={120} className="shrink-0">
            {/* track */}
            <circle cx={60} cy={60} r={50} fill="none" stroke="#e5e7eb" strokeWidth={10} className="dark:stroke-neutral-700" />
            {/* progress */}
            <circle
                cx={60}
                cy={60}
                r={50}
                fill="none"
                stroke="#10b981"
                strokeWidth={10}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
            {/* center label */}
            <text
                x={60}
                y={56}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={22}
                fontWeight="bold"
                fill="currentColor"
                className="fill-foreground"
            >
                {passRate}%
            </text>
            <text
                x={60}
                y={72}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fill="currentColor"
                className="fill-muted-foreground"
            >
                Pass Rate
            </text>
        </svg>
    )
}

function KPIPill({ dot, label, value }: { dot: string; label: string; value: number }) {
    return (
        <div className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-muted/40 border border-border/50">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
            <span className="text-xs text-muted-foreground flex-1">{label}</span>
            <span className="text-sm font-bold tabular-nums">{value}</span>
        </div>
    )
}

// ─── Lifecycle Stepper ────────────────────────────────────────────────────────

const LIFECYCLE_STEPS = [
    { label: "Submit", desc: "You raise a request", color: "#3b82f6" },
    { label: "In Progress", desc: "Team is working on it", color: "#6b7280" },
    { label: "Pending Review", desc: "Ready for your review", color: "#7c3aed" },
    { label: "Approved", desc: "You sign it off", color: "#10b981" },
    { label: "Released", desc: "Shipped to production", color: "#8b5cf6" },
]

function LifecycleStepper() {
    return (
        <>
            {/* Desktop: horizontal */}
            <div className="hidden sm:flex items-start gap-0">
                {LIFECYCLE_STEPS.map((step, i) => (
                    <div key={step.label} className="flex items-start">
                        <div className="flex flex-col items-center gap-1.5 w-28">
                            <div
                                className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                                style={{ backgroundColor: step.color }}
                            >
                                <span className="text-white text-[10px] font-bold">{i + 1}</span>
                            </div>
                            <p className="text-xs font-semibold text-center leading-tight">{step.label}</p>
                            <p className="text-[10px] text-muted-foreground text-center leading-snug">{step.desc}</p>
                        </div>
                        {i < LIFECYCLE_STEPS.length - 1 && (
                            <div className="flex items-center mt-3 shrink-0 w-4">
                                <div className="h-px w-full bg-border" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Mobile: vertical */}
            <div className="flex sm:hidden flex-col gap-3">
                {LIFECYCLE_STEPS.map((step, i) => (
                    <div key={step.label} className="flex items-start gap-3">
                        <div className="flex flex-col items-center shrink-0">
                            <div
                                className="h-6 w-6 rounded-full flex items-center justify-center shadow-sm"
                                style={{ backgroundColor: step.color }}
                            >
                                <span className="text-white text-[9px] font-bold">{i + 1}</span>
                            </div>
                            {i < LIFECYCLE_STEPS.length - 1 && (
                                <div className="w-px h-4 bg-border mt-1" />
                            )}
                        </div>
                        <div className="pt-0.5">
                            <p className="text-xs font-semibold">{step.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UATDashboard({ stats, teamId, onGoToBoard, isAdmin }: UATDashboardProps) {
    const agingIssues = stats.aging.filter(a => a.daysWaiting >= 3)

    const columnPieData = [
        { name: "Pending Review", value: stats.byColumn["client-review"], color: COLUMN_COLORS["client-review"] },
        { name: "Approved", value: stats.byColumn["done"] + stats.byColumn["released"], color: COLUMN_COLORS.done },
        { name: "Needs Input", value: stats.byColumn["blocked"], color: COLUMN_COLORS.blocked },
        { name: "Canceled", value: stats.byColumn["canceled"] + stats.byColumn["archived"], color: COLUMN_COLORS.archived },
    ].filter(d => d.value > 0)

    const hasTrendData = stats.approvalTrend.some(d => d.approved > 0 || d.blocked > 0)

    // Progress bar segment widths
    const safeTotal = stats.total || 1
    const approvedPct = Math.round(((stats.byColumn["done"] + stats.byColumn["released"]) / safeTotal) * 100)
    const pendingPct = Math.round((stats.byColumn["client-review"] / safeTotal) * 100)
    const blockedPct = Math.round((stats.byColumn["blocked"] / safeTotal) * 100)

    // Sort priority bars highest-count first
    const priorityRows = [...stats.byPriority].sort((a, b) => b.count - a.count)
    const maxPriority = priorityRows[0]?.count ?? 1

    return (
        <div className="space-y-5">

            {/* ── 1. Hero card ─────────────────────────────────────────────── */}
            <Card className="overflow-hidden">
                <CardContent className="pt-5 pb-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        {/* Gauge */}
                        <PassRateGauge passRate={stats.passRate} />

                        {/* KPI pills */}
                        <div className="flex-1 flex flex-col gap-2 w-full">
                            <KPIPill dot={COLUMN_COLORS["client-review"]} label="Pending Review" value={stats.pendingReview} />
                            <KPIPill dot={COLUMN_COLORS.blocked} label="Blocked" value={stats.blocked} />
                            <KPIPill dot={COLUMN_COLORS.done} label="Approved" value={stats.approved} />
                        </div>
                    </div>
                </CardContent>

                {/* Progress strip */}
                {stats.total > 0 && (
                    <div className="flex h-1.5 mt-5 overflow-hidden rounded-none">
                        {approvedPct > 0 && (
                            <div style={{ width: `${approvedPct}%`, backgroundColor: COLUMN_COLORS.done }} />
                        )}
                        {pendingPct > 0 && (
                            <div style={{ width: `${pendingPct}%`, backgroundColor: COLUMN_COLORS["client-review"] }} />
                        )}
                        {blockedPct > 0 && (
                            <div style={{ width: `${blockedPct}%`, backgroundColor: COLUMN_COLORS.blocked }} />
                        )}
                        {/* remainder (canceled/archived) */}
                        <div className="flex-1 bg-muted" />
                    </div>
                )}
            </Card>

            {/* ── 2. Action banner ─────────────────────────────────────────── */}
            {stats.pendingReview > 0 && (
                <div className="border-l-2 border-l-blue-400 border border-border/50 bg-muted/30 px-4 py-2.5 rounded-md">
                    <div className="flex items-center gap-3">
                        <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground/80">
                                {stats.pendingReview} {stats.pendingReview === 1 ? "item needs" : "items need"} your review
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Review in order to progress
                            </p>
                        </div>
                        {onGoToBoard && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                                onClick={onGoToBoard}
                            >
                                Review Now
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* ── 3. Aging issues ──────────────────────────────────────────── */}
            {agingIssues.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-800/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            Awaiting your attention
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1.5">
                            {agingIssues.slice(0, 5).map(issue => {
                                const days = issue.daysWaiting
                                const badgeClass = days >= 14
                                    ? "text-red-600 border-red-300 dark:border-red-700 dark:text-red-400"
                                    : days >= 7
                                        ? "text-orange-600 border-orange-300 dark:border-orange-700 dark:text-orange-400"
                                        : "text-amber-600 border-amber-300 dark:border-amber-700 dark:text-amber-400"
                                return (
                                    <a
                                        key={issue.id}
                                        href={`/uat/${teamId}/${issue.id}`}
                                        className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                                    >
                                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                            {issue.identifier}
                                        </span>
                                        <span className="truncate text-xs flex-1">{issue.title}</span>
                                        <Badge variant="outline" className={cn("text-[10px] px-1.5 h-5 shrink-0 tabular-nums", badgeClass)}>
                                            {days}d
                                        </Badge>
                                    </a>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── 4. Request Lifecycle ─────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Request Lifecycle</CardTitle>
                    <p className="text-xs text-muted-foreground">How your requests move through our system.</p>
                </CardHeader>
                <CardContent className="pb-5">
                    <LifecycleStepper />
                </CardContent>
            </Card>

            {/* ── 5. Charts row ────────────────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Status Distribution donut */}
                {columnPieData.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <ResponsiveContainer width={100} height={100}>
                                    <PieChart>
                                        <Pie
                                            data={columnPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={28}
                                            outerRadius={46}
                                            dataKey="value"
                                            strokeWidth={2}
                                            stroke="var(--background)"
                                        >
                                            {columnPieData.map((entry, idx) => (
                                                <Cell key={idx} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 flex-1 min-w-0">
                                    {columnPieData.map((entry, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                            <span className="text-muted-foreground truncate">{entry.name}</span>
                                            <span className="font-semibold tabular-nums ml-auto pl-2">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Priority breakdown — horizontal bar list */}
                {priorityRows.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">By Priority</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2.5">
                                {priorityRows.map((row, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">
                                            {PRIORITY_CONFIG[row.priority]?.label ?? `P${row.priority}`}
                                        </span>
                                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${Math.round((row.count / maxPriority) * 100)}%`,
                                                    backgroundColor: PRIORITY_CONFIG[row.priority]?.dotColor ?? "#6b7280",
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs tabular-nums w-5 text-right shrink-0 text-muted-foreground">{row.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ── 6. Approval Trend ────────────────────────────────────────── */}
            {hasTrendData && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Approval Trend — Last 7 Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={140}>
                            <LineChart data={stats.approvalTrend}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <Tooltip
                                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                                    labelFormatter={d => String(d)}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="approved"
                                    stroke={COLUMN_COLORS.done}
                                    strokeWidth={2}
                                    dot={false}
                                    name="Approved"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="blocked"
                                    stroke={COLUMN_COLORS.blocked}
                                    strokeWidth={2}
                                    dot={false}
                                    name="Needs Input"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* ── 7. By Label + By Project ─────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2">
                {stats.byLabel.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">By Label</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2.5">
                                {stats.byLabel.slice(0, 8).map((label, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] px-1.5 py-0 h-4 font-normal truncate max-w-[140px] shrink-0"
                                            style={{ borderColor: label.color + "60", color: label.color }}
                                        >
                                            {label.name}
                                        </Badge>
                                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    backgroundColor: label.color,
                                                    width: `${Math.round((label.count / stats.total) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground tabular-nums w-5 text-right shrink-0">{label.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {stats.byProject.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">By Project</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2.5">
                                {stats.byProject.slice(0, 8).map((project, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="text-xs truncate max-w-[140px] shrink-0 text-muted-foreground">{project.name}</span>
                                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-primary/70 transition-all"
                                                style={{ width: `${Math.round((project.count / stats.total) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground tabular-nums w-5 text-right shrink-0">{project.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ── 8. Admin metrics (isAdmin only) ──────────────────────────── */}
            {isAdmin && stats.adminMetrics && (
                <TooltipProvider>
                    {/* Admin KPI row */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Team Performance</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <AdminKPICard
                                label="Cycle Time"
                                value={stats.adminMetrics.avgCycleTimeDays}
                                unit="days"
                                sub="created → approved"
                                sampleSize={stats.adminMetrics.cycleTimeSampleSize}
                            />
                            <AdminKPICard
                                label="Response Time"
                                value={stats.adminMetrics.avgVelocityDays}
                                unit="days"
                                sub="review → response"
                                sampleSize={stats.adminMetrics.velocitySampleSize}
                            />
                            <AdminKPICard
                                label="First-pass Rate"
                                value={stats.adminMetrics.firstPassRate}
                                unit="%"
                                sub="approved 1st try"
                            />
                            <AdminKPICard
                                label="Rework Index"
                                value={stats.adminMetrics.reworkIndex}
                                unit="%"
                                sub="blocked 2+ times"
                            />
                        </div>
                    </div>

                    {/* Throughput chart */}
                    {stats.adminMetrics.throughput.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Throughput — Last 8 Weeks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={stats.adminMetrics.throughput} barCategoryGap="30%">
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                        <XAxis
                                            dataKey="week"
                                            tick={{ fontSize: 10 }}
                                            tickFormatter={w => w.replace(/^\d{4}-/, "")}
                                            className="fill-muted-foreground"
                                        />
                                        <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                                        <Tooltip
                                            contentStyle={{ fontSize: 12, borderRadius: 6 }}
                                            labelFormatter={w => String(w)}
                                        />
                                        <ReferenceLine y={0} className="stroke-border" />
                                        <Bar dataKey="created" name="Created" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                                        <Bar
                                            dataKey="resolved"
                                            name="Resolved"
                                            radius={[2, 2, 0, 0]}
                                            fill="#10b981"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </TooltipProvider>
            )}

            {/* ── 9. Block rate by label (visible to all if data exists) ────── */}
            {stats.adminMetrics && stats.adminMetrics.blockRateByLabel.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Block Rate by Label</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2.5">
                            {stats.adminMetrics.blockRateByLabel.map((row, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 w-36 shrink-0 min-w-0">
                                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                                        <span className="text-xs text-muted-foreground truncate">{row.name}</span>
                                    </div>
                                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${row.blockRate}%`, backgroundColor: row.color }}
                                        />
                                    </div>
                                    <span className="text-xs tabular-nums text-muted-foreground w-8 text-right shrink-0">
                                        {row.blockRate}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    )
}

// ─── Admin KPI Card ───────────────────────────────────────────────────────────

function AdminKPICard({
    label,
    value,
    unit,
    sub,
    sampleSize,
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
                    <div className="rounded-lg border border-border/50 bg-card p-4 cursor-default">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                        <p className={cn("text-lg font-semibold tracking-tight", insufficient && "text-muted-foreground/50")}>
                            {displayValue}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            {sub}
                            {insufficient && value !== null && (
                                <Info className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                            )}
                        </p>
                    </div>
                </TooltipTrigger>
                {insufficient && (
                    <TooltipContent side="top" className="text-xs max-w-[200px]">
                        Insufficient data (need 3+ samples)
                    </TooltipContent>
                )}
            </UITooltip>
        </TooltipProvider>
    )
}

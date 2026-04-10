"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, TrendingUp, CheckCircle2, AlertCircle, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Period = "this_week" | "last_4_weeks" | "this_month" | "last_3_months"

interface MemberStat {
    id: string
    userId: string
    name: string
    email: string
    image: string | null
    role: string
    roles: string[]
    capacityHours: number
    trackedHours: number
    billableHours: number
    utilization: number
    billablePct: number
}

interface Summary {
    totalMembers: number
    avgUtilization: number
    fullyUtilized: number
    underUtilized: number
}

interface Props {
    period: Period
    memberStats: MemberStat[]
    summary: Summary
    weeksInPeriod: number
}

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
    OWNER: "default",
    ADMIN: "default",
    MANAGER: "secondary",
    MEMBER: "outline",
    CONTRACTOR: "outline",
}

function initials(name: string) {
    return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
}

function fmtHours(h: number) {
    return h.toFixed(1) + "h"
}

function utilizationColor(pct: number): string {
    if (pct >= 100) return "bg-red-500"
    if (pct >= 80) return "bg-amber-500"
    if (pct >= 40) return "bg-emerald-500"
    return "bg-muted-foreground/40"
}

function utilizationLabel(pct: number): string {
    if (pct >= 100) return "Overloaded"
    if (pct >= 80) return "High"
    if (pct >= 40) return "On Track"
    return "Low"
}

function utilizationBadgeVariant(pct: number): "default" | "secondary" | "outline" {
    if (pct >= 100) return "default"
    if (pct >= 80) return "secondary"
    return "outline"
}

const STATUS_OPTIONS = [
    { value: "__all__", label: "All Statuses" },
    { value: "overloaded", label: "Overloaded (≥100%)" },
    { value: "high", label: "High (≥80%)" },
    { value: "on_track", label: "On Track (≥40%)" },
    { value: "low", label: "Low (<40%)" },
]

const PERMISSION_OPTIONS = [
    { value: "__all__", label: "All Permissions" },
    { value: "OWNER", label: "Owner" },
    { value: "ADMIN", label: "Admin" },
    { value: "MANAGER", label: "Manager" },
    { value: "MEMBER", label: "Member" },
    { value: "CONTRACTOR", label: "Contractor" },
]

function matchesStatus(pct: number, filter: string): boolean {
    if (filter === "__all__") return true
    if (filter === "overloaded") return pct >= 100
    if (filter === "high") return pct >= 80 && pct < 100
    if (filter === "on_track") return pct >= 40 && pct < 80
    if (filter === "low") return pct < 40
    return true
}

export function UtilizationView({ period, memberStats, summary, weeksInPeriod }: Props) {
    const router = useRouter()
    const pathname = usePathname()

    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("__all__")
    const [statusFilter, setStatusFilter] = useState("__all__")
    const [skillFilter, setSkillFilter] = useState("__all__")

    // Unique skill tags across all members
    const allSkills = useMemo(() => {
        const set = new Set<string>()
        for (const m of memberStats) for (const r of m.roles) set.add(r)
        return [...set].sort()
    }, [memberStats])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return memberStats.filter(m => {
            if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false
            if (roleFilter !== "__all__" && m.role !== roleFilter) return false
            if (!matchesStatus(m.utilization, statusFilter)) return false
            if (skillFilter !== "__all__" && !m.roles.includes(skillFilter)) return false
            return true
        })
    }, [memberStats, search, roleFilter, statusFilter, skillFilter])

    const hasFilters = search !== "" || roleFilter !== "__all__" || statusFilter !== "__all__" || skillFilter !== "__all__"

    function clearFilters() {
        setSearch("")
        setRoleFilter("__all__")
        setStatusFilter("__all__")
        setSkillFilter("__all__")
    }

    function onPeriodChange(value: string) {
        router.push(`${pathname}?period=${value}`)
    }

    return (
        <div className="space-y-6">
            {/* Period selector */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Period:</span>
                <Select value={period} onValueChange={onPeriodChange}>
                    <SelectTrigger className="w-44 h-9 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="this_week">This Week</SelectItem>
                        <SelectItem value="last_4_weeks">Last 4 Weeks</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                    ({weeksInPeriod.toFixed(1)} weeks capacity)
                </span>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Total Members
                    </p>
                    <p className="text-lg font-semibold tracking-tight text-foreground tabular-nums">{summary.totalMembers}</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Avg Utilization
                    </p>
                    <p className="text-lg font-semibold tracking-tight text-foreground tabular-nums">
                        {summary.avgUtilization.toFixed(0)}%
                    </p>
                </div>

                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Fully Utilized
                    </p>
                    <p className="text-lg font-semibold tracking-tight text-foreground tabular-nums">{summary.fullyUtilized}</p>
                    <p className="text-xs text-muted-foreground">&ge;80% capacity</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        Underutilized
                    </p>
                    <p className="text-lg font-semibold tracking-tight text-foreground tabular-nums">{summary.underUtilized}</p>
                    <p className="text-xs text-muted-foreground">&lt;40% capacity</p>
                </div>
            </div>

            {/* Per-member table */}
            <Card className="border-sidebar-border">
                <CardHeader className="pb-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">Member Breakdown</CardTitle>
                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs text-muted-foreground gap-1">
                                <X className="size-3" /> Clear filters
                            </Button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* Search by name / email */}
                        <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search name or email…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="h-8 pl-8 text-xs bg-sidebar/50 border-sidebar-border"
                            />
                        </div>
                        {/* Permission filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground shrink-0">Permission:</span>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="h-8 w-[130px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PERMISSION_OPTIONS.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Status filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground shrink-0">Status:</span>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-8 w-[150px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Skill tag filter */}
                        {allSkills.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground shrink-0">Skill:</span>
                                <Select value={skillFilter} onValueChange={setSkillFilter}>
                                    <SelectTrigger className="h-8 w-[130px] text-xs">
                                        <SelectValue placeholder="All Skills" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">All Skills</SelectItem>
                                        {allSkills.map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    {hasFilters && (
                        <p className="text-xs text-muted-foreground">
                            Showing {filtered.length} of {memberStats.length} members
                        </p>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    {filtered.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                            {hasFilters ? "No members match the current filters." : "No team members found."}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-sidebar-border hover:bg-transparent">
                                    <TableHead>Member</TableHead>
                                    <TableHead className="w-48">Utilization</TableHead>
                                    <TableHead className="text-right tabular-nums">Tracked / Capacity</TableHead>
                                    <TableHead className="text-right tabular-nums">Billable</TableHead>
                                    <TableHead className="text-right tabular-nums">Billable %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(m => {
                                    const pct = Math.min(m.utilization, 100)
                                    const color = utilizationColor(m.utilization)
                                    return (
                                        <TableRow key={m.id} className="border-sidebar-border/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarFallback className={`text-xs text-white ${avatarBg(m.name)}`}>
                                                            {initials(m.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium truncate">{m.name}</div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Badge
                                                                variant={ROLE_VARIANTS[m.role] ?? "outline"}
                                                                className="text-[10px] h-4 px-1.5"
                                                            >
                                                                {m.role.charAt(0) + m.role.slice(1).toLowerCase()}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-primary/20">
                                                            <div
                                                                className={`h-full transition-all ${color}`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs tabular-nums text-muted-foreground w-10 text-right shrink-0">
                                                            {m.utilization.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <Badge
                                                        variant={utilizationBadgeVariant(m.utilization)}
                                                        className={`text-[10px] h-4 px-1.5 ${
                                                            m.utilization >= 100
                                                                ? "bg-red-500 text-white hover:bg-red-500/90 border-transparent"
                                                                : m.utilization >= 80
                                                                ? "bg-amber-500 text-white hover:bg-amber-500/90 border-transparent"
                                                                : m.utilization >= 40
                                                                ? "bg-emerald-500 text-white hover:bg-emerald-500/90 border-transparent"
                                                                : ""
                                                        }`}
                                                    >
                                                        {utilizationLabel(m.utilization)}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-sm">
                                                <span className="font-medium">{fmtHours(m.trackedHours)}</span>
                                                <span className="text-muted-foreground">
                                                    {" "}/ {fmtHours(m.capacityHours)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-sm">
                                                {fmtHours(m.billableHours)}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                                                {m.trackedHours > 0
                                                    ? m.billablePct.toFixed(0) + "%"
                                                    : "—"}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

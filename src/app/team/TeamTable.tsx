"use client"

import { useState, useMemo } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Search,
    X,
    Check,
    Tag,
} from "lucide-react"
import { MemberRolesBadges } from "./MemberRolesEditor"
import { MemberRolesEditor } from "./MemberRolesEditorClient"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MemberRow {
    id: string
    userId: string
    role: string
    roles: string[]
    title: string | null
    teamName: string | null
    displayName: string
    email: string
    hoursTracked: number
    billableHours: number
    billableSeconds: number
    nonBillableSeconds: number
    scheduledHours: number
    capacity: number
    utilization: number
}

type SortKey = "name" | "scheduled" | "delta" | "hours" | "utilization" | "capacity" | "billable"
type SortDir = "asc" | "desc"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

function utilizationColor(pct: number) {
    if (pct >= 100) return "text-red-500"
    if (pct >= 80) return "text-amber-500"
    return "text-green-600"
}

function getDelta(m: MemberRow): number | null {
    return m.scheduledHours > 0 ? m.scheduledHours - m.hoursTracked : null
}

function sortValue(m: MemberRow, key: SortKey): number | string {
    switch (key) {
        case "name": return m.displayName.toLowerCase()
        case "scheduled": return m.scheduledHours
        case "delta": return getDelta(m) ?? -Infinity
        case "hours": return m.hoursTracked
        case "utilization": return m.utilization
        case "capacity": return m.capacity
        case "billable": return m.billableHours
    }
}

// ─── SortHeader ──────────────────────────────────────────────────────────────

function SortHeader({
    label,
    col,
    sort,
    dir,
    onSort,
    className = "",
}: {
    label: string
    col: SortKey
    sort: SortKey
    dir: SortDir
    onSort: (col: SortKey) => void
    className?: string
}) {
    const active = sort === col
    return (
        <button
            onClick={() => onSort(col)}
            className={`flex items-center gap-0.5 transition-colors group ${className} ${
                active
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground/80 font-medium"
            }`}
        >
            <span className={`${active ? "underline underline-offset-2 decoration-dotted" : ""}`}>{label}</span>
            <span className="shrink-0 ml-0.5">
                {active ? (
                    dir === "asc"
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />
                ) : (
                    <ChevronsUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
            </span>
        </button>
    )
}

// ─── TeamTable ────────────────────────────────────────────────────────────────

export function TeamTable({
    employees,
    contractors,
    canManage,
    availableRoles,
    allSkills,
    weekOfStr,
}: {
    employees: MemberRow[]
    contractors: MemberRow[]
    canManage: boolean
    availableRoles: string[]
    allSkills: string[]
    weekOfStr: string
}) {
    const [sort, setSort] = useState<SortKey>("name")
    const [dir, setDir] = useState<SortDir>("asc")
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState<string | null>(null)
    const [roleOpen, setRoleOpen] = useState(false)

    function onSort(col: SortKey) {
        if (sort === col) {
            setDir(d => d === "asc" ? "desc" : "asc")
        } else {
            setSort(col)
            setDir(col === "name" ? "asc" : "desc")
        }
    }

    function applyFilters(list: MemberRow[]) {
        const q = search.trim().toLowerCase()
        return list.filter(m => {
            if (q && !m.displayName.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false
            if (roleFilter && !m.roles.includes(roleFilter)) return false
            return true
        })
    }

    function applySortAndFilter(list: MemberRow[]) {
        const filtered = applyFilters(list)
        return [...filtered].sort((a, b) => {
            const av = sortValue(a, sort)
            const bv = sortValue(b, sort)
            const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number)
            return dir === "asc" ? cmp : -cmp
        })
    }

    const sortedEmployees = useMemo(() => applySortAndFilter(employees), [employees, sort, dir, search, roleFilter])
    const sortedContractors = useMemo(() => applySortAndFilter(contractors), [contractors, sort, dir, search, roleFilter])

    const hasFilters = search !== "" || roleFilter !== null
    const totalShown = sortedEmployees.length + sortedContractors.length
    const totalAll = employees.length + contractors.length

    const headerProps = { sort, dir, onSort }

    function renderRow(m: MemberRow) {
        const utilPct = Math.min(m.utilization, 100)
        const billablePct = m.capacity > 0 ? Math.min((m.billableHours / m.capacity) * 100, 100) : 0
        const delta = getDelta(m)
        const hasScheduled = m.scheduledHours > 0
        const timesheetHref = `/team/${m.id}?week_of=${weekOfStr}`
        const isOverTracked = delta !== null && delta < 0

        return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-sidebar/25 transition-colors group/row">
                {/* Avatar + identity */}
                <a href={timesheetHref} className="flex items-center gap-3 flex-1 min-w-0 group">
                    <span className="relative shrink-0">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className={`text-xs font-medium text-white ${avatarBg(m.displayName)}`}>
                                {initials(m.displayName)}
                            </AvatarFallback>
                        </Avatar>
                        <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-[1.5px] border-background z-10 ${
                                m.hoursTracked > 0 ? "bg-green-500" : "bg-muted-foreground/30"
                            }`}
                            aria-label={m.hoursTracked > 0 ? "Logged hours this week" : "No hours logged"}
                        />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium leading-tight truncate group-hover:underline decoration-muted-foreground/40 underline-offset-2">
                                {m.displayName}
                            </span>
                            {(m.role === "OWNER" || m.role === "ADMIN") && (
                                <Badge variant="secondary" className="text-[10px] h-[18px] px-1.5 hidden sm:inline-flex font-medium">
                                    {m.role.charAt(0) + m.role.slice(1).toLowerCase()}
                                </Badge>
                            )}
                            {m.role === "MANAGER" && (
                                <Badge variant="outline" className="text-[10px] h-[18px] px-1.5 hidden sm:inline-flex">
                                    Manager
                                </Badge>
                            )}
                        </span>
                        {m.title && (
                            <span className="text-[11px] text-muted-foreground truncate block leading-tight mt-0.5">
                                {m.title}
                            </span>
                        )}
                        <MemberRolesBadges roles={m.roles} />
                    </span>
                </a>

                {canManage && (
                    <span className="opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0">
                        <MemberRolesEditor memberId={m.id} currentRoles={m.roles} availableRoles={availableRoles} />
                    </span>
                )}

                {/* Stats — desktop */}
                <div className="hidden md:flex items-center gap-4 shrink-0">
                    {/* Scheduled */}
                    <span className="text-xs tabular-nums w-16 text-right text-muted-foreground">
                        {hasScheduled ? m.scheduledHours.toFixed(2) : <span className="opacity-30">—</span>}
                    </span>
                    {/* Delta */}
                    <span className={`text-xs tabular-nums w-14 text-right font-medium ${
                        isOverTracked ? "text-amber-500 dark:text-amber-400" : "text-muted-foreground"
                    }`}>
                        {delta !== null ? (
                            <>{isOverTracked ? "" : "+"}{delta.toFixed(2)}</>
                        ) : (
                            <span className="opacity-30">—</span>
                        )}
                    </span>
                    {/* Hours + mini progress bar */}
                    <div className="w-40 flex items-center gap-2">
                        <span className="text-xs tabular-nums w-10 shrink-0 font-medium">
                            {m.hoursTracked.toFixed(2)}
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden flex">
                            <div className="h-full bg-blue-500 transition-all" style={{ width: `${billablePct}%` }} />
                            <div className="h-full bg-blue-200 dark:bg-blue-800" style={{ width: `${Math.max(0, utilPct - billablePct)}%` }} />
                        </div>
                    </div>
                    {/* Utilization */}
                    <span className={`text-xs tabular-nums w-12 text-right font-semibold ${utilizationColor(m.utilization)}`}>
                        {m.utilization.toFixed(0)}%
                    </span>
                    {/* Capacity */}
                    <span className="text-xs tabular-nums w-14 text-right text-muted-foreground">
                        {m.capacity.toFixed(2)}
                    </span>
                    {/* Billable hrs */}
                    <span className="text-xs tabular-nums w-20 text-right text-foreground/80">
                        {m.billableHours.toFixed(2)}
                    </span>
                </div>

                {/* Mobile summary */}
                <div className="md:hidden shrink-0 text-right">
                    <div className="text-sm font-semibold tabular-nums">{m.hoursTracked.toFixed(2)}h</div>
                    <div className={`text-xs tabular-nums font-medium ${utilizationColor(m.utilization)}`}>
                        {m.utilization.toFixed(0)}%
                    </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
                            aria-label="Member actions"
                        >
                            <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <a href={timesheetHref}>View timesheet</a>
                        </DropdownMenuItem>
                        {canManage && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <a href={`/team/${m.id}/profile`}>Edit profile</a>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search name or email…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-8 pl-8 text-xs bg-background border-sidebar-border focus-visible:ring-1 focus-visible:ring-ring/60"
                    />
                </div>

                {/* Role filter — Popover+Command */}
                {allSkills.length > 0 && (
                    <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={`h-8 gap-1.5 text-xs transition-colors ${
                                    roleFilter
                                        ? "border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 font-medium"
                                        : "border-sidebar-border text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Tag className="size-3.5 shrink-0" />
                                {roleFilter ?? "Role"}
                                {roleFilter && (
                                    <span
                                        role="button"
                                        onClick={e => { e.stopPropagation(); setRoleFilter(null) }}
                                        className="ml-0.5 rounded-sm hover:bg-amber-200 dark:hover:bg-amber-900/60 p-0.5 -mr-0.5 transition-colors"
                                        aria-label="Clear role filter"
                                    >
                                        <X className="size-2.5" />
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-52 p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search roles…" className="h-8 text-xs" />
                                <CommandList>
                                    <CommandEmpty className="py-4 text-xs text-center text-muted-foreground">No roles found.</CommandEmpty>
                                    <CommandGroup>
                                        {allSkills.map(skill => (
                                            <CommandItem
                                                key={skill}
                                                value={skill}
                                                onSelect={() => {
                                                    setRoleFilter(prev => prev === skill ? null : skill)
                                                    setRoleOpen(false)
                                                }}
                                                className="text-xs"
                                            >
                                                <Check className={`mr-2 size-3.5 ${roleFilter === skill ? "opacity-100 text-amber-600" : "opacity-0"}`} />
                                                {skill}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}

                {hasFilters && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSearch(""); setRoleFilter(null) }}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                        >
                            <X className="size-3" /> Clear filters
                        </Button>
                        <span className="text-xs text-muted-foreground/70">
                            {totalShown} of {totalAll} members
                        </span>
                    </>
                )}
            </div>

            {/* Tables */}
            {[
                { label: "Employees", group: sortedEmployees },
                { label: "Contractors", group: sortedContractors },
            ].map(({ label, group }) =>
                group.length === 0 ? null : (
                    <Card key={label} className="border-sidebar-border overflow-hidden">
                        {/* Group header: section label left, sortable column headers right */}
                        <div className="px-4 py-2 bg-muted/40 border-b border-sidebar-border flex items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                            <span className="text-[11px] text-muted-foreground/50 font-normal">{group.length}</span>
                            <div className="ml-auto hidden md:flex items-center gap-4 text-[11px] shrink-0">
                                <SortHeader label="Sched." col="scheduled" className="w-16 justify-end" {...headerProps} />
                                <SortHeader label="Delta" col="delta" className="w-14 justify-end" {...headerProps} />
                                <SortHeader label="Hours" col="hours" className="w-40" {...headerProps} />
                                <SortHeader label="Utiliz." col="utilization" className="w-12 justify-end" {...headerProps} />
                                <SortHeader label="Capacity" col="capacity" className="w-14 justify-end" {...headerProps} />
                                <SortHeader label="Billable" col="billable" className="w-20 justify-end" {...headerProps} />
                                {/* spacer matches the ghost actions button width */}
                                <span className="w-7" />
                            </div>
                        </div>
                        <div className="divide-y divide-sidebar-border/40">
                            {group.map(renderRow)}
                        </div>
                    </Card>
                )
            )}

            {hasFilters && totalShown === 0 && (
                <div className="rounded-lg border border-dashed border-sidebar-border px-6 py-14 text-center">
                    <p className="text-sm font-medium text-muted-foreground">No members match your filters</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting the search or role filter</p>
                </div>
            )}
        </div>
    )
}

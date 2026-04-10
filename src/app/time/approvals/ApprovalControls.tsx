"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addWeeks, subWeeks, startOfWeek, isSameDay, parseISO } from "date-fns"

interface Props {
    weekStart: string
    weekEnd: string
    status: string
    groupBy: string
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function ApprovalControls({ weekStart, weekEnd, status, groupBy, weekStartsOn }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    function buildUrl(updates: Record<string, string | null>) {
        const p = new URLSearchParams(searchParams.toString())
        for (const [k, v] of Object.entries(updates)) {
            if (v === null) p.delete(k)
            else p.set(k, v)
        }
        return `${pathname}?${p.toString()}`
    }

    const start = parseISO(weekStart)
    const end = parseISO(weekEnd)
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn })
    const isCurrentWeek = isSameDay(start, currentWeekStart)

    const sameYear = start.getFullYear() === end.getFullYear()
    const rangeLabel = sameYear
        ? `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
        : `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Week navigation */}
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => router.push(buildUrl({ week: format(subWeeks(start, 1), "yyyy-MM-dd") }))}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-xl font-bold min-w-[220px]">{rangeLabel}</span>

            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => router.push(buildUrl({ week: format(addWeeks(start, 1), "yyyy-MM-dd") }))}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>

            {!isCurrentWeek && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                    onClick={() => router.push(buildUrl({ week: null }))}
                >
                    This week
                </Button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Status filter */}
            <Select
                value={status}
                onValueChange={(v) => router.push(buildUrl({ status: v }))}
            >
                <SelectTrigger className="h-8 w-[200px] text-sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__all__">All statuses</SelectItem>
                    <SelectItem value="PENDING">Pending Approval</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
            </Select>

            {/* Group by */}
            <Select
                value={groupBy}
                onValueChange={(v) => router.push(buildUrl({ groupBy: v }))}
            >
                <SelectTrigger className="h-8 w-[180px] text-sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="person">Group by: Person</SelectItem>
                    <SelectItem value="project">Group by: Project</SelectItem>
                    <SelectItem value="client">Group by: Client</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

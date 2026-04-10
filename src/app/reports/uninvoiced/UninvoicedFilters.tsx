"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Filter } from "lucide-react"

interface UninvoicedFiltersProps {
    defaultFrom: string
    defaultTo: string
}

export function UninvoicedFilters({ defaultFrom, defaultTo }: UninvoicedFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [from, setFrom] = useState(searchParams.get("from") ?? defaultFrom)
    const [to, setTo] = useState(searchParams.get("to") ?? defaultTo)

    function apply() {
        const params = new URLSearchParams()
        if (from) params.set("from", from)
        if (to) params.set("to", to)
        router.push(`/reports/uninvoiced?${params.toString()}`)
    }

    function clearFilters() {
        setFrom(defaultFrom)
        setTo(defaultTo)
        router.push("/reports/uninvoiced")
    }

    return (
        <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
                <Label htmlFor="from" className="text-xs text-muted-foreground">From</Label>
                <Input
                    id="from"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-40 bg-sidebar/50 border-sidebar-border"
                />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="to" className="text-xs text-muted-foreground">To</Label>
                <Input
                    id="to"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-40 bg-sidebar/50 border-sidebar-border"
                />
            </div>
            <div className="flex gap-2">
                <Button onClick={apply} size="sm">
                    <Filter className="w-3.5 h-3.5 mr-2" />
                    Apply
                </Button>
                <Button onClick={clearFilters} size="sm" variant="outline">
                    Clear
                </Button>
            </div>
        </div>
    )
}

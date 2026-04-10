"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"


interface ManagerOption {
    id: string
    name: string | null
    email: string
    role: string
}

interface ProjectFiltersProps {
    totalActive: number
    totalArchived: number
    totalPipeline: number
    totalAll: number
    clients: Array<{ id: string; name: string }>
    managers?: ManagerOption[]
}

const STATUS_TABS = [
    { value: "active", label: "Active" },
    { value: "pipeline", label: "Pipeline" },
    { value: "archived", label: "Archived" },
    { value: "all", label: "All" },
] as const

export function ProjectFilters({ totalActive, totalArchived, totalPipeline, totalAll, clients, managers }: ProjectFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentStatus = searchParams.get("status") || "active"
    const currentClient = searchParams.get("client") || "__all__"
    const currentManager = searchParams.get("manager") || "__all__"
    const currentQ = searchParams.get("q") || ""

    const [search, setSearch] = useState(currentQ)

    const updateParams = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            if (value && value !== "__all__") {
                params.set(key, value)
            } else {
                params.delete(key)
            }
            router.push(`/projects?${params.toString()}`)
        },
        [router, searchParams],
    )

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (search) {
                params.set("q", search)
            } else {
                params.delete("q")
            }
            router.push(`/projects?${params.toString()}`)
        }, 300)
        return () => clearTimeout(timer)
    }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

    const countFor = (v: string) => {
        if (v === "active") return totalActive
        if (v === "pipeline") return totalPipeline
        if (v === "archived") return totalArchived
        return totalAll
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Status tab strip */}
            <Tabs value={currentStatus} onValueChange={(v) => updateParams("status", v)}>
                <TabsList className="h-8">
                    {STATUS_TABS.map(tab => (
                        <TabsTrigger key={tab.value} value={tab.value} className="h-7 px-3 text-xs">
                            {tab.label}
                            <span className="ml-1.5 tabular-nums text-muted-foreground">{countFor(tab.value)}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {clients.length > 0 && (
                <Select
                    value={currentClient}
                    onValueChange={(v) => updateParams("client", v)}
                >
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                        <SelectValue placeholder="All clients" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All clients</SelectItem>
                        {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {managers && managers.length > 0 && (
                <Select
                    value={currentManager}
                    onValueChange={(v) => updateParams("manager", v)}
                >
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                        <SelectValue placeholder="All managers" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All managers</SelectItem>
                        {managers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                                {m.name || m.email}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <div className="relative ml-auto w-full max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                    type="search"
                    placeholder="Search projects…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-sidebar/50 border-sidebar-border"
                />
            </div>
        </div>
    )
}

"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Client {
    id: string
    name: string
}

interface Project {
    id: string
    name: string
    clientId: string | null
}

interface Props {
    clients: Client[]
    projects: Project[]
    search: string
    status: string
    clientId: string
    projectId: string
}

const STATUS_TABS = [
    { value: "open", label: "Open" },
    { value: "completed", label: "Completed" },
    { value: "all", label: "All" },
]

export function TaskFilters({ clients, projects, search, status, clientId, projectId }: Props) {
    const router = useRouter()

    const push = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(window.location.search)
            for (const [k, v] of Object.entries(updates)) {
                if (v) params.set(k, v)
                else params.delete(k)
            }
            router.push(`?${params.toString()}`)
        },
        [router],
    )

    // Projects filtered by selected client
    const visibleProjects = clientId
        ? projects.filter((p) => p.clientId === clientId)
        : projects

    function handleClientChange(val: string) {
        const next: Record<string, string> = { clientId: val === "__all__" ? "" : val }
        // Clear project if it no longer belongs to selected client
        if (val !== "__all__" && projectId) {
            const stillValid = projects.some((p) => p.id === projectId && p.clientId === val)
            if (!stillValid) next.projectId = ""
        }
        push(next)
    }

    function handleProjectChange(val: string) {
        push({ projectId: val === "__all__" ? "" : val })
    }

    function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const q = (e.currentTarget.elements.namedItem("search") as HTMLInputElement).value.trim()
        push({ search: q })
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                    type="search"
                    name="search"
                    defaultValue={search}
                    placeholder="Filter tasks…"
                    className="pl-8 h-9 w-48 text-sm border-border/60 bg-card"
                />
            </form>

            {/* Client filter */}
            {clients.length > 0 && (
                <Select value={clientId || "__all__"} onValueChange={handleClientChange}>
                    <SelectTrigger className="h-9 w-44 text-sm border-border/60 bg-card">
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

            {/* Project filter */}
            {visibleProjects.length > 0 && (
                <Select value={projectId || "__all__"} onValueChange={handleProjectChange}>
                    <SelectTrigger className="h-9 w-48 text-sm border-border/60 bg-card">
                        <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All projects</SelectItem>
                        {visibleProjects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {/* Divider */}
            <div className="h-5 w-px bg-border/50 hidden sm:block" />

            {/* Status tabs */}
            <div className="flex items-center rounded-md border border-border/50 bg-muted/20 p-0.5 gap-0.5">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => push({ status: tab.value })}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            status === tab.value
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Clear filters */}
            {(search || clientId || projectId || status !== "open") && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs text-muted-foreground hover:text-foreground px-2"
                    onClick={() => router.push("?")}
                >
                    Clear
                </Button>
            )}
        </div>
    )
}

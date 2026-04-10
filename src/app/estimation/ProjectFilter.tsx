"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Project {
    id: string
    name: string
    code: string | null
}

interface ProjectFilterProps {
    projects: Project[]
    currentFilter: string | undefined
}

export function ProjectFilter({ projects, currentFilter }: ProjectFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    function handleChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value === "__all__") {
            params.delete("filter")
        } else {
            params.set("filter", value)
        }
        // Remove projectId param when applying a filter (separate concern)
        params.delete("projectId")
        router.push(`/estimation?${params.toString()}`)
    }

    return (
        <Select value={currentFilter ?? "__all__"} onValueChange={handleChange}>
            <SelectTrigger className="h-8 w-[200px] text-sm">
                <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="__all__">All projects</SelectItem>
                {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                        {p.code ? `[${p.code}] ${p.name}` : p.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

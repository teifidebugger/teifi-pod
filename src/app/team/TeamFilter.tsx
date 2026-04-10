"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TeamFilter({ teams, weekOf }: { teams: string[]; weekOf: string }) {
    const router = useRouter()
    const sp = useSearchParams()
    const current = sp.get("team") ?? "__all__"

    function onChange(val: string) {
        const params = new URLSearchParams(sp.toString())
        if (val === "__all__") params.delete("team")
        else params.set("team", val)
        router.push(`/team?${params.toString()}`)
    }

    return (
        <Select value={current} onValueChange={onChange}>
            <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue placeholder="Everyone" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="__all__">Everyone</SelectItem>
                {teams.map(t => (
                    <SelectItem key={t} value={t}>
                        {t}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

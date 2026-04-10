"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useRef, useCallback } from "react"

export function MemberSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (value.trim()) {
                params.set("q", value.trim())
            } else {
                params.delete("q")
            }
            params.set("view", "manage")
            params.set("section", "members")
            router.replace(`/team?${params.toString()}`)
        }, 300)
    }, [router, searchParams])

    return (
        <div className="px-4 py-3 border-b border-sidebar-border/50">
            <input
                defaultValue={searchParams.get("q") ?? ""}
                onChange={handleChange}
                placeholder="Search by name or email…"
                className="w-full h-8 text-sm bg-transparent border border-sidebar-border/60 rounded-md px-3 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                autoComplete="off"
            />
        </div>
    )
}

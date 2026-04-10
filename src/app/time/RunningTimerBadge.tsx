"use client"

import { useState, useEffect } from "react"

function formatElapsed(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
}

export function RunningTimerBadge({ timerStartedAt }: { timerStartedAt: string }) {
    const [elapsed, setElapsed] = useState(() =>
        Math.floor((Date.now() - new Date(timerStartedAt).getTime()) / 1000)
    )

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - new Date(timerStartedAt).getTime()) / 1000))
        }, 1000)
        return () => clearInterval(interval)
    }, [timerStartedAt])

    return (
        <span className="inline-flex items-center gap-1.5 shrink-0 font-mono tabular-nums text-xs min-w-[4.5rem] justify-center rounded-full px-2.5 py-0.5 bg-emerald-950/30 text-emerald-400 border border-emerald-500/30">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            {formatElapsed(elapsed)}
        </span>
    )
}

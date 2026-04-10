"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimerWidgetProps {
  activeTimer: {
    id: string
    projectName: string
    taskName: string | null
    description: string | null
    timerStartedAt: string // ISO string
  } | null
}

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  )
}

export function TimerWidget({ activeTimer }: TimerWidgetProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (!activeTimer) return 0
    return Math.floor(
      (Date.now() - new Date(activeTimer.timerStartedAt).getTime()) / 1000
    )
  })

  useEffect(() => {
    if (!activeTimer) return
    const interval = setInterval(() => {
      setElapsedSeconds(
        Math.floor(
          (Date.now() - new Date(activeTimer.timerStartedAt).getTime()) / 1000
        )
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [activeTimer])

  return (
    <div className="rounded-lg border border-border/50 bg-card px-4 py-4">
      {activeTimer ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="text-sm font-medium text-foreground">
              {activeTimer.projectName}
            </span>
            {activeTimer.taskName && (
              <span className="text-sm text-muted-foreground">
                · {activeTimer.taskName}
              </span>
            )}
          </div>

          {activeTimer.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {activeTimer.description}
            </p>
          )}

          <span className="font-mono text-2xl font-semibold text-foreground tracking-tight">
            {formatElapsed(elapsedSeconds)}
          </span>

          <Button asChild variant="outline" size="sm" className="w-fit mt-1 h-7 text-xs border-border/60">
            <Link href="/time">Go to timer →</Link>
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">No active timer</span>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/time">
              <Timer className="h-3.5 w-3.5 mr-1.5" />
              Start tracking →
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

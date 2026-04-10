"use client"

import { useState, useTransition } from "react"
import { toggleTaskBillable } from "@/app/actions/tasks"
import { toast } from "sonner"

interface TaskBillableToggleProps {
    taskId: string
    isBillable: boolean
    projectBillBy: string
    hourlyRateCents: number | null
}

export function TaskBillableToggle({ taskId, isBillable, projectBillBy, hourlyRateCents }: TaskBillableToggleProps) {
    const [optimistic, setOptimistic] = useState(isBillable)
    const [pending, startTransition] = useTransition()

    function handleToggle() {
        const next = !optimistic
        setOptimistic(next)
        startTransition(async () => {
            try {
                await toggleTaskBillable(taskId, next)
            } catch (err: unknown) {
                setOptimistic(!next) // revert
                toast.error(err instanceof Error ? err.message : "Failed to update billability")
            }
        })
    }

    return (
        <div className="flex items-center gap-2 shrink-0">
            <button
                type="button"
                onClick={handleToggle}
                disabled={pending}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    optimistic
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                } ${pending ? "opacity-50" : "hover:opacity-80 cursor-pointer"}`}
            >
                {optimistic ? "Billable" : "Non-billable"}
            </button>
            {projectBillBy === "Tasks" && hourlyRateCents !== null && hourlyRateCents > 0 && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                    ${(hourlyRateCents / 100).toFixed(2)}/hr
                </span>
            )}
        </div>
    )
}

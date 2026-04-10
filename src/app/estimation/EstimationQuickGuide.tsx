"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Dices, ListPlus, Vote, CheckCircle } from "lucide-react"

const DISMISSED_KEY = "teifi_estimation_guide_dismissed"

const STEPS = [
    { icon: Dices, label: "Create Session", desc: "Set a name, deck type, and optional project" },
    { icon: ListPlus, label: "Add Issues", desc: "Import from Linear or add rounds manually" },
    { icon: Vote, label: "Vote", desc: "Each participant picks a card — votes stay hidden" },
    { icon: CheckCircle, label: "Confirm", desc: "Host reveals votes and sets the final estimate" },
]

export function EstimationQuickGuide() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!localStorage.getItem(DISMISSED_KEY)) {
            setVisible(true)
        }
    }, [])

    function dismiss() {
        localStorage.setItem(DISMISSED_KEY, "1")
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div className="flex items-start gap-3 rounded-lg border border-sidebar-border bg-sidebar/40 px-4 py-3">
            <div className="flex-1">
                <p className="text-sm font-medium mb-2">How planning poker works</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {STEPS.map(({ icon: Icon, label, desc }, i) => (
                        <div key={label} className="flex items-start gap-2 min-w-[160px]">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground mt-0.5">
                                {i + 1}
                            </div>
                            <div>
                                <p className="text-xs font-medium leading-tight">{label}</p>
                                <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground" onClick={dismiss}>
                <X className="h-3.5 w-3.5" />
            </Button>
        </div>
    )
}

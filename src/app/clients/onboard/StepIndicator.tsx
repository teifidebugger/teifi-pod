import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
    { id: "template", label: "Template" },
    { id: "details", label: "Details" },
    { id: "review", label: "Review" },
    { id: "execute", label: "Execute" },
] as const

type StepId = (typeof STEPS)[number]["id"]

interface StepIndicatorProps {
    current: StepId
}

const STEP_ORDER: StepId[] = ["template", "details", "review", "execute"]

export function StepIndicator({ current }: StepIndicatorProps) {
    const currentIndex = STEP_ORDER.indexOf(current)

    return (
        <nav className="flex flex-col gap-0 w-44">
            {STEPS.map((step, index) => {
                const isDone = index < currentIndex
                const isActive = index === currentIndex
                const isLast = index === STEPS.length - 1

                return (
                    <div key={step.id} className="flex flex-col">
                        <div className="flex items-center gap-3">
                            {/* Circle */}
                            <div
                                className={cn(
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                    isDone &&
                                        "border-muted-foreground/40 bg-muted text-muted-foreground",
                                    isActive &&
                                        "border-foreground bg-foreground text-background",
                                    !isDone &&
                                        !isActive &&
                                        "border-border bg-transparent",
                                )}
                            >
                                {isDone ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    <span
                                        className={cn(
                                            "text-xs font-semibold",
                                            isActive
                                                ? "text-background"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        {index + 1}
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "text-sm transition-colors",
                                    isActive
                                        ? "font-semibold text-foreground"
                                        : isDone
                                          ? "text-muted-foreground"
                                          : "text-muted-foreground/60",
                                )}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector line */}
                        {!isLast && (
                            <div className="ml-[13px] h-6 w-px bg-border" />
                        )}
                    </div>
                )
            })}
        </nav>
    )
}

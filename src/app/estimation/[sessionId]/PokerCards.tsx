"use client"

import { useTransition, useState } from "react"
import { castVote } from "@/app/actions/estimation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const CARD_TOOLTIPS: Record<string, string> = {
    "?": "I can't estimate — more discussion needed",
    "☕": "Let's take a break",
}

export const DECKS: Record<string, string[]> = {
    fibonacci: ["1", "2", "3", "5", "8", "13", "21", "34", "?", "☕"],
    tshirt: ["XS", "S", "M", "L", "XL", "XXL", "?"],
    powers_of_2: ["1", "2", "4", "8", "16", "32", "64", "?"],
}

interface PokerCardsProps {
    roundId: string
    deckType: string
    customDeck: string[]
    selectedValue: string | null
}

export function PokerCards({ roundId, deckType, customDeck, selectedValue: initialSelectedValue }: PokerCardsProps) {
    const [isPending, startTransition] = useTransition()
    const [selectedValue, setSelectedValue] = useState<string | null>(initialSelectedValue)

    const cards =
        deckType === "custom" && customDeck.length > 0
            ? customDeck
            : (DECKS[deckType] ?? DECKS.fibonacci)

    function handleVote(value: string) {
        setSelectedValue(value) // optimistic
        startTransition(async () => {
            try {
                const fd = new FormData()
                fd.append("roundId", roundId)
                fd.append("value", value)
                await castVote(fd)
            } catch {
                setSelectedValue(null) // reset optimistic state
                toast.error("Failed to cast vote — please try again")
            }
        })
    }

    return (
        <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Pick your estimate</p>
            <div className="flex flex-wrap gap-3">
                {cards.map((card) => {
                    const isSelected = card === selectedValue
                    const tooltip = CARD_TOOLTIPS[card]
                    const btn = (
                        <button
                            key={card}
                            onClick={() => handleVote(card)}
                            disabled={isPending}
                            className={cn(
                                "relative flex h-20 w-14 cursor-pointer select-none items-center justify-center rounded-lg border-2 text-lg font-bold shadow-sm transition-all duration-150",
                                "hover:scale-105 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                isSelected
                                    ? "border-primary bg-primary text-primary-foreground scale-105 shadow-md ring-2 ring-primary ring-offset-2"
                                    : "border-border bg-card text-card-foreground hover:border-primary/60",
                                isPending && "opacity-60 pointer-events-none"
                            )}
                        >
                            {card}
                        </button>
                    )
                    if (!tooltip) return btn
                    return (
                        <Tooltip key={card}>
                            <TooltipTrigger asChild>{btn}</TooltipTrigger>
                            <TooltipContent>{tooltip}</TooltipContent>
                        </Tooltip>
                    )
                })}
            </div>
            {selectedValue && (
                <p className="text-xs text-muted-foreground">
                    Your vote: <span className="font-semibold text-foreground">{selectedValue}</span>. Click another card to change.
                </p>
            )}
        </div>
    )
}

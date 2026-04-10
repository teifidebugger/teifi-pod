"use client"

import { useTransition, useState } from "react"
import { setFinalEstimate, getPokerSession } from "@/app/actions/estimation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, RotateCcw } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type SessionSnap = Awaited<ReturnType<typeof getPokerSession>>
type Vote = SessionSnap["rounds"][number]["votes"][number]

interface VoteRevealProps {
    roundId: string
    roundTitle: string
    votes: Vote[]
    isHost: boolean
    finalEstimate: string | null
    taskId?: string | null
    onRevote?: () => void
    onNext?: () => void
}

function initials(name: string | null): string {
    if (!name) return "?"
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

function numericAverage(votes: Vote[]): string | null {
    const nums = votes.map((v) => parseFloat(v.value)).filter((n) => !isNaN(n))
    if (nums.length === 0) return null
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length
    return avg % 1 === 0 ? String(avg) : avg.toFixed(1)
}

export function VoteReveal({ roundId, roundTitle, votes, isHost, finalEstimate, taskId, onRevote, onNext }: VoteRevealProps) {
    const [isPending, startTransition] = useTransition()
    const [estimate, setEstimate] = useState(finalEstimate ?? numericAverage(votes) ?? "")
    const [showZeroVotesWarning, setShowZeroVotesWarning] = useState(false)

    // Group votes by value
    const groups = votes.reduce<Record<string, Vote[]>>((acc, v) => {
        if (!acc[v.value]) acc[v.value] = []
        acc[v.value].push(v)
        return acc
    }, {})

    const sortedValues = Object.keys(groups).sort((a, b) => {
        const na = parseFloat(a)
        const nb = parseFloat(b)
        if (!isNaN(na) && !isNaN(nb)) return na - nb
        return a.localeCompare(b)
    })

    const avg = numericAverage(votes)

    function confirmEstimate() {
        startTransition(async () => {
            await setFinalEstimate(roundId, estimate.trim())
            if (onNext) {
                setTimeout(() => onNext!(), 800)
            }
        })
    }

    function handleSetEstimate() {
        if (!estimate.trim()) return
        if (votes.length === 0) {
            setShowZeroVotesWarning(true)
            return
        }
        confirmEstimate()
    }

    return (
        <div className="space-y-4">
            {finalEstimate && (
                <div className="flex items-center gap-2 rounded-md border-l-2 border-l-green-400 border border-border/50 bg-muted/30 px-3 py-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <div>
                        <span className="text-sm font-medium text-foreground/80">
                            Final estimate: {finalEstimate}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                            {taskId
                                ? "This estimate has been saved to the task's story points"
                                : "Estimate recorded for this round"
                            }
                        </p>
                    </div>
                </div>
            )}

            {avg && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Average:</span>
                    <Badge variant="secondary" className="font-mono text-base px-2 py-0.5">
                        {avg}
                    </Badge>
                </div>
            )}

            {/* Grouped vote cards */}
            <div className="space-y-3">
                {sortedValues.map((value) => (
                    <div key={value} className="flex items-center gap-3">
                        <div className="flex h-14 w-10 flex-shrink-0 items-center justify-center rounded-md border-2 border-primary bg-primary/10 text-base font-bold text-primary">
                            {value}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {groups[value].map((vote) => (
                                <div key={vote.id} className="flex flex-col items-center gap-1">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={vote.participant.member.user.image ?? undefined} />
                                        <AvatarFallback className="text-xs">
                                            {initials(vote.participant.member.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="max-w-[4rem] truncate text-xs text-muted-foreground">
                                        {vote.participant.member.user.name?.split(" ")[0] ?? "?"}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Badge variant="outline" className="ml-auto tabular-nums">
                            {groups[value].length}×
                        </Badge>
                    </div>
                ))}
            </div>

            {votes.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-6 text-center text-muted-foreground">
                    <RotateCcw className="h-8 w-8 opacity-40" />
                    <div>
                        <p className="text-sm font-medium">No votes were cast</p>
                        <p className="text-xs mt-1">Ask the team to vote and reveal again</p>
                    </div>
                    {onRevote && (
                        <Button variant="outline" size="sm" onClick={onRevote}>
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                            Re-vote
                        </Button>
                    )}
                </div>
            )}

            {/* Host: set final estimate + re-vote */}
            {isHost && !finalEstimate && (
                <div className="mt-4 space-y-2">
                    <Card className="border-primary/30 bg-primary/5">
                        <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="text-sm">Set final estimate</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                            <div className="space-y-2">
                                <Input
                                    value={estimate}
                                    onChange={(e) => setEstimate(e.target.value)}
                                    placeholder={avg ?? "e.g. 5"}
                                    className="font-mono text-base h-10"
                                />
                                <Button
                                    className="w-full gap-2"
                                    onClick={handleSetEstimate}
                                    disabled={isPending || !estimate.trim()}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    {isPending ? "Saving…" : "Confirm estimate"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    {onRevote && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={onRevote} disabled={isPending}>
                                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                    Re-vote
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reset votes and let the team vote again</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            )}

            <AlertDialog open={showZeroVotesWarning} onOpenChange={setShowZeroVotesWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>No votes cast</AlertDialogTitle>
                        <AlertDialogDescription>
                            No one has voted on this round. Are you sure you want to confirm without any votes?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowZeroVotesWarning(false)
                                confirmEstimate()
                            }}
                        >
                            Confirm anyway
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

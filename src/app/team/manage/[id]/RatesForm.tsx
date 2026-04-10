"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateMemberRates } from "@/app/actions/team"

const displayRate = (cents: number) => (cents / 100).toFixed(2)
const parseCents = (val: string) => Math.round(parseFloat(val || "0") * 100)

export function RatesForm({ memberId, defaultBillableCents, costRateCents }: {
    memberId: string
    defaultBillableCents: number
    costRateCents: number
}) {
    const [isPending, startTransition] = useTransition()

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
            try {
                await updateMemberRates(memberId, {
                    defaultBillableCents: parseCents(fd.get("defaultBillableCents") as string),
                    costRateCents: parseCents(fd.get("costRateCents") as string),
                })
                toast.success("Rates updated")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) ?? "Failed to update rates")
            }
        })
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card className="border-sidebar-border">
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Billing &amp; Cost Rates
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-1.5">
                        <Label htmlFor="defaultBillableCents">Default Billable Rate ($/hr)</Label>
                        <p className="text-xs text-muted-foreground">
                            Used when logging time unless a project-specific rate override is set.
                        </p>
                        <Input
                            id="defaultBillableCents"
                            name="defaultBillableCents"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={displayRate(defaultBillableCents)}
                            placeholder="0.00"
                            className="max-w-xs"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="costRateCents">Internal Cost Rate ($/hr)</Label>
                        <p className="text-xs text-muted-foreground">
                            Actual cost of this person&apos;s time. Used for profitability reporting.
                        </p>
                        <Input
                            id="costRateCents"
                            name="costRateCents"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={displayRate(costRateCents)}
                            placeholder="0.00"
                            className="max-w-xs"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" size="sm" disabled={isPending}>
                            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                            Save Rates
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}

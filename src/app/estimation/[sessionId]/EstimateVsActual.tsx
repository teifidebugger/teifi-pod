"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart2, ExternalLink } from "lucide-react"

interface RoundComparison {
    roundId: string
    title: string
    linearIssueId: string | null
    linearIssueIdentifier: string | null
    finalEstimate: string | null
    actualHours: number | null
}

interface EstimateVsActualProps {
    comparisons: RoundComparison[]
}

export function EstimateVsActual({ comparisons }: EstimateVsActualProps) {
    const meaningful = comparisons.filter(
        (c) => c.finalEstimate !== null || c.actualHours !== null
    )

    if (meaningful.length === 0) return null

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    Estimate vs Actual
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Issue</TableHead>
                            <TableHead className="text-right">Estimate</TableHead>
                            <TableHead className="text-right">Actual hours</TableHead>
                            <TableHead className="text-right">Variance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {meaningful.map((c) => {
                            const estimateNum = c.finalEstimate !== null ? parseFloat(c.finalEstimate) : null
                            const hasNumericEstimate = estimateNum !== null && !isNaN(estimateNum)
                            const hasActual = c.actualHours !== null

                            let varianceBadge: React.ReactNode = null
                            if (hasNumericEstimate && hasActual) {
                                const diff = c.actualHours! - estimateNum!
                                const pct = estimateNum! > 0 ? Math.round((diff / estimateNum!) * 100) : null
                                const label = pct !== null
                                    ? `${diff >= 0 ? "+" : ""}${pct}%`
                                    : `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}h`
                                varianceBadge = (
                                    <Badge
                                        variant="outline"
                                        className={
                                            diff > 0
                                                ? "text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-900 dark:bg-red-950"
                                                : diff < 0
                                                ? "text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-900 dark:bg-green-950"
                                                : "text-muted-foreground"
                                        }
                                    >
                                        {label}
                                    </Badge>
                                )
                            }

                            return (
                                <TableRow key={c.roundId}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            {c.linearIssueIdentifier && c.linearIssueId && (
                                                <a
                                                    href={`https://linear.app/issue/${c.linearIssueId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground font-mono hover:text-foreground"
                                                >
                                                    {c.linearIssueIdentifier}
                                                    <ExternalLink className="h-2.5 w-2.5" />
                                                </a>
                                            )}
                                            <span className="text-sm">{c.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {c.finalEstimate ?? <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {hasActual
                                            ? `${c.actualHours!.toFixed(1)}h`
                                            : <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {varianceBadge ?? <span className="text-muted-foreground text-sm">—</span>}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

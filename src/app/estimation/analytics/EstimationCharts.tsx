"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

export interface EstimateDistributionDatum {
    estimate: string
    count: number
}

export function EstimateDistributionChart({ data }: { data: EstimateDistributionDatum[] }) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No estimate data yet
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <XAxis
                    dataKey="estimate"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip
                    contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        color: "hsl(var(--foreground))",
                    }}
                    cursor={{ fill: "hsl(var(--muted))" }}
                    formatter={(value: number) => [value, "rounds"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
            </BarChart>
        </ResponsiveContainer>
    )
}

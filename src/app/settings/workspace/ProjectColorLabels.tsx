"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateProjectColorLabels } from "@/app/actions"
import { COLOR_SWATCHES, type ColorKey, DEFAULT_COLOR_LABELS as DEFAULT_LABELS } from "@/lib/project-colors"

type ColorLabel = { key: string; label: string }

function buildLabels(saved: ColorLabel[]): Record<ColorKey, string> {
    const map = new Map(saved.map(c => [c.key, c.label]))
    const result = { ...DEFAULT_LABELS }
    for (const s of COLOR_SWATCHES) {
        if (map.has(s.key)) result[s.key] = map.get(s.key)!
    }
    return result
}

export function ProjectColorLabels({
    saved,
    isAdmin,
}: {
    saved: ColorLabel[]
    isAdmin: boolean
}) {
    const [isPending, startTransition] = useTransition()
    const [labels, setLabels] = useState<Record<ColorKey, string>>(buildLabels(saved))
    const [original] = useState<Record<ColorKey, string>>(buildLabels(saved))

    function handleChange(key: ColorKey, value: string) {
        setLabels(prev => ({ ...prev, [key]: value }))
    }

    function handleReset() {
        setLabels(buildLabels(saved))
    }

    function handleSave() {
        const payload: ColorLabel[] = COLOR_SWATCHES.map(s => ({
            key: s.key,
            label: labels[s.key] || DEFAULT_LABELS[s.key],
        }))
        startTransition(async () => {
            try {
                await updateProjectColorLabels(payload)
                toast.success("Color labels saved")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to save color labels")
            }
        })
    }

    return (
        <Card className="border-sidebar-border">
            <CardHeader>
                <CardTitle>Project Color Labels</CardTitle>
                <CardDescription>
                    Rename these colors to fit your workflow. Colors are used to tag projects on the schedule and in reports.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {COLOR_SWATCHES.map(swatch => (
                        <div key={swatch.key} className="flex items-center gap-2">
                            <div
                                className="w-3.5 h-3.5 rounded-full shrink-0"
                                style={{ backgroundColor: swatch.hex }}
                            />
                            <Input
                                value={labels[swatch.key]}
                                onChange={e => handleChange(swatch.key, e.target.value)}
                                placeholder={DEFAULT_LABELS[swatch.key]}
                                disabled={!isAdmin || isPending}
                                className="h-7 text-sm"
                            />
                        </div>
                    ))}
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-2 pt-3">
                        <Button size="sm" onClick={handleSave} disabled={isPending}>
                            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                            Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleReset} disabled={isPending} className="text-muted-foreground">
                            Reset
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

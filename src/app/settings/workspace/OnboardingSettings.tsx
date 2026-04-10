"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { updateOnboardingSettings } from "@/app/actions/workspace"

interface ProjectOption {
    id: string
    name: string
    code: string | null
    linearTeamKey: string | null
}

interface Props {
    isAdmin: boolean
    onboardingEnabled: boolean
    supportProjectIds: string[]
    projects: ProjectOption[]
}

export function OnboardingSettings({ isAdmin, onboardingEnabled: savedEnabled, supportProjectIds: savedIds, projects }: Props) {
    const [loading, setLoading] = useState(false)
    const [enabled, setEnabled] = useState(savedEnabled)
    const [selectedIds, setSelectedIds] = useState<string[]>(savedIds)
    const [pickerOpen, setPickerOpen] = useState(false)

    function toggleProject(id: string) {
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
    }

    const selectedProjects = projects.filter((p) => selectedIds.includes(p.id))

    async function onSave() {
        if (!isAdmin) return
        setLoading(true)
        try {
            await updateOnboardingSettings({ onboardingEnabled: enabled, supportProjectIds: selectedIds })
            toast.success("Onboarding settings saved")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-sidebar-border">
            <CardHeader>
                <CardTitle>Client Onboarding</CardTitle>
                <CardDescription>
                    {isAdmin
                        ? "Configure the onboarding wizard and support project pools."
                        : "These settings are managed by your workspace admin."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* Enable / disable */}
                <div className="flex items-center justify-between rounded-lg border border-sidebar-border p-3">
                    <div className="space-y-0.5">
                        <Label htmlFor="onboardingEnabled">Enable client onboarding</Label>
                        <p className="text-xs text-muted-foreground">
                            Show the &quot;Onboard Client&quot; button and wizard for admins.
                        </p>
                    </div>
                    <Switch
                        id="onboardingEnabled"
                        checked={enabled}
                        onCheckedChange={setEnabled}
                        disabled={!isAdmin}
                    />
                </div>

                {/* Support projects */}
                <div className="space-y-2">
                    <Label>Support projects</Label>
                    <p className="text-xs text-muted-foreground">
                        Projects whose Linear team will be reused for the Support template. Leave empty to
                        auto-detect teams with a <code className="font-mono">SUP*</code> key.
                    </p>
                    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={pickerOpen}
                                disabled={!isAdmin}
                                className="w-full justify-between border-border/60 font-normal"
                            >
                                {selectedProjects.length > 0
                                    ? `${selectedProjects.length} project${selectedProjects.length > 1 ? "s" : ""} selected`
                                    : "Select support projects…"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search projects…" />
                                <CommandList>
                                    <CommandEmpty>No projects found.</CommandEmpty>
                                    <CommandGroup>
                                        {projects.map((p) => {
                                            const selected = selectedIds.includes(p.id)
                                            return (
                                                <CommandItem
                                                    key={p.id}
                                                    value={`${p.name} ${p.code ?? ""}`}
                                                    onSelect={() => toggleProject(p.id)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4 shrink-0",
                                                            selected ? "opacity-100" : "opacity-0",
                                                        )}
                                                    />
                                                    <span className="flex-1 font-medium">{p.name}</span>
                                                    {p.code && (
                                                        <span className="ml-1.5 text-xs text-muted-foreground font-mono">
                                                            {p.code}
                                                        </span>
                                                    )}
                                                    {p.linearTeamKey && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            [{p.linearTeamKey}]
                                                        </span>
                                                    )}
                                                </CommandItem>
                                            )
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {selectedProjects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {selectedProjects.map((p) => (
                                <Badge key={p.id} variant="secondary" className="gap-1 pr-1 text-xs font-normal">
                                    {p.name}
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => toggleProject(p.id)}
                                            className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                                        >
                                            ×
                                        </button>
                                    )}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <Button onClick={onSave} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Save Settings
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

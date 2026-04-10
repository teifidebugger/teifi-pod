"use client"

import React, { useState, useEffect, useCallback, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Play, Square, Clock as ClockIcon, Activity, Loader2, Link2Off, ChevronsUpDown, Check, X, BatteryLow, BatteryMedium, BatteryFull, Zap, Flame } from "lucide-react"
import { startTimer, stopTimer, logTime } from "@/app/actions/time"
import { toast } from "sonner"

interface Project {
    id: string
    name: string
    code: string | null
    linearTeamId: string | null
    client: { name: string } | null
}

interface LinearIssue {
    id: string
    identifier: string
    title: string
    state: string
    url: string
    teamId: string
}

interface RunningTimer {
    entryId: string
    projectName: string
    timerStartedAt: string
}

interface Props {
    projects: Project[]
    hasLinear: boolean
    timerMode: string // "start_end" | "duration"
    runningTimer: RunningTimer | null
    energyTrackingEnabled?: boolean
}

const ENERGY_OPTIONS: {
    level: number
    label: string
    icon: React.ComponentType<{ className?: string }>
    activeClass: string
}[] = [
    { level: 1, label: "Drained",   icon: BatteryLow,    activeClass: "bg-red-500/15 text-red-500 ring-red-500/40" },
    { level: 2, label: "Low",       icon: BatteryMedium, activeClass: "bg-orange-500/15 text-orange-500 ring-orange-500/40" },
    { level: 3, label: "Normal",    icon: BatteryFull,   activeClass: "bg-yellow-500/15 text-yellow-500 ring-yellow-500/40" },
    { level: 4, label: "Energized", icon: Zap,           activeClass: "bg-lime-500/15 text-lime-500 ring-lime-500/40" },
    { level: 5, label: "Peak",      icon: Flame,         activeClass: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/40" },
]

/**
 * Energy level picker (1–5) — icon-based, no emojis.
 */
function EnergyPicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
    return (
        <div className="flex gap-1">
            {ENERGY_OPTIONS.map(({ level, label, icon: Icon, activeClass }) => (
                <button
                    key={level}
                    type="button"
                    title={label}
                    onClick={() => onChange(level)}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ring-1 ring-transparent
                        ${value === level
                            ? activeClass + " ring-1"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                >
                    <Icon className="h-4 w-4" />
                </button>
            ))}
        </div>
    )
}

/**
 * Client component that handles AJAX issue loading when a project is selected.
 * The parent Server Component handles auth + SSR data.
 */
export function TimerForms({ projects, hasLinear, timerMode, runningTimer, energyTrackingEnabled }: Props) {
    const isDurationMode = timerMode === "duration"
    const [liveProjectId, setLiveProjectId] = useState("")
    const [manualProjectId, setManualProjectId] = useState("")
    const [liveIssues, setLiveIssues] = useState<LinearIssue[]>([])
    const [manualIssues, setManualIssues] = useState<LinearIssue[]>([])
    const [loadingLive, setLoadingLive] = useState(false)
    const [loadingManual, setLoadingManual] = useState(false)

    // State for selected issue (to pass title for auto-task creation)
    const [liveSelectedIssue, setLiveSelectedIssue] = useState<LinearIssue | null>(null)
    const [manualSelectedIssue, setManualSelectedIssue] = useState<LinearIssue | null>(null)

    // Track running timer state locally so it updates after a successful start
    // (the prop is a server snapshot that doesn't change until page re-render)
    const [isTimerRunning, setIsTimerRunning] = useState(runningTimer !== null)
    const [elapsed, setElapsed] = useState(0)

    // Sync with server state when prop changes (e.g., timer stopped from another tab)
    useEffect(() => {
        setIsTimerRunning(runningTimer !== null)
    }, [runningTimer])

    // Live elapsed clock
    useEffect(() => {
        if (!isTimerRunning || !runningTimer?.timerStartedAt) { setElapsed(0); return }
        const startMs = new Date(runningTimer.timerStartedAt).getTime()
        setElapsed(Math.floor((Date.now() - startMs) / 1000))
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - startMs) / 1000)), 1000)
        return () => clearInterval(id)
    }, [isTimerRunning, runningTimer?.timerStartedAt])

    // Energy level state
    const [liveEnergyLevel, setLiveEnergyLevel] = useState<number | null>(null)
    const [manualEnergyLevel, setManualEnergyLevel] = useState<number | null>(null)

    // Error state for timer/log actions
    const [liveError, setLiveError] = useState<string | null>(null)
    const [manualError, setManualError] = useState<string | null>(null)

    // Confirm dialog when switching timers
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)
    const [isPending, startTransition] = useTransition()

    function handleLiveSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        setLiveError(null)
        if (isTimerRunning) {
            setPendingFormData(fd)
            setConfirmOpen(true)
        } else {
            startTransition(async () => {
                try {
                    await startTimer(fd)
                    setIsTimerRunning(true)
                    toast.success("Timer started")
                } catch (err) {
                    setLiveError(err instanceof Error ? err.message : "Failed to start timer")
                }
            })
        }
    }

    function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        setManualError(null)
        startTransition(async () => {
            try {
                await logTime(fd)
                ;(e.target as HTMLFormElement).reset()
                setManualProjectId("")
                setManualSelectedIssue(null)
                setManualIssues([])
                setManualEnergyLevel(null)
                toast.success("Time logged")
            } catch (err) {
                setManualError(err instanceof Error ? err.message : "Failed to log time")
            }
        })
    }

    function handleConfirmSwitch() {
        const fd = pendingFormData
        if (!fd) return
        setConfirmOpen(false)
        setPendingFormData(null)
        // Reset live form fields after switching
        setLiveProjectId("")
        setLiveIssues([])
        setLiveSelectedIssue(null)
        setLiveError(null)
        startTransition(async () => {
            try {
                await startTimer(fd)
                setIsTimerRunning(true)
                toast.success("Timer switched")
            } catch (err) {
                setLiveError(err instanceof Error ? err.message : "Failed to start timer")
            }
        })
    }

    async function handleStop() {
        if (!runningTimer) return
        startTransition(async () => {
            try {
                await stopTimer(runningTimer.entryId)
                setIsTimerRunning(false)
                setElapsed(0)
                toast.success("Timer stopped")
            } catch (err) {
                setLiveError(err instanceof Error ? err.message : "Failed to stop timer")
            }
        })
    }

    // Elapsed time label for confirm dialog
    const elapsedLabel = (() => {
        if (!runningTimer) return ""
        const secs = Math.floor((Date.now() - new Date(runningTimer.timerStartedAt).getTime()) / 1000)
        const h = Math.floor(secs / 3600)
        const m = Math.floor((secs % 3600) / 60)
        return h > 0 ? `${h}h ${m}m` : `${m}m`
    })()

    const fetchIssues = useCallback(async (projectId: string): Promise<LinearIssue[]> => {
        if (!projectId || !hasLinear) return []
        const res = await fetch(`/api/linear/issues?projectId=${projectId}`)
        if (!res.ok) return []
        return res.json()
    }, [hasLinear])

    // Fetch issues when live project changes
    useEffect(() => {
        if (!liveProjectId) { setLiveIssues([]); return }
        setLoadingLive(true)
        setLiveSelectedIssue(null)
        fetchIssues(liveProjectId)
            .then(setLiveIssues)
            .finally(() => setLoadingLive(false))
    }, [liveProjectId, fetchIssues])

    // Fetch issues when manual project changes
    useEffect(() => {
        if (!manualProjectId) { setManualIssues([]); return }
        setLoadingManual(true)
        setManualSelectedIssue(null)
        fetchIssues(manualProjectId)
            .then(setManualIssues)
            .finally(() => setLoadingManual(false))
    }, [manualProjectId, fetchIssues])

    const selectedProject = (id: string) => projects.find(p => p.id === id)

    return (
        <>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Switch timer?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You have a timer running for <strong>{runningTimer?.projectName}</strong>
                        {elapsedLabel ? ` (${elapsedLabel})` : ""}. Starting a new timer will stop it automatically.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep current</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmSwitch} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Stop &amp; start new
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-[1fr_360px] mt-2">
            {/* ── Live Timer ── */}
            <Card className={`gap-3 border-sidebar-border ${isTimerRunning ? "bg-emerald-950/10 dark:bg-emerald-950/20 border-emerald-500/30" : "bg-sidebar/30"}`}>
                <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                        {isTimerRunning ? (
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                        ) : (
                            <Activity className="w-4 h-4 text-primary" />
                        )}
                        Live Timer
                        {isTimerRunning && (
                            <span className="ml-auto text-xs font-normal text-emerald-600 dark:text-emerald-400">Running</span>
                        )}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1.5">
                        {isTimerRunning ? (
                            <>
                                Tracking:{" "}
                                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 text-xs font-medium px-1.5 py-0">
                                    {runningTimer?.projectName}
                                </Badge>
                            </>
                        ) : (
                            "Start tracking time on an active project."
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={startTimer} onSubmit={handleLiveSubmit} className="space-y-3">
                        {/* Hidden issue fields for auto-task creation + LinearIssue cache */}
                        <input type="hidden" name="linearIssueTitle"      value={liveSelectedIssue?.title ?? ""} />
                        <input type="hidden" name="linearIssueIdentifier" value={liveSelectedIssue?.identifier ?? ""} />
                        <input type="hidden" name="linearIssueUrl"        value={liveSelectedIssue?.url ?? ""} />
                        <input type="hidden" name="linearIssueState"      value={liveSelectedIssue?.state ?? ""} />
                        <input type="hidden" name="linearIssueTeamId"     value={liveSelectedIssue?.teamId ?? ""} />

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="live-project" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Project</Label>
                            <ProjectCombobox
                                inputId="live-project"
                                name="projectId"
                                projects={projects}
                                value={liveProjectId}
                                onChange={setLiveProjectId}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="live-desc" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">What are you working on?</Label>
                            <Input id="live-desc" name="description" placeholder="e.g. Fixing header bugs" className="h-9" />
                        </div>

                        {/* Linear issue picker — AJAX loaded when project selected */}
                        {hasLinear && liveProjectId && (
                            <IssueSelect
                                key={liveProjectId}
                                issues={liveIssues}
                                loading={loadingLive}
                                hasMappedTeam={!!selectedProject(liveProjectId)?.linearTeamId}
                                projectId={liveProjectId}
                                fieldName="linearIssueId"
                                inputId="live-linear-issue"
                                onSelect={setLiveSelectedIssue}
                            />
                        )}

                        {energyTrackingEnabled && (
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Energy Level</Label>
                                <input type="hidden" name="energyLevel" value={liveEnergyLevel ?? ""} />
                                <EnergyPicker value={liveEnergyLevel} onChange={setLiveEnergyLevel} />
                            </div>
                        )}

                        {liveError && (
                            <p className="text-xs text-destructive">{liveError}</p>
                        )}
                        <div className="flex items-center justify-between">
                            {isTimerRunning ? (
                                <div className="font-mono text-4xl font-bold tracking-tighter tabular-nums slashed-zero text-emerald-500 dark:text-emerald-400 select-none">
                                    {String(Math.floor(elapsed / 3600)).padStart(2, "0")}:{String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
                                </div>
                            ) : (
                                <div className="text-4xl font-mono tracking-tighter font-bold tabular-nums slashed-zero text-muted-foreground/40 select-none">00:00:00</div>
                            )}
                            {isTimerRunning ? (
                                <Button
                                    type="button"
                                    size="lg"
                                    variant="outline"
                                    disabled={isPending}
                                    onClick={handleStop}
                                    className="rounded-full w-14 h-14 p-0 border-destructive/40 hover:bg-destructive/10 hover:border-destructive text-destructive/70 hover:text-destructive group transition-colors"
                                >
                                    {isPending
                                        ? <Loader2 className="h-5 w-5 animate-spin" />
                                        : <Square className="h-5 w-5 group-hover:scale-110 transition-transform" fill="currentColor" />
                                    }
                                </Button>
                            ) : (
                                <Button type="submit" size="lg" disabled={isPending} className="rounded-full w-14 h-14 p-0 shadow-md group">
                                    {isPending
                                        ? <Loader2 className="h-5 w-5 animate-spin" />
                                        : <Play className="h-5 w-5 ml-0.5 group-hover:scale-110 transition-transform" />
                                    }
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* ── Manual Entry ── */}
            <Card className="gap-3 border-sidebar-border bg-sidebar/30">
                <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ClockIcon className="w-4 h-4 text-primary" /> Manual Entry
                    </CardTitle>
                    <CardDescription className="text-xs">Log past hours directly.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleManualSubmit} className="space-y-3">
                        {/* Hidden issue fields for auto-task creation + LinearIssue cache */}
                        <input type="hidden" name="linearIssueTitle"      value={manualSelectedIssue?.title ?? ""} />
                        <input type="hidden" name="linearIssueIdentifier" value={manualSelectedIssue?.identifier ?? ""} />
                        <input type="hidden" name="linearIssueUrl"        value={manualSelectedIssue?.url ?? ""} />
                        <input type="hidden" name="linearIssueState"      value={manualSelectedIssue?.state ?? ""} />
                        <input type="hidden" name="linearIssueTeamId"     value={manualSelectedIssue?.teamId ?? ""} />

                        <div className="flex gap-3">
                            <div className="flex flex-col gap-1.5 flex-grow">
                                <Label htmlFor="manual-date" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Date</Label>
                                <Input id="manual-date" name="date" type="date" required className="h-9" />
                            </div>
                            <div className="flex flex-col gap-1.5 flex-grow">
                                <Label htmlFor="manual-duration" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Duration (hours)</Label>
                                <Input
                                    id="manual-duration"
                                    name="durationHours"
                                    type="number"
                                    step="0.25"
                                    min="0.25"
                                    placeholder="e.g. 1.5"
                                    required
                                    className="h-9"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="manual-project" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Project</Label>
                            <ProjectCombobox
                                inputId="manual-project"
                                name="projectId"
                                projects={projects}
                                value={manualProjectId}
                                onChange={setManualProjectId}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="manual-desc" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Description</Label>
                            <Input id="manual-desc" name="description" placeholder="Describe your work" className="h-9" />
                        </div>

                        {/* Linear issue picker — AJAX loaded when project selected */}
                        {hasLinear && manualProjectId && (
                            <IssueSelect
                                key={manualProjectId}
                                issues={manualIssues}
                                loading={loadingManual}
                                hasMappedTeam={!!selectedProject(manualProjectId)?.linearTeamId}
                                projectId={manualProjectId}
                                fieldName="linearIssueId"
                                inputId="manual-linear-issue"
                                onSelect={setManualSelectedIssue}
                            />
                        )}

                        {energyTrackingEnabled && (
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Energy Level</Label>
                                <input type="hidden" name="energyLevel" value={manualEnergyLevel ?? ""} />
                                <EnergyPicker value={manualEnergyLevel} onChange={setManualEnergyLevel} />
                            </div>
                        )}

                        {manualError && (
                            <p className="text-xs text-destructive">{manualError}</p>
                        )}
                        <Button type="submit" disabled={isPending} className="w-full mt-2 h-10">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Log Time
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
        </>
    )
}

/**
 * Issue select dropdown with loading state and "no mapping" guidance.
 */
function IssueSelect({
    issues,
    loading,
    hasMappedTeam,
    projectId,
    fieldName,
    inputId,
    onSelect,
}: {
    issues: LinearIssue[]
    loading: boolean
    hasMappedTeam: boolean
    projectId: string
    fieldName: string
    inputId: string
    onSelect: (issue: LinearIssue | null) => void
}) {
    // Hooks must come before any early returns (Rules of Hooks)
    const [selectedId, setSelectedId] = useState("")
    const [open, setOpen] = useState(false)
    const selected = issues.find(i => i.id === selectedId)

    if (!hasMappedTeam) {
        return (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-border p-2.5 text-xs text-muted-foreground">
                <Link2Off className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                    This project has no Linear team mapped.{" "}
                    <a href={`/projects/${projectId}/settings`} className="underline text-primary hover:opacity-80">
                        Configure in settings →
                    </a>
                </span>
            </div>
        )
    }

    function handleSelect(id: string) {
        const newId = id === selectedId ? "" : id
        setSelectedId(newId)
        onSelect(issues.find(i => i.id === newId) ?? null)
        setOpen(false)
    }

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={inputId} className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-[#5E6AD2] flex-shrink-0">
                    <path d="M3.03509 12.9431C3.24245 14.9227 4.10472 16.8468 5.62188 18.364C7.13904 19.8811 9.0631 20.7434 11.0428 20.9508L3.03509 12.9431Z" />
                    <path d="M3 11.4938L12.4921 20.9858C13.2976 20.9407 14.0981 20.7879 14.8704 20.5273L3.4585 9.11548C3.19793 9.88771 3.0451 10.6883 3 11.4938Z" />
                    <path d="M3.86722 8.10999L15.8758 20.1186C16.4988 19.8201 17.0946 19.4458 17.6493 18.9956L4.99021 6.33659C4.54006 6.89125 4.16573 7.487 3.86722 8.10999Z" />
                    <path d="M5.66301 5.59517C9.18091 2.12137 14.8488 2.135 18.3498 5.63604C21.8508 9.13708 21.8645 14.8049 18.3907 18.3228L5.66301 5.59517Z" />
                </svg>
                Linear Issue <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>

            {loading ? (
                <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading issues...
                </div>
            ) : (
                <>
                    <input type="hidden" name={fieldName} value={selectedId} />
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <button
                                id={inputId}
                                type="button"
                                role="combobox"
                                aria-expanded={open}
                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                {selected ? (
                                    <span className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono text-xs text-muted-foreground shrink-0">{selected.identifier}</span>
                                        <span className="truncate">{selected.title}</span>
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">— No Linear issue —</span>
                                )}
                                <span className="flex items-center gap-1 shrink-0 ml-2">
                                    {selectedId && (
                                        <span
                                            role="button"
                                            aria-label="Clear"
                                            onClick={(e) => { e.stopPropagation(); handleSelect("") }}
                                            className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </span>
                                    )}
                                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                                </span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" sideOffset={4}>
                            <Command>
                                <CommandInput placeholder="Search issues..." autoFocus />
                                <CommandList className="max-h-64">
                                    <CommandEmpty>No issues found.</CommandEmpty>
                                    <CommandGroup>
                                        {issues.map(i => (
                                            <CommandItem
                                                key={i.id}
                                                value={`${i.identifier} ${i.title}`}
                                                onSelect={() => handleSelect(i.id)}
                                                className="flex items-center gap-2"
                                            >
                                                <Check className={`h-4 w-4 shrink-0 ${selectedId === i.id ? "opacity-100" : "opacity-0"}`} />
                                                <span className="font-mono text-xs text-muted-foreground shrink-0">{i.identifier}</span>
                                                <span className="truncate flex-1">{i.title}</span>
                                                <span className="text-xs text-muted-foreground shrink-0">{i.state}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </>
            )}
        </div>
    )
}

function ProjectCombobox({
    inputId,
    name,
    projects,
    value,
    onChange,
}: {
    inputId: string
    name: string
    projects: Project[]
    value: string
    onChange: (id: string) => void
}) {
    const [open, setOpen] = useState(false)
    const selected = projects.find(p => p.id === value)

    return (
        <>
            <input type="hidden" name={name} value={value} />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        id={inputId}
                        type="button"
                        role="combobox"
                        aria-expanded={open}
                        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <span className={selected ? "text-foreground truncate" : "text-muted-foreground"}>
                            {selected ? (
                                <span className="flex items-center gap-1.5 min-w-0">
                                    {selected.code && <span className="font-mono text-xs text-muted-foreground shrink-0">[{selected.code}]</span>}
                                    <span className="truncate">{selected.name}</span>
                                    {selected.client && <span className="text-xs text-muted-foreground shrink-0">· {selected.client.name}</span>}
                                </span>
                            ) : "Search projects..."}
                        </span>
                        <span className="flex items-center gap-1 shrink-0 ml-2">
                            {value && (
                                <span
                                    role="button"
                                    aria-label="Clear"
                                    onClick={(e) => { e.stopPropagation(); onChange("") }}
                                    className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </span>
                            )}
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                        </span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" sideOffset={4}>
                    <Command>
                        <CommandInput placeholder="Search projects..." autoFocus />
                        <CommandList>
                            <CommandEmpty>No projects found.</CommandEmpty>
                            <CommandGroup>
                                {projects.map(p => (
                                    <CommandItem
                                        key={p.id}
                                        value={`${p.code ?? ""} ${p.name} ${p.client?.name ?? ""}`}
                                        onSelect={() => { onChange(p.id); setOpen(false) }}
                                        className="flex items-center gap-1.5"
                                    >
                                        <Check className={`h-4 w-4 shrink-0 ${value === p.id ? "opacity-100" : "opacity-0"}`} />
                                        <div className="flex-1 min-w-0">
                                            {p.client && <div className="text-[10px] text-muted-foreground leading-none mb-0.5">{p.client.name}</div>}
                                            <div className="flex items-center gap-1 truncate">
                                                {p.code && <span className="font-mono text-xs text-muted-foreground shrink-0">[{p.code}]</span>}
                                                <span className="truncate">{p.name}</span>
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </>
    )
}

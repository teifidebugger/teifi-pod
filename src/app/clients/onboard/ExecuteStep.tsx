"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Circle, Loader2, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped"

type StepRow = {
    id: string
    status: StepStatus
    result: Record<string, unknown> | null
    error?: string
}

type JobSnap = {
    status: string
    steps: StepRow[]
    result: Record<string, unknown> | null
}

const STEP_LABELS: Record<string, string> = {
    create_client: "Create client",
    find_linear_team: "Find Linear team",
    create_linear_team: "Create Linear team",
    add_members_linear: "Add members to Linear",
    create_linear_project: "Create Linear project",
    create_teifi_project: "Create Teifi project",
    setup_portal: "Set up portal",
    invite_portal_user: "Send portal invite",
    notify_team: "Notify team",
}

function StepIcon({ status }: { status: StepStatus }) {
    if (status === "completed") return <Check className="h-3.5 w-3.5 text-green-500" />
    if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground/60" />
    if (status === "failed") return <X className="h-3.5 w-3.5 text-red-500" />
    if (status === "skipped") return <Check className="h-3.5 w-3.5 text-muted-foreground/40" />
    return <Circle className="h-3.5 w-3.5 text-border" />
}

interface Props {
    jobId: string
    onBack: () => void
}

export function ExecuteStep({ jobId, onBack }: Props) {
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [snap, setSnap] = useState<JobSnap | null>(null)
    const [fetchError, setFetchError] = useState<string | null>(null)

    // 3-second JSON polling (same pattern as SessionRoom.tsx — no SSE, Neon has no LISTEN/NOTIFY)
    async function fetchSnapshot() {
        try {
            const res = await fetch(`/api/v1/onboarding/${jobId}`)
            if (res.ok) {
                const data = (await res.json()) as JobSnap
                setSnap(data)
                setFetchError(null)
                // Stop polling once terminal state reached
                if (data.status === "completed" || data.status === "failed") return
            }
        } catch {
            setFetchError("Network error — retrying…")
        }
        schedulePoll()
    }

    function schedulePoll() {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
        pollTimerRef.current = setTimeout(fetchSnapshot, 3000)
    }

    useEffect(() => {
        void fetchSnapshot()
        return () => {
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const isDone = snap?.status === "completed"
    const isFailed = snap?.status === "failed"
    const failedStep = snap?.steps.find((s) => s.status === "failed")

    // Client ID comes from job result (set by runOnboardingJob on completion)
    const clientId = snap?.result?.clientId as string | undefined
    // Teifi project ID is stored in the create_teifi_project step result
    const projectId = snap?.steps.find((s) => s.id === "create_teifi_project")?.result
        ?.projectId as string | undefined

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">Running onboarding</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Job <span className="font-mono text-xs text-foreground/70">{jobId}</span>
                </p>
            </div>

            {/* Step list */}
            <div className="rounded-lg border border-border/50 bg-muted/10 px-5 py-4 flex flex-col gap-3">
                {snap ? (
                    snap.steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-3">
                            <StepIcon status={step.status} />
                            <span
                                className={`text-sm ${
                                    step.status === "running"
                                        ? "font-medium text-foreground"
                                        : step.status === "completed"
                                          ? "text-foreground"
                                          : step.status === "failed"
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-muted-foreground"
                                }`}
                            >
                                {STEP_LABELS[step.id] ?? step.id}
                            </span>
                            {step.status === "skipped" && (
                                <span className="text-xs text-muted-foreground">(skipped)</span>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading…
                    </div>
                )}
            </div>

            {fetchError && (
                <p className="text-xs text-muted-foreground">{fetchError}</p>
            )}

            {/* Success banner */}
            {isDone && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-2 border-l-2 border-l-green-500 border border-border/50 bg-muted/30 px-4 py-2.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                        <p className="text-sm text-foreground/80">
                            Onboarding complete. Client and project are ready.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {clientId && (
                            <Button variant="outline" asChild className="border-border/60">
                                <Link href={`/clients/${clientId}`}>View Client</Link>
                            </Button>
                        )}
                        {projectId && (
                            <Button variant="outline" asChild className="border-border/60">
                                <Link href={`/projects/${projectId}`}>View Project</Link>
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Error banner */}
            {isFailed && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-2 border-l-2 border-l-red-500 border border-border/50 bg-muted/30 px-4 py-2.5">
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                        <p className="text-sm text-foreground/80">
                            {failedStep?.error ?? "Onboarding job failed."}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onBack} className="border-border/60">
                            ← Go back and fix
                        </Button>
                        <Button
                            variant="ghost"
                            asChild
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <Link href="/clients">Continue manually</Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

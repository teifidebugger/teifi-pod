"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle2, Loader2, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { checkLinearAuth } from "@/app/actions/onboarding"
import type { WizardState, SUPTeam, MemberOption } from "./OnboardingWizard"

interface Props {
    state: WizardState
    supTeams: SUPTeam[]
    members: MemberOption[]
    onEdit: () => void
    onRun: () => Promise<void>
}

function ManifestRow({ label, value, isNew }: { label: string; value: string; isNew?: boolean }) {
    return (
        <div className="flex items-start gap-3 py-2">
            <span className="w-28 shrink-0 text-xs text-muted-foreground pt-0.5">{label}</span>
            {isNew ? (
                <span className="text-sm text-green-600 dark:text-green-400">{value}</span>
            ) : (
                <span className="text-sm text-foreground">{value}</span>
            )}
        </div>
    )
}

function ManifestSection({
    title,
    children,
    onEdit,
}: {
    title: string
    children: React.ReactNode
    onEdit: () => void
}) {
    return (
        <div className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {title}
                </p>
                <button
                    type="button"
                    onClick={onEdit}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    Edit
                </button>
            </div>
            <div>{children}</div>
        </div>
    )
}

export function ReviewStep({ state, supTeams, members, onEdit, onRun }: Props) {
    const [running, setRunning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [authStatus, setAuthStatus] = useState<"checking" | "valid" | "invalid">("checking")
    const [authError, setAuthError] = useState<string | null>(null)

    useEffect(() => {
        checkLinearAuth().then((res) => {
            setAuthStatus(res.valid ? "valid" : "invalid")
            setAuthError(res.error ?? null)
        })
    }, [])

    async function handleRun() {
        setRunning(true)
        setError(null)
        try {
            await onRun()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to start onboarding job")
            setRunning(false)
        }
    }

    const activeSUP = state.linearTeamId
        ? supTeams.find((t) => t.id === state.linearTeamId)
        : supTeams.length > 0
          ? supTeams.slice().sort((a, b) => a.projectCount - b.projectCount)[0]
          : null

    const selectedMembers = members.filter((m) => state.memberIds.includes(m.id))

    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold tracking-tight">Review</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Confirm the details before running the onboarding workflow.
                </p>
            </div>

            {/* Linear auth pre-flight */}
            {authStatus === "checking" && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking Linear service account…
                </div>
            )}
            {authStatus === "invalid" && (
                <div className="mb-4 flex items-start gap-2 border-l-2 border-l-red-400 border border-border/50 bg-muted/30 px-4 py-2.5">
                    <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                    <p className="text-sm text-foreground/80">
                        <span className="font-medium text-foreground">Linear service account invalid.</span>{" "}
                        {authError ?? "Set LINEAR_SERVICE_ACCOUNT_API_KEY to enable workflow execution."}
                    </p>
                </div>
            )}
            {authStatus === "valid" && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    Linear service account connected
                </div>
            )}

            {/* Amber warning banner */}
            <div className="mb-5 flex items-start gap-2 border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 px-4 py-2.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <p className="text-sm text-foreground/80">
                    This will create real records in Linear and the Teifi database. Review carefully
                    before running.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 flex items-start gap-2 border-l-2 border-l-red-400 border border-border/50 bg-muted/30 px-4 py-2.5">
                    <p className="text-sm text-foreground/80">{error}</p>
                </div>
            )}

            {/* Manifest */}
            <div className="rounded-lg border border-border/50 bg-muted/10 px-5 py-4 divide-y divide-border/40">
                {/* CLIENT */}
                <ManifestSection title="Client" onEdit={onEdit}>
                    <ManifestRow label="Name" value={state.clientName || "—"} />
                </ManifestSection>

                {/* LINEAR TEAM */}
                <ManifestSection title="Linear Team" onEdit={onEdit}>
                    {state.template === "support" ? (
                        <ManifestRow
                            label="Team"
                            value={
                                activeSUP
                                    ? `${activeSUP.key} — ${activeSUP.projectCount}/20 projects`
                                    : "Auto-select"
                            }
                        />
                    ) : (
                        <>
                            <ManifestRow
                                label="Name"
                                value={state.linearTeamName ? `${state.linearTeamName} (new)` : "—"}
                                isNew={!!state.linearTeamName}
                            />
                            <ManifestRow label="Key" value={state.linearTeamKey || "—"} />
                        </>
                    )}
                </ManifestSection>

                {/* LINEAR PROJECT */}
                <ManifestSection title="Linear Project" onEdit={onEdit}>
                    <ManifestRow label="Name" value={state.projectName || "—"} />
                </ManifestSection>

                {/* TEIFI PROJECT */}
                <ManifestSection title="Teifi Project" onEdit={onEdit}>
                    <ManifestRow label="Name" value={state.projectName || "—"} />
                </ManifestSection>

                {/* PORTAL SETUP */}
                <ManifestSection title="Portal Setup" onEdit={onEdit}>
                    <ManifestRow
                        label="Linear link"
                        value={
                            activeSUP
                                ? `Link ${activeSUP.key} to client`
                                : state.linearTeamName
                                  ? `Link ${state.linearTeamName} to client`
                                  : "—"
                        }
                    />
                </ManifestSection>

                {/* PORTAL INVITE */}
                <ManifestSection title="Portal Invite" onEdit={onEdit}>
                    <ManifestRow label="Email" value={state.portalUserEmail || "—"} />
                </ManifestSection>

                {/* TEAM MEMBERS */}
                <ManifestSection title="Team Members" onEdit={onEdit}>
                    <ManifestRow
                        label="Members"
                        value={
                            selectedMembers.length > 0
                                ? selectedMembers.map((m) => m.name).join(", ")
                                : "—"
                        }
                    />
                </ManifestSection>
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between">
                <Button variant="outline" onClick={onEdit} className="border-border/60">
                    ← Edit Details
                </Button>
                <Button onClick={handleRun} disabled={running || authStatus !== "valid"}>
                    {running ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Starting…
                        </>
                    ) : (
                        "▶ Run Workflow"
                    )}
                </Button>
            </div>
        </div>
    )
}

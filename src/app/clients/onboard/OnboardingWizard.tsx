"use client"

import { useState } from "react"
import { StepIndicator } from "./StepIndicator"
import { TemplateStep } from "./TemplateStep"
import { DetailsStep } from "./DetailsStep"
import { ReviewStep } from "./ReviewStep"
import { ExecuteStep } from "./ExecuteStep"
import { startOnboardingJob, type OnboardingInput } from "@/app/actions/onboarding"

// ─── Types ─────────────────────────────────────────────────────────────────

export type WizardStep = "template" | "details" | "review" | "execute"

export interface WizardState {
    template: "support" | "standard"
    // Client
    clientName: string
    clientEmail: string
    // Linear setup
    linearTeamId: string       // support: existing team id
    linearTeamName: string     // standard: new team name
    linearTeamKey: string      // standard: new team key
    linearProjectName: string  // name of the Linear project to create
    // Teifi project
    projectName: string
    billingType: string
    budgetHours: string
    // Members (WorkspaceMember IDs — all members, with or without Linear)
    memberIds: string[]
    // Portal
    portalUserEmail: string
}

export interface SUPTeam {
    id: string
    key: string
    name: string
    projectCount: number
}

export interface MemberOption {
    id: string          // WorkspaceMember.id
    name: string
    email: string
    linearId: string | null  // Linear user ID (null if not connected)
}

// ─── Default wizard state ──────────────────────────────────────────────────

const DEFAULT_STATE: WizardState = {
    template: "support",
    clientName: "",
    clientEmail: "",
    linearTeamId: "",
    linearTeamName: "",
    linearTeamKey: "",
    linearProjectName: "",
    projectName: "",
    billingType: "TIME_AND_MATERIALS",
    budgetHours: "",
    memberIds: [],
    portalUserEmail: "",
}

// ─── Wizard ────────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
    members: MemberOption[]
    supTeams: SUPTeam[]
}

export function OnboardingWizard({ members, supTeams }: OnboardingWizardProps) {
    const [step, setStep] = useState<WizardStep>("template")
    const [state, setState] = useState<WizardState>(DEFAULT_STATE)
    const [jobId, setJobId] = useState<string | null>(null)

    function patch(update: Partial<WizardState>) {
        setState((prev) => ({ ...prev, ...update }))
    }

    function goToStep(next: WizardStep) {
        setStep(next)
    }

    async function handleRun() {
        const input: OnboardingInput = {
            template: state.template,
            clientName: state.clientName.trim(),
            clientEmail: state.clientEmail.trim() || undefined,
            linearProjectName: state.linearProjectName.trim() || state.projectName.trim(),
            projectName: state.projectName.trim(),
            billingType: state.billingType,
            budgetHours: state.budgetHours ? Number(state.budgetHours) : undefined,
            memberIds: state.memberIds,
            portalUserEmail: state.portalUserEmail.trim() || undefined,
            ...(state.template === "support" && state.linearTeamId
                ? { linearTeamId: state.linearTeamId }
                : {}),
            ...(state.template === "standard"
                ? {
                      linearTeamName: state.linearTeamName.trim(),
                      linearTeamKey: state.linearTeamKey.trim(),
                  }
                : {}),
        }
        const { jobId: id } = await startOnboardingJob(input)
        setJobId(id)
        goToStep("execute")
    }

    return (
        <div className="flex gap-12">
            <aside className="pt-1">
                <StepIndicator current={step} />
            </aside>

            <div className="flex-1 max-w-xl">
                {step === "template" && (
                    <TemplateStep
                        state={state}
                        supTeams={supTeams}
                        onNext={(p) => {
                            patch(p)
                            goToStep("details")
                        }}
                    />
                )}

                {step === "details" && (
                    <DetailsStep
                        state={state}
                        supTeams={supTeams}
                        members={members}
                        onChange={patch}
                        onNext={() => goToStep("review")}
                        onBack={() => goToStep("template")}
                    />
                )}

                {step === "review" && (
                    <ReviewStep
                        state={state}
                        supTeams={supTeams}
                        members={members}
                        onEdit={() => goToStep("details")}
                        onRun={handleRun}
                    />
                )}

                {step === "execute" && jobId && (
                    <ExecuteStep jobId={jobId} onBack={() => goToStep("details")} />
                )}
            </div>
        </div>
    )
}

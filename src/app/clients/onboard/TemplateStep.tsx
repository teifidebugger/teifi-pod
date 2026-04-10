import type { WizardState, SUPTeam } from "./OnboardingWizard"

interface Props {
    state: WizardState
    supTeams: SUPTeam[]
    onNext: (patch: Partial<WizardState>) => void
}

export function TemplateStep({ state, supTeams, onNext }: Props) {
    // Best SUP = team with fewest projects (most capacity remaining)
    const bestSUP =
        supTeams.length > 0
            ? supTeams.slice().sort((a, b) => a.projectCount - b.projectCount)[0]
            : null
    const supAtCapacity = bestSUP ? bestSUP.projectCount >= 20 : false

    function handleSelect(template: "support" | "standard") {
        onNext({ template })
    }

    function handleKeyDown(e: React.KeyboardEvent, template: "support" | "standard") {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleSelect(template)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">Choose a template</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Select the onboarding template that fits this client.
                </p>
            </div>

            <div className="flex gap-4">
                {/* Support Project card */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect("support")}
                    onKeyDown={(e) => handleKeyDown(e, "support")}
                    className={`flex-1 cursor-pointer rounded-lg border p-5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        state.template === "support"
                            ? "border-foreground/40 bg-muted/20 ring-1 ring-foreground/10"
                            : "border-border/40 bg-card hover:border-border hover:bg-muted/20"
                    }`}
                >
                    <p className="font-medium">Support Project</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Reuse an existing SUP* Linear team
                    </p>
                    {bestSUP && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            {bestSUP.key} — {bestSUP.projectCount}/20 projects
                        </p>
                    )}
                    {supAtCapacity && (
                        <div className="mt-3 border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 px-3 py-2 text-xs text-foreground/80">
                            All SUP teams are at capacity (20/20)
                        </div>
                    )}
                </div>

                {/* Standard Project card */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect("standard")}
                    onKeyDown={(e) => handleKeyDown(e, "standard")}
                    className={`flex-1 cursor-pointer rounded-lg border p-5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        state.template === "standard"
                            ? "border-foreground/40 bg-muted/20 ring-1 ring-foreground/10"
                            : "border-border/40 bg-card hover:border-border hover:bg-muted/20"
                    }`}
                >
                    <p className="font-medium">Standard Project</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Create a new Linear team and project from scratch
                    </p>
                </div>
            </div>
        </div>
    )
}

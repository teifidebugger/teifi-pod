"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Info, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { WizardState, SUPTeam, MemberOption } from "./OnboardingWizard"

interface Props {
    state: WizardState
    supTeams: SUPTeam[]
    members: MemberOption[]
    onChange: (patch: Partial<WizardState>) => void
    onNext: () => void
    onBack: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {children}
        </p>
    )
}

export function DetailsStep({ state, supTeams, members, onChange, onNext, onBack }: Props) {
    const [memberPickerOpen, setMemberPickerOpen] = useState(false)

    const bestSUP =
        supTeams.length > 0
            ? supTeams.slice().sort((a, b) => a.projectCount - b.projectCount)[0]
            : null
    const activeSUP = state.linearTeamId
        ? (supTeams.find((t) => t.id === state.linearTeamId) ?? bestSUP)
        : bestSUP

    function handleTeamNameChange(value: string) {
        const key = value
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 5)
        onChange({ linearTeamName: value, linearTeamKey: key })
    }

    function toggleMember(memberId: string) {
        const next = state.memberIds.includes(memberId)
            ? state.memberIds.filter((id) => id !== memberId)
            : [...state.memberIds, memberId]
        onChange({ memberIds: next })
    }

    const selectedMembers = members.filter((m) => state.memberIds.includes(m.id))

    const isValid =
        state.clientName.trim() &&
        state.projectName.trim() &&
        (state.template === "support"
            ? true
            : state.linearTeamName.trim() && state.linearTeamKey.trim())

    return (
        <div className="flex flex-col">
            <div className="mb-6">
                <h2 className="text-lg font-semibold tracking-tight">Client details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Fill in the details for the new client.
                </p>
            </div>

            {/* ── Section 1: CLIENT ── */}
            <div className="border-t border-border/40 py-5">
                <SectionLabel>Client</SectionLabel>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="clientName">
                            Client name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="clientName"
                            placeholder="Acme Corp"
                            value={state.clientName}
                            onChange={(e) => onChange({ clientName: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="clientEmail">
                            Client email{" "}
                            <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                            id="clientEmail"
                            type="email"
                            placeholder="contact@acme.com"
                            value={state.clientEmail}
                            onChange={(e) => onChange({ clientEmail: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* ── Section 2: LINEAR SETUP ── */}
            <div className="border-t border-border/40 py-5">
                <SectionLabel>Linear Setup</SectionLabel>
                {state.template === "support" ? (
                    <div className="flex flex-col gap-4">
                        {activeSUP && (
                            <div className="flex items-start gap-2 border-l-2 border-l-blue-400 border border-border/50 bg-muted/30 px-3 py-2.5">
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                                <p className="text-sm text-foreground/80">
                                    Reusing Linear team{" "}
                                    <span className="font-medium text-foreground">
                                        {activeSUP.key}
                                    </span>{" "}
                                    ({activeSUP.projectCount}/20 projects)
                                </p>
                            </div>
                        )}
                        {supTeams.length > 1 && (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="linearTeamId">Linear team</Label>
                                <Select
                                    value={state.linearTeamId || "__auto__"}
                                    onValueChange={(v) =>
                                        onChange({ linearTeamId: v === "__auto__" ? "" : v })
                                    }
                                >
                                    <SelectTrigger id="linearTeamId">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__auto__">
                                            Auto-select (fewest projects)
                                        </SelectItem>
                                        {supTeams.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                [{t.key}] {t.name} — {t.projectCount} projects
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="linearProjectName">
                                Linear project name{" "}
                                <span className="font-normal text-muted-foreground">(optional)</span>
                            </Label>
                            <Input
                                id="linearProjectName"
                                placeholder={state.projectName || "Acme Support"}
                                value={state.linearProjectName}
                                onChange={(e) => onChange({ linearProjectName: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave blank to use the project name above
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="linearTeamName">
                                Linear team name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="linearTeamName"
                                placeholder="Acme"
                                value={state.linearTeamName}
                                onChange={(e) => handleTeamNameChange(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="linearTeamKey">
                                Team key <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="linearTeamKey"
                                placeholder="ACME"
                                maxLength={5}
                                value={state.linearTeamKey}
                                onChange={(e) =>
                                    onChange({
                                        linearTeamKey: e.target.value
                                            .toUpperCase()
                                            .replace(/[^A-Z0-9]/g, "")
                                            .slice(0, 5),
                                    })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Uppercase, max 5 characters. Must be unique in your Linear workspace.
                            </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="linearProjectName">
                                Linear project name{" "}
                                <span className="font-normal text-muted-foreground">(optional)</span>
                            </Label>
                            <Input
                                id="linearProjectName"
                                placeholder={state.projectName || "Acme Portal"}
                                value={state.linearProjectName}
                                onChange={(e) => onChange({ linearProjectName: e.target.value })}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Section 3: PROJECT ── */}
            <div className="border-t border-border/40 py-5">
                <SectionLabel>Teifi Project</SectionLabel>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="projectName">
                            Project name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="projectName"
                            placeholder="Acme Portal"
                            value={state.projectName}
                            onChange={(e) => onChange({ projectName: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="billingType">Billing type</Label>
                        <Select
                            value={state.billingType}
                            onValueChange={(v) => onChange({ billingType: v })}
                        >
                            <SelectTrigger id="billingType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TIME_AND_MATERIALS">Time & Materials</SelectItem>
                                <SelectItem value="FIXED_FEE">Fixed Fee</SelectItem>
                                <SelectItem value="NON_BILLABLE">Non-Billable</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="budgetHours">
                            Budget hours{" "}
                            <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                            id="budgetHours"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="100"
                            value={state.budgetHours}
                            onChange={(e) => onChange({ budgetHours: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* ── Section 4: TEAM MEMBERS ── */}
            {members.length > 0 && (
                <div className="border-t border-border/40 py-5">
                    <SectionLabel>Team members</SectionLabel>
                    <Popover open={memberPickerOpen} onOpenChange={setMemberPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={memberPickerOpen}
                                className="w-full justify-between border-border/60 font-normal"
                            >
                                {selectedMembers.length > 0
                                    ? `${selectedMembers.length} member${selectedMembers.length > 1 ? "s" : ""} selected`
                                    : "Select team members…"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-[--radix-popover-trigger-width] p-0"
                            align="start"
                        >
                            <Command>
                                <CommandInput placeholder="Search by name or email…" />
                                <CommandList>
                                    <CommandEmpty>No members found.</CommandEmpty>
                                    <CommandGroup>
                                        {members.map((m) => {
                                            const selected = state.memberIds.includes(m.id)
                                            return (
                                                <CommandItem
                                                    key={m.id}
                                                    value={`${m.name} ${m.email}`}
                                                    onSelect={() => toggleMember(m.id)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4 shrink-0",
                                                            selected ? "opacity-100" : "opacity-0",
                                                        )}
                                                    />
                                                    <span className="flex-1 font-medium">
                                                        {m.name}
                                                    </span>
                                                    <span className="ml-1.5 text-xs text-muted-foreground">
                                                        {m.email}
                                                    </span>
                                                    {m.linearId ? (
                                                        <Wifi className="ml-2 h-3 w-3 text-muted-foreground/50" />
                                                    ) : (
                                                        <WifiOff className="ml-2 h-3 w-3 text-muted-foreground/30" aria-label="No Linear account connected" />
                                                    )}
                                                </CommandItem>
                                            )
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {selectedMembers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {selectedMembers.map((m) => (
                                <Badge
                                    key={m.id}
                                    variant="secondary"
                                    className="gap-1 pr-1 text-xs font-normal"
                                >
                                    {m.name}
                                    {!m.linearId && (
                                        <span className="text-muted-foreground/60" title="No Linear account">
                                            ·
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => toggleMember(m.id)}
                                        className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {selectedMembers.some((m) => !m.linearId) && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <WifiOff className="h-3 w-3" />
                            Members without Linear connected will be assigned to the Teifi project
                            only.
                        </p>
                    )}
                </div>
            )}

            {/* ── Section 5: PORTAL ── */}
            <div className="border-t border-border/40 py-5">
                <SectionLabel>Portal</SectionLabel>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="portalUserEmail">
                        Portal user email{" "}
                        <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                        id="portalUserEmail"
                        type="email"
                        placeholder="client@acme.com"
                        value={state.portalUserEmail}
                        onChange={(e) => onChange({ portalUserEmail: e.target.value })}
                    />
                </div>
            </div>

            {/* ── Navigation ── */}
            <div className="border-t border-border/40 pt-5 flex justify-between">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!isValid}
                    className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-40"
                >
                    Review & Confirm
                </button>
            </div>
        </div>
    )
}

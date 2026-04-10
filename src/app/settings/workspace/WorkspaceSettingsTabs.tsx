"use client"

import { WorkspaceSettingsForm } from "./WorkspaceSettingsForm"
import { ProjectColorLabels } from "./ProjectColorLabels"
import { SidebarVisibilitySettings } from "./SidebarVisibilitySettings"

interface WorkspaceData {
    id: string
    name: string
    currency: string
    timeFormat: string
    weekStartDay: number
    requireTimeEntryNotes: boolean
    timeRounding: number
    defaultCapacityHours: number
    timerMode: string
    reminderEnabled: boolean
    reminderTime: string
    reminderDays: string
    energyTrackingEnabled: boolean
    hiddenNavItems: string[]
    onboardingEnabled: boolean
    supportProjectIds: unknown
}

interface Props {
    workspace: WorkspaceData
    isAdmin: boolean
    colorLabels: Array<{ key: string; label: string }>
}

export function WorkspaceSettingsTabs({ workspace, isAdmin, colorLabels }: Props) {
    return (
        <div className="space-y-4">
            <WorkspaceSettingsForm workspace={workspace} isAdmin={isAdmin} />
            <ProjectColorLabels saved={colorLabels} isAdmin={isAdmin} />
            <SidebarVisibilitySettings isAdmin={isAdmin} saved={workspace.hiddenNavItems} />
        </div>
    )
}

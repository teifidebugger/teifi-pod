"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember } from "@/app/actions"
import { revalidatePath } from "next/cache"
import { DEFAULT_ACCEPTANCE_FIELDS, getDefaultFieldsForType, parseTemplateFields } from "@/lib/portal-acceptance-fields"
import type { AcceptanceIssueField, IssueTemplateType } from "@/lib/portal-acceptance-fields"

export async function getPortalAcceptanceFields(teamId?: string): Promise<AcceptanceIssueField[]> {
    // Resolve workspaceId — works for both workspace members and portal users
    let workspaceId: string
    try {
        const { member } = await getSessionMember()
        workspaceId = member.workspaceId
    } catch {
        // Portal user — resolve workspace via LinearTeam if teamId provided
        if (!teamId) return DEFAULT_ACCEPTANCE_FIELDS
        const team = await prisma.linearTeam.findUnique({
            where: { id: teamId },
            select: { workspaceId: true },
        })
        if (!team) return DEFAULT_ACCEPTANCE_FIELDS
        workspaceId = team.workspaceId
    }

    // 1. Team's selected template
    if (teamId) {
        const teamSettings = await prisma.clientTeamSettings.findFirst({
            where: { linearTeamId: teamId, client: { workspaceId } },
            select: { acceptanceTemplate: { select: { fields: true } } },
        })
        const fields = teamSettings?.acceptanceTemplate?.fields
        const parsed = parseTemplateFields(fields)
        if (parsed.length > 0) return parsed
    }

    // 2. Workspace default template
    const defaultTemplate = await prisma.workspaceAcceptanceTemplate.findFirst({
        where: { workspaceId, isDefault: true },
        select: { fields: true },
    })
    const defaultParsed = parseTemplateFields(defaultTemplate?.fields)
    if (defaultParsed.length > 0) return defaultParsed

    // 3. Hard-coded constant (safety net — no templates configured yet)
    return DEFAULT_ACCEPTANCE_FIELDS
}

export async function getPortalIssueTemplateFields(teamId: string, templateType: IssueTemplateType): Promise<AcceptanceIssueField[]> {
    let workspaceId: string
    try {
        const { member } = await getSessionMember()
        workspaceId = member.workspaceId
    } catch {
        const team = await prisma.linearTeam.findUnique({ where: { id: teamId }, select: { workspaceId: true } })
        if (!team) return getDefaultFieldsForType(templateType)
        workspaceId = team.workspaceId
    }

    const template = await prisma.workspaceAcceptanceTemplate.findFirst({
        where: { workspaceId, templateType, isDefault: true },
        select: { fields: true },
    })
    const parsed = parseTemplateFields(template?.fields)
    if (parsed.length > 0) return parsed

    return getDefaultFieldsForType(templateType)
}

export async function updateWorkspaceSettings(data: {
    name?: string
    currency?: string
    timeFormat?: string
    weekStartDay?: number
    requireTimeEntryNotes?: boolean
    timeRounding?: number
    defaultCapacityHours?: number
    timerMode?: string
    reminderEnabled?: boolean
    reminderTime?: string
    reminderDays?: string
    energyTrackingEnabled?: boolean
}) {
    const { member } = await getSessionMember()

    if (member.role !== "OWNER") throw new Error("Only Owners can update workspace settings")

    if (data.timeRounding !== undefined && ![0, 6, 15, 30].includes(data.timeRounding)) {
        throw new Error("Invalid time rounding interval")
    }
    if (data.weekStartDay !== undefined && ![0, 1].includes(data.weekStartDay)) {
        throw new Error("Invalid week start day")
    }
    if (data.reminderTime !== undefined && data.reminderTime !== "" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.reminderTime)) {
        throw new Error("reminderTime must be in HH:MM 24-hour format")
    }

    await prisma.workspace.update({
        where: { id: member.workspaceId },
        data: {
            ...(data.name ? { name: data.name } : {}),
            ...(data.currency ? { currency: data.currency } : {}),
            ...(data.timeFormat ? { timeFormat: data.timeFormat } : {}),
            ...(data.weekStartDay !== undefined ? { weekStartDay: data.weekStartDay } : {}),
            ...(data.requireTimeEntryNotes !== undefined ? { requireTimeEntryNotes: data.requireTimeEntryNotes } : {}),
            ...(data.timeRounding !== undefined ? { timeRounding: data.timeRounding } : {}),
            ...(data.defaultCapacityHours !== undefined ? { defaultCapacityHours: data.defaultCapacityHours } : {}),
            ...(data.timerMode ? { timerMode: data.timerMode } : {}),
            ...(data.reminderEnabled !== undefined ? { reminderEnabled: data.reminderEnabled } : {}),
            ...(data.reminderTime ? { reminderTime: data.reminderTime } : {}),
            ...(data.reminderDays !== undefined ? { reminderDays: data.reminderDays } : {}),
            ...(data.energyTrackingEnabled !== undefined ? { energyTrackingEnabled: data.energyTrackingEnabled } : {}),
        },
    })

    revalidatePath("/settings/workspace")
}

export async function updateHiddenNavItems(items: string[]) {
    const { member } = await getSessionMember()
    if (member.role !== "OWNER") throw new Error("Only Owners can configure navigation visibility")

    await prisma.workspace.update({
        where: { id: member.workspaceId },
        data: { hiddenNavItems: items },
    })

    revalidatePath("/", "layout")
    revalidatePath("/settings/workspace")
}

export async function updateOnboardingSettings(data: {
    onboardingEnabled: boolean
    supportProjectIds: string[]
}) {
    const { member } = await getSessionMember()
    if (member.role !== "OWNER") throw new Error("Only Owners can update workspace settings")

    await prisma.workspace.update({
        where: { id: member.workspaceId },
        data: {
            onboardingEnabled: data.onboardingEnabled,
            supportProjectIds: data.supportProjectIds,
        },
    })

    revalidatePath("/settings/workspace")
    revalidatePath("/clients")
}

export async function updateProjectColorLabels(labels: Array<{ key: string; label: string }>) {
    const { member } = await getSessionMember()
    if (member.role !== "OWNER") throw new Error("Only Owners can manage project color labels")

    await prisma.workspace.update({
        where: { id: member.workspaceId },
        data: { projectColorLabels: labels },
    })

    revalidatePath("/settings/workspace")
    revalidatePath("/projects")
}

/**
 * Updates the Linear team mapping for a project.
 * Only OWNER, ADMIN, MANAGER roles can do this.
 * The user must also have a connected Linear account (token must exist).
 */
export async function updateProjectLinearTeam(formData: FormData) {
    const projectId = formData.get("projectId") as string
    // Empty string means "disconnect"
    const linearTeamId = (formData.get("linearTeamId") as string) || null
    // Optional project refinement within the team
    const linearProjectId = (formData.get("linearProjectId") as string) || null
    const linearProjectName = (formData.get("linearProjectName") as string) || null

    if (!projectId) return

    const { user, member } = await getSessionMember()

    // Only Admin+ roles can manage project-team mapping
    const allowedRoles = ["OWNER", "ADMIN", "MANAGER"]
    if (!allowedRoles.includes(member.role)) {
        throw new Error("Insufficient permissions: Admin or Manager role required")
    }

    // If mapping to a team, verify the user has a Linear token (they must be connected)
    if (linearTeamId) {
        const token = await prisma.linearUserToken.findFirst({ where: { userId: user.id } })
        if (!token) {
            throw new Error("You must connect your Linear account before mapping a team")
        }
    }

    // Verify project belongs to this workspace
    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: member.workspaceId },
    })
    if (!project) throw new Error("Project not found")

    await prisma.teifiProject.update({
        where: { id: projectId },
        data: {
            linearTeamId,
            // Clear project mapping when team is cleared; otherwise save it
            linearProjectId: linearTeamId ? linearProjectId : null,
            linearProjectName: linearTeamId ? linearProjectName : null,
        },
    })

    revalidatePath(`/projects`)
    revalidatePath(`/projects/${projectId}/settings`)
    revalidatePath("/time")
}

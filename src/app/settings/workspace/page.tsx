import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { WorkspaceSettingsTabs } from "./WorkspaceSettingsTabs"

export default async function WorkspaceSettingsPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) redirect("/")

    const isAdmin = member.role === "OWNER"

    const workspace = await prisma.workspace.findUnique({
        where: { id: member.workspaceId },
        select: {
            id: true,
            name: true,
            currency: true,
            timeFormat: true,
            weekStartDay: true,
            projectColorLabels: true,
            requireTimeEntryNotes: true,
            timeRounding: true,
            defaultCapacityHours: true,
            timerMode: true,
            reminderEnabled: true,
            reminderTime: true,
            reminderDays: true,
            energyTrackingEnabled: true,
            hiddenNavItems: true,
            onboardingEnabled: true,
            supportProjectIds: true,
        },
    })
    if (!workspace) redirect("/")

    const colorLabels = (workspace.projectColorLabels as Array<{ key: string; label: string }>) ?? []

    return (
        <div className="w-[calc(100%-120px)] mx-auto max-w-[80ch] space-y-4 py-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">Workspace Settings</h1>
                <p className="text-muted-foreground mt-1">Configure workspace-level preferences.</p>
            </div>
            <WorkspaceSettingsTabs
                workspace={workspace}
                isAdmin={isAdmin}
                colorLabels={colorLabels}
            />
        </div>
    )
}

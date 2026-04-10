import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import { ProfileTabs } from "./ProfileTabs"
import { BasicInfoForm } from "./BasicInfoForm"
import { RatesProjectsSection } from "./RatesProjectsSection"
import { PermissionsSection } from "./PermissionsSection"
import { AssignedProjectsSection } from "./AssignedProjectsSection"

function initials(name: string | null | undefined, email: string): string {
    if (name) return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    return email.substring(0, 2).toUpperCase()
}

const ROLE_META: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    OWNER: { label: "Owner", variant: "default" },
    ADMIN: { label: "Admin", variant: "secondary" },
    MANAGER: { label: "Manager", variant: "outline" },
    MEMBER: { label: "Member", variant: "outline" },
    CONTRACTOR: { label: "Contractor", variant: "outline" },
}

export default async function UnifiedProfilePage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ tab?: string }>
}) {
    const { id: memberId } = await params
    const { tab } = await searchParams

    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const callerMember = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { id: true, workspaceId: true, role: true },
    })
    if (!callerMember) redirect("/")

    const member = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: callerMember.workspaceId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    defaultBillableCents: true,
                    costRateCents: true,
                },
            },
            manager: {
                select: { id: true, user: { select: { name: true, email: true } } },
            },
        },
    })
    if (!member) notFound()

    const isSelf = callerMember.id === memberId
    const isAdmin = ["OWNER", "ADMIN"].includes(callerMember.role)
    const canEdit = isSelf || isAdmin

    const activeTab = ["basic", "rates", "projects", "permissions"].includes(tab ?? "") ? tab! : "basic"

    // Profile data
    const nameParts = (member.user.name || "").trim().split(" ")
    const firstName = nameParts[0] ?? ""
    const lastName = nameParts.slice(1).join(" ")
    const isPrivilegedRole = ["OWNER", "ADMIN", "MANAGER"].includes(member.role)
    const roleMeta = ROLE_META[member.role] ?? ROLE_META.MEMBER
    const displayName = member.user.name || member.user.email

    // Workspace roles for skill tag catalog
    const workspaceRoles = await prisma.workspaceRole.findMany({
        where: { workspaceId: callerMember.workspaceId },
        select: { name: true },
        orderBy: { name: "asc" },
    })
    const availableRoles = workspaceRoles.map((r) => r.name)

    // Rates + Assigned Projects tab data
    let projectMembers: Array<{
        projectId: string
        projectName: string
        projectCode: string | null
        clientName: string | null
        billingType: string
        billableRateCents: number | null
        isProjectManager: boolean
        status: string
    }> = []
    let allProjects: Array<{ id: string; name: string; code: string | null; clientName: string | null; status: string }> = []

    if ((activeTab === "rates" || activeTab === "projects") && (isSelf || isAdmin)) {
        const [pmRows, projRows] = await Promise.all([
            prisma.projectMember.findMany({
                where: { memberId },
                select: {
                    billableRateCents: true,
                    isProjectManager: true,
                    project: {
                        select: { id: true, name: true, code: true, billingType: true, status: true, client: { select: { name: true } } },
                    },
                },
                orderBy: { project: { name: "asc" } },
            }),
            isAdmin
                ? prisma.teifiProject.findMany({
                      where: { workspaceId: callerMember.workspaceId, status: { in: ["ACTIVE", "PAUSED"] } },
                      select: { id: true, name: true, code: true, status: true, client: { select: { name: true } } },
                      orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
                  })
                : Promise.resolve([]),
        ])

        projectMembers = pmRows.map((pm) => ({
            projectId: pm.project.id,
            projectName: pm.project.name,
            projectCode: pm.project.code ?? null,
            clientName: pm.project.client?.name ?? null,
            billingType: pm.project.billingType,
            billableRateCents: pm.billableRateCents,
            isProjectManager: pm.isProjectManager,
            status: pm.project.status,
        }))
        allProjects = projRows.map(p => ({ id: p.id, name: p.name, code: p.code ?? null, clientName: p.client?.name ?? null, status: p.status }))
    }

    // Manager data for "Reports to" field on basic tab
    let allManagers: Array<{ id: string; name: string; email: string }> = []
    if (activeTab === "basic" && isAdmin) {
        const managerRows = await prisma.workspaceMember.findMany({
            where: { workspaceId: callerMember.workspaceId, id: { not: memberId } },
            select: { id: true, user: { select: { name: true, email: true } } },
            orderBy: { user: { name: "asc" } },
        })
        allManagers = managerRows.map((m) => ({
            id: m.id,
            name: m.user.name ?? m.user.email,
            email: m.user.email,
        }))
    }

    return (
        <div className="flex-1 space-y-0 pt-6 max-w-5xl">
            {/* Back link */}
            <div className="mb-6">
                <a
                    href="/team"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Team
                </a>
                <h2 className="text-xl font-semibold tracking-tight">
                    {isSelf ? "Profile" : displayName}
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                    {isSelf
                        ? "Manage your personal details, rates, and preferences"
                        : `View and manage ${firstName || displayName}'s profile`}
                </p>
            </div>

            {/* Profile identity card */}
            <div className="flex items-center gap-4 mb-8 px-1">
                <Avatar className="h-14 w-14 shadow-sm">
                    <AvatarFallback className={`text-base font-semibold text-white ${avatarBg(member.user.name ?? member.user.email)}`}>
                        {initials(member.user.name, member.user.email)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-semibold truncate">{displayName}</span>
                        <Badge variant={roleMeta.variant} className="text-xs">
                            {roleMeta.label}
                        </Badge>
                        {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{member.user.email}</p>
                    {member.title && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {member.title}
                            {member.teamName && <span className="mx-1">&middot;</span>}
                            {member.teamName}
                        </p>
                    )}
                </div>
            </div>

            <Separator className="border-sidebar-border mb-6" />

            {/* Tab layout */}
            <ProfileTabs activeTab={activeTab}>
                {activeTab === "basic" && (
                    <BasicInfoForm
                        memberId={memberId}
                        userId={member.user.id}
                        firstName={firstName}
                        lastName={lastName}
                        email={member.user.email}
                        title={member.title ?? ""}
                        teamName={member.teamName ?? ""}
                        employeeId={member.employeeId ?? ""}
                        isContractor={member.role === "CONTRACTOR"}
                        isPrivilegedRole={isPrivilegedRole}
                        roles={member.roles}
                        availableRoles={availableRoles}
                        weeklyCapacityHours={member.weeklyCapacityHours}
                        timezone={member.timezone ?? "UTC"}
                        isSelf={isSelf}
                        isAdmin={isAdmin}
                        managerId={member.managerId ?? null}
                        managerName={member.manager ? (member.manager.user.name ?? member.manager.user.email) : null}
                        allManagers={allManagers}
                    />
                )}

                {activeTab === "rates" && (
                    <RatesProjectsSection
                        memberId={memberId}
                        isSelf={isSelf}
                        isAdmin={isAdmin}
                        defaultBillableCents={member.user.defaultBillableCents}
                        costRateCents={member.user.costRateCents}
                        projectMembers={projectMembers}
                        allProjects={undefined}
                    />
                )}

                {activeTab === "projects" && (
                    <AssignedProjectsSection
                        memberId={memberId}
                        isAdmin={isAdmin}
                        isSelf={isSelf}
                        autoAssignAllProjects={member.autoAssignAllProjects}
                        assignedProjects={projectMembers.map((pm) => ({
                            projectId: pm.projectId,
                            name: pm.projectName,
                            code: pm.projectCode,
                            clientName: pm.clientName,
                            status: pm.status,
                            billableRateCents: pm.billableRateCents,
                            isProjectManager: pm.isProjectManager,
                        }))}
                        allProjects={isAdmin ? allProjects : undefined}
                    />
                )}

                {activeTab === "permissions" && (
                    <PermissionsSection
                        memberId={memberId}
                        callerRole={callerMember.role}
                        targetRole={member.role}
                        isSelf={isSelf}
                        isAdmin={isAdmin}
                        canManageProjects={member.canManageProjects}
                        canEditOthersTime={member.canEditOthersTime}
                        canSeeRates={member.canSeeRates}
                        canEditClients={member.canEditClients}
                        canWithdrawApprovals={member.canWithdrawApprovals}
                    />
                )}
            </ProfileTabs>
        </div>
    )
}

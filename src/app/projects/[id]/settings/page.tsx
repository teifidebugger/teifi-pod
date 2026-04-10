import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { getLinearTeams, decryptToken } from "@/lib/linear"
import { LinearMappingForm } from "./LinearMappingForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings2, Link2, Link2Off, Users, Lightbulb } from "lucide-react"
import { updateProjectLinearTeam } from "@/app/actions/workspace"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"
import {
    AssignMemberForm,
    RemoveMemberButton,
    RateOverrideInput,
} from "./ProjectMemberActions"

interface Props {
    params: Promise<{ id: string }>
}

export default async function ProjectSettingsPage({ params }: Props) {
    const { id } = await params
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const userId = session.user.id

    // Load workspace membership + role
    const member = await prisma.workspaceMember.findFirst({
        where: { userId },
        select: { role: true, workspaceId: true, canManageProjects: true },
    })
    if (!member) redirect("/")

    const isAdmin = ["OWNER", "ADMIN"].includes(member.role) ||
        (member.role === "MANAGER" && member.canManageProjects)

    // Load project (verify it belongs to user's workspace)
    const project = await prisma.teifiProject.findFirst({
        where: { id, workspaceId: member.workspaceId },
        include: {
            client: { select: { name: true } },
            linearTeam: true,
            // linearProjectId / linearProjectName are plain fields — no include needed
        },
    })
    if (!project) notFound()

    // Fetch available Linear teams (only if user is admin AND has Linear connected)
    let linearTeams: { id: string; name: string; key: string }[] = []
    let hasLinearConnected = false
    let linearTokenExpired = false

    if (isAdmin) {
        const tokenRecord = await prisma.linearUserToken.findFirst({ where: { userId } })
        hasLinearConnected = !!tokenRecord
        if (tokenRecord) {
            try {
                const accessToken = decryptToken(tokenRecord.accessToken)
                linearTeams = await getLinearTeams(accessToken)
            } catch (err) {
                // Token expired or revoked — prompt user to reconnect
                linearTokenExpired = true
                console.error("[ProjectSettings] getLinearTeams failed:", err)
            }
        }
    }

    // Fetch project members (assigned)
    const assignedMembers = await prisma.projectMember.findMany({
        where: { projectId: id },
        include: {
            member: {
                select: {
                    id: true,
                    role: true,
                    user: { select: { name: true, email: true, image: true } },
                },
            },
        },
        orderBy: { assignedAt: "asc" },
    })

    // Fetch all workspace members not yet assigned
    const assignedMemberIds = assignedMembers.map((pm) => pm.memberId)
    const allWorkspaceMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId: member.workspaceId, disabledAt: null },
        select: {
            id: true,
            role: true,
            user: { select: { name: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
    })
    const unassignedMembers = allWorkspaceMembers.filter(
        (m) => !assignedMemberIds.includes(m.id)
    )

    return (
        <div className="w-[calc(100%-120px)] mx-auto max-w-[80ch] space-y-6 py-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <a href="/projects" className="hover:underline">Projects</a>
                    <span>/</span>
                    <span className="text-foreground font-medium">{project.name}</span>
                    <span>/</span>
                    <span>Settings</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Settings2 className="h-6 w-6" />
                    Project Settings
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {project.code && (
                        <Badge variant="secondary" className="font-mono text-xs">{project.code}</Badge>
                    )}
                    <p className="text-muted-foreground">
                        {project.client && (
                            <span className="text-muted-foreground">{project.client.name} · </span>
                        )}
                        <strong className="text-foreground">{project.name}</strong>
                    </p>
                </div>
            </div>

            {/* Linear Integration Card */}
            <Card className="border-sidebar-border bg-sidebar/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3.03509 12.9431C3.24245 14.9227 4.10472 16.8468 5.62188 18.364C7.13904 19.8811 9.0631 20.7434 11.0428 20.9508L3.03509 12.9431Z" />
                            <path d="M3 11.4938L12.4921 20.9858C13.2976 20.9407 14.0981 20.7879 14.8704 20.5273L3.4585 9.11548C3.19793 9.88771 3.0451 10.6883 3 11.4938Z" />
                            <path d="M3.86722 8.10999L15.8758 20.1186C16.4988 19.8201 17.0946 19.4458 17.6493 18.9956L4.99021 6.33659C4.54006 6.89125 4.16573 7.487 3.86722 8.10999Z" />
                            <path d="M5.66301 5.59517C9.18091 2.12137 14.8488 2.135 18.3498 5.63604C21.8508 9.13708 21.8645 14.8049 18.3907 18.3228L5.66301 5.59517Z" />
                        </svg>
                        Linear Integration
                    </CardTitle>
                    <CardDescription>
                        Map this project to a Linear team. Members will see Linear issues from that team when tracking time.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Current mapping status */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                        <div className="flex items-center gap-2">
                            {project.linearTeam ? (
                                <>
                                    <Link2 className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">Mapped to</span>
                                    <Badge variant="secondary" className="font-mono text-xs">
                                        {project.linearTeam.key}
                                    </Badge>
                                    <span className="text-sm font-medium">{project.linearTeam.name}</span>
                                </>
                            ) : (
                                <>
                                    <Link2Off className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">No Linear team mapped</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Admin action area */}
                    {isAdmin ? (
                        hasLinearConnected ? (
                            linearTokenExpired ? (
                                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm space-y-1">
                                    <p className="font-medium text-destructive">Linear session expired</p>
                                    <p className="text-muted-foreground text-xs">
                                        Your Linear access token has expired or been revoked. Reconnect to restore team mapping.
                                    </p>
                                    <a href={`/settings/integrations?returnTo=${encodeURIComponent(`/projects/${id}/settings`)}`} className="text-xs font-medium text-primary underline">
                                        Reconnect Linear →
                                    </a>
                                </div>
                            ) : (
                            <>
                            {!project.linearTeam && (
                                <div className="flex gap-3 rounded-lg border-l-2 border-l-blue-400 border border-border/50 bg-muted/30 px-4 py-2.5">
                                    <Lightbulb className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-foreground/80">
                                        <span className="font-medium">Enable the Linear issue picker for this project.</span>
                                        {" "}Once linked, team members will see a searchable list of Linear issues when logging time against this project.
                                    </p>
                                </div>
                            )}
                            <LinearMappingForm
                                projectId={project.id}
                                currentTeamId={project.linearTeamId ?? null}
                                currentTeamName={project.linearTeam?.name ?? null}
                                currentTeamKey={project.linearTeam?.key ?? null}
                                currentProjectId={project.linearProjectId ?? null}
                                currentProjectName={project.linearProjectName ?? null}
                                linearTeams={linearTeams}
                            />
                            </>
                        )
                        ) : (
                            <div className="rounded-lg border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 px-4 py-2.5 text-sm">
                                <p className="text-foreground/80">
                                    You need to connect your Linear account before you can map a team.{" "}
                                    <a href={`/settings/integrations?returnTo=${encodeURIComponent(`/projects/${id}/settings`)}`} className="font-medium underline">
                                        Connect Linear →
                                    </a>
                                </p>
                            </div>
                        )
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Only Admins and Managers can change the Linear team mapping.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Project Members Card */}
            <Card className="border-sidebar-border bg-sidebar/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        Project Members
                    </CardTitle>
                    <CardDescription>
                        Control which team members can log time to this project. Members not
                        assigned will only see it if they are an Admin or Owner.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Assigned members list */}
                    {assignedMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No members assigned yet. Add members below.
                        </p>
                    ) : (
                        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                            {assignedMembers.map((pm) => {
                                const name = pm.member.user.name ?? pm.member.user.email
                                const initials = name
                                    .split(" ")
                                    .map((w) => w[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)
                                return (
                                    <div
                                        key={pm.id}
                                        className="flex items-center gap-3 px-3 py-2.5"
                                    >
                                        <Avatar className="h-7 w-7 shrink-0">
                                            <AvatarFallback className={`text-xs text-white ${avatarBg(name)}`}>{initials}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-none truncate">
                                                {name}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {pm.member.user.email}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="text-xs shrink-0">
                                            {pm.member.role}
                                        </Badge>
                                        {isAdmin && (
                                            <RateOverrideInput
                                                projectId={id}
                                                memberId={pm.memberId}
                                                currentRateCents={pm.billableRateCents}
                                            />
                                        )}
                                        {isAdmin && (
                                            <RemoveMemberButton
                                                projectId={id}
                                                memberId={pm.memberId}
                                                memberName={name}
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Add member section */}
                    {isAdmin && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Add member</p>
                            <AssignMemberForm
                                projectId={id}
                                unassigned={unassignedMembers.map((m) => ({
                                    id: m.id,
                                    name: m.user.name,
                                    email: m.user.email,
                                    role: m.role,
                                }))}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

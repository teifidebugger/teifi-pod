"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember } from "@/app/actions"
import { revalidatePath, revalidateTag } from "next/cache"
import { sendWorkspaceEmail } from "@/lib/email"
import { createClient as createLinearGenqlClient } from "@/lib/linear-genql"
import { decryptToken } from "@/lib/linear"

/** Update a member's title and teamName. OWNER/ADMIN only. */
export async function updateMemberProfile(
    memberId: string,
    data: { title?: string; teamName?: string }
) {
    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can update member profiles")

    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!target) throw new Error("Member not found")

    await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { title: data.title ?? null, teamName: data.teamName ?? null },
    })

    revalidatePath("/team")
}

/** Assign (or clear) a manager for a member. OWNER/ADMIN only. */
export async function setMemberManager(memberId: string, managerId: string | null) {
    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can assign managers")

    // Both must be in same workspace
    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!target) throw new Error("Member not found")

    if (managerId) {
        // Cannot self-manage
        if (managerId === memberId) throw new Error("A member cannot manage themselves")

        const mgr = await prisma.workspaceMember.findFirst({
            where: { id: managerId, workspaceId: caller.workspaceId },
        })
        if (!mgr) throw new Error("Manager not found")
    }

    await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { managerId: managerId ?? null },
    })

    revalidateTag(`workspace-managers-${caller.workspaceId}`, "minutes")
    revalidatePath("/team")
}

/**
 * Sync Linear org members against existing workspace users.
 * Matches by email — does NOT create new User records.
 * Updates title field from Linear displayName if the member has no title set.
 * OWNER/ADMIN only.
 */
export async function syncMembersFromLinear() {
    const { user, member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can sync members from Linear")

    // Need current user's Linear token
    const tokenRecord = await prisma.linearUserToken.findFirst({ where: { userId: user.id } })
    if (!tokenRecord) throw new Error("Connect your Linear account first (Settings → Integrations)")

    let accessToken: string
    try {
        accessToken = decryptToken(tokenRecord.accessToken)
    } catch {
        await prisma.linearUserToken.deleteMany({ where: { userId: user.id } })
        throw new Error("Your Linear token is invalid. Please reconnect your Linear account (Settings → Integrations)")
    }

    const client = createLinearGenqlClient({
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    // Fetch all org members from Linear
    const data = await client.query({
        users: {
            __args: {},
            nodes: {
                id: true,
                name: true,
                email: true,
                displayName: true,
                admin: true,
            },
        },
    })

    const linearUsers = data.users?.nodes ?? []

    // Build email → Linear user map
    const byEmail = new Map(
        linearUsers
            .filter(u => u.email)
            .map(u => [u.email!.toLowerCase(), u])
    )

    // Fetch all workspace members with their User emails
    const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: caller.workspaceId },
        include: { user: { select: { email: true } } },
    })

    let matched = 0
    for (const member of members) {
        const linearUser = byEmail.get(member.user.email.toLowerCase())
        if (!linearUser) continue

        matched++
        // Only fill title if not already set
        if (!member.title && linearUser.displayName) {
            await prisma.workspaceMember.update({
                where: { id: member.id },
                data: { title: linearUser.displayName },
            })
        }
    }

    revalidatePath("/team")
    return { matched, total: linearUsers.length }
}

/** Create an invite link for the given email. OWNER/ADMIN only. */
export async function createInvite(
    email: string,
    role: string,
    options?: { projectIds?: string[]; managerId?: string | null }
): Promise<{ token: string }> {
    const validRoles = ["ADMIN", "MANAGER", "MEMBER", "CONTRACTOR"]
    if (!validRoles.includes(role)) throw new Error(`Invalid role "${role}". Invites support: ${validRoles.join(", ")}`)

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        throw new Error("Invalid email address")
    }

    const { user, member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can send invites")

    // Check already a member
    const existing = await prisma.workspaceMember.findFirst({
        where: {
            workspaceId: caller.workspaceId,
            user: { email: trimmedEmail },
        },
    })
    if (existing) throw new Error("This email is already a workspace member")

    // Check for an active (not used, not expired) invite
    const activeInvite = await prisma.invite.findFirst({
        where: {
            workspaceId: caller.workspaceId,
            email: trimmedEmail,
            usedAt: null,
            expiresAt: { gt: new Date() },
        },
    })
    if (activeInvite) throw new Error("An active invite has already been sent to this email")

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const invite = await prisma.invite.create({
        data: {
            email: trimmedEmail,
            workspaceId: caller.workspaceId,
            role: role as import("@prisma/client").Role,
            createdById: user.id,
            expiresAt,
            projectIds: options?.projectIds ?? [],
            managerId: options?.managerId ?? null,
        },
    })

    // Send invite email (fire-and-forget)
    const workspace = await prisma.workspace.findUnique({
        where: { id: caller.workspaceId },
        select: { name: true },
    })
    const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
    sendWorkspaceEmail(caller.workspaceId, {
        type: "workspace-invite",
        recipientEmail: trimmedEmail,
        inviterName: user.name ?? user.email ?? "A team member",
        workspaceName: workspace?.name ?? "Teifi",
        inviteUrl: `${appUrl}/invite/${invite.token}`,
    }).catch(err => console.error("[email] workspace-invite failed:", err))

    revalidatePath("/team")
    return { token: invite.token }
}

/** Update a member's rates and capacity. OWNER/ADMIN only. */
export async function updateMemberRates(
    memberId: string,
    data: {
        defaultBillableCents?: number
        costRateCents?: number
        weeklyCapacityHours?: number
    }
) {
    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can update member billing rates")

    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!target) throw new Error("Member not found")

    if (data.weeklyCapacityHours !== undefined && (data.weeklyCapacityHours < 0 || data.weeklyCapacityHours > 168)) {
        throw new Error("Weekly capacity must be between 0 and 168 hours")
    }

    const memberUpdate: Record<string, number> = {}
    if (data.weeklyCapacityHours !== undefined) memberUpdate.weeklyCapacityHours = data.weeklyCapacityHours

    const userUpdate: Record<string, number> = {}
    if (data.defaultBillableCents !== undefined) userUpdate.defaultBillableCents = data.defaultBillableCents
    if (data.costRateCents !== undefined) userUpdate.costRateCents = data.costRateCents

    if (Object.keys(memberUpdate).length > 0) {
        await prisma.workspaceMember.update({ where: { id: memberId }, data: memberUpdate })
    }
    if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({ where: { id: target.userId }, data: userUpdate })
    }

    revalidatePath("/team")
}

/** Update manager opt-in permissions. OWNER/ADMIN only. */
export async function updateManagerPermissions(
    memberId: string,
    data: {
        canManageProjects: boolean
        canEditOthersTime: boolean
        canSeeRates: boolean
    }
) {
    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can update manager permissions")

    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!target) throw new Error("Member not found")

    await prisma.workspaceMember.update({
        where: { id: memberId },
        data: {
            canManageProjects: data.canManageProjects,
            canEditOthersTime: data.canEditOthersTime,
            canSeeRates: data.canSeeRates,
        },
    })

    revalidatePath("/team")
}

/** Update role + all permission flags in one batch save. OWNER/ADMIN only. */
export async function updateMemberPermissions(
    memberId: string,
    data: {
        role: string
        canManageProjects: boolean
        canEditOthersTime: boolean
        canSeeRates: boolean
        canEditClients: boolean
        canWithdrawApprovals: boolean
    }
) {
    const validRoles = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "CONTRACTOR"]
    if (!validRoles.includes(data.role)) throw new Error(`Invalid role "${data.role}". Must be one of: ${validRoles.join(", ")}`)

    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can update member roles and permissions")

    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!target) throw new Error("Member not found")
    if (target.role === "OWNER") throw new Error("Cannot change the role of an Owner")

    // Clear manager permissions when not a MANAGER role
    const perms = data.role === "MANAGER"
        ? {
            canManageProjects: data.canManageProjects,
            canEditOthersTime: data.canEditOthersTime,
            canSeeRates: data.canSeeRates,
            canEditClients: data.canEditClients,
            canWithdrawApprovals: data.canWithdrawApprovals,
        }
        : {
            canManageProjects: false,
            canEditOthersTime: false,
            canSeeRates: false,
            canEditClients: false,
            canWithdrawApprovals: false,
        }

    await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { role: data.role as import("@prisma/client").Role, ...perms },
    })

    revalidateTag(`workspace-managers-${caller.workspaceId}`, "minutes")
    revalidatePath("/team")
    revalidatePath(`/team/${memberId}/profile`)
}

/** Update basic profile info. OWNER/ADMIN only. */
export async function updateMemberBasicInfo(
    memberId: string,
    data: {
        title?: string | null
        teamName?: string | null
        employeeId?: string | null
        timezone?: string | null
        weeklyCapacityHours?: number
    }
) {
    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can edit member profiles")

    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!target) throw new Error("Member not found")

    await prisma.workspaceMember.update({
        where: { id: memberId },
        data: {
            title: data.title ?? null,
            teamName: data.teamName ?? null,
            employeeId: data.employeeId ?? null,
            timezone: data.timezone ?? null,
            ...(data.weeklyCapacityHours !== undefined ? { weeklyCapacityHours: data.weeklyCapacityHours } : {}),
        },
    })

    revalidatePath("/team")
    revalidatePath(`/team/${memberId}/profile`)
}

/** Assign a project to a member (upserts ProjectMember). OWNER/ADMIN only. */
export async function assignProjectToMember(memberId: string, projectId: string) {
    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can assign projects to members")

    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!target) throw new Error("Member not found")

    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: caller.workspaceId },
    })
    if (!project) throw new Error("Project not found")

    await prisma.projectMember.upsert({
        where: { projectId_memberId: { projectId, memberId } },
        create: { projectId, memberId },
        update: {},
    })

    revalidatePath(`/team/${memberId}/profile`)
    revalidatePath("/projects")
}

/** Remove a project assignment from a member. OWNER/ADMIN only.
 *  Also clears TeifiProject.managerId if this member was the primary manager. */
export async function unassignProjectFromMember(memberId: string, projectId: string) {
    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can remove project assignments")

    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!target) throw new Error("Member not found")

    await prisma.projectMember.deleteMany({ where: { projectId, memberId } })

    // If this member was the primary manager, promote the next co-manager or clear
    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId },
        select: { managerId: true },
    })
    if (project?.managerId === memberId) {
        const otherManager = await prisma.projectMember.findFirst({
            where: { projectId, isProjectManager: true },
        })
        await prisma.teifiProject.update({
            where: { id: projectId },
            data: { managerId: otherManager?.memberId ?? null },
        })
    }

    revalidatePath(`/team/${memberId}/profile`)
    revalidatePath("/projects")
}

/** Toggle isProjectManager flag on a ProjectMember. OWNER/ADMIN only.
 *  Syncs TeifiProject.managerId: promotes/demotes primary manager as needed. */
export async function setProjectManager(memberId: string, projectId: string, isProjectManager: boolean) {
    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can assign project managers")

    await prisma.projectMember.updateMany({
        where: { projectId, memberId },
        data: { isProjectManager },
    })

    // Sync TeifiProject.managerId
    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId },
        select: { managerId: true },
    })

    if (isProjectManager) {
        // If no primary manager yet, promote this person
        if (!project?.managerId) {
            await prisma.teifiProject.update({
                where: { id: projectId },
                data: { managerId: memberId },
            })
        }
    } else {
        // If this person was the primary manager, find another or clear
        if (project?.managerId === memberId) {
            const otherManager = await prisma.projectMember.findFirst({
                where: { projectId, isProjectManager: true, memberId: { not: memberId } },
            })
            await prisma.teifiProject.update({
                where: { id: projectId },
                data: { managerId: otherManager?.memberId ?? null },
            })
        }
    }

    revalidatePath(`/team/${memberId}/profile`)
    revalidatePath("/projects")
}

/** Batch-set isProjectManager for a member across multiple projects. OWNER/ADMIN only.
 *  Syncs TeifiProject.managerId in a single pass. */
export async function setProjectManagerBatch(
    memberId: string,
    projectIds: string[],
    isProjectManager: boolean,
) {
    if (projectIds.length === 0) return

    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can assign project managers")

    // Update all ProjectMember rows at once — scoped to caller's workspace
    await prisma.projectMember.updateMany({
        where: { memberId, projectId: { in: projectIds }, project: { workspaceId: caller.workspaceId } },
        data: { isProjectManager },
    })

    // Sync TeifiProject.managerId
    if (isProjectManager) {
        // For projects that have no primary manager yet, assign this member
        await prisma.teifiProject.updateMany({
            where: { id: { in: projectIds }, workspaceId: caller.workspaceId, managerId: null },
            data: { managerId: memberId },
        })
    } else {
        // For projects where this member IS the primary manager, clear or reassign
        const managed = await prisma.teifiProject.findMany({
            where: { id: { in: projectIds }, workspaceId: caller.workspaceId, managerId: memberId },
            select: { id: true },
        })
        if (managed.length > 0) {
            const managedIds = managed.map((p) => p.id)
            // For each such project, promote another co-manager if one exists
            const coManagers = await prisma.projectMember.findMany({
                where: {
                    projectId: { in: managedIds },
                    isProjectManager: true,
                    memberId: { not: memberId },
                },
                select: { projectId: true, memberId: true },
                distinct: ["projectId"],
            })
            const coMap = new Map(coManagers.map((c) => [c.projectId, c.memberId]))
            for (const project of managed) {
                await prisma.teifiProject.update({
                    where: { id: project.id },
                    data: { managerId: coMap.get(project.id) ?? null },
                })
            }
        }
    }

    revalidatePath(`/team/${memberId}/profile`)
    revalidatePath("/projects")
}

/** Remove member from all projects. OWNER/ADMIN only.
 *  Also clears TeifiProject.managerId for any project they managed. */
export async function removeFromAllProjects(memberId: string) {
    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can remove members from all projects")

    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!target) throw new Error("Member not found")

    // Clear managerId on projects where this member is the primary manager
    await prisma.teifiProject.updateMany({
        where: { workspaceId: caller.workspaceId, managerId: memberId },
        data: { managerId: null },
    })

    await prisma.projectMember.deleteMany({ where: { memberId } })

    revalidatePath(`/team/${memberId}/profile`)
    revalidatePath("/projects")
}

/** Toggle auto-assign to all new projects for a member. OWNER/ADMIN only.
 *  When enabling: also immediately assigns the member to all current active/paused projects. */
export async function setAutoAssignAllProjects(memberId: string, enabled: boolean) {
    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can configure auto-assign")

    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!target) throw new Error("Member not found")

    await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { autoAssignAllProjects: enabled },
    })

    // When enabling: retroactively assign to all current active/paused projects
    if (enabled) {
        const projects = await prisma.teifiProject.findMany({
            where: { workspaceId: caller.workspaceId, status: { in: ["ACTIVE", "PAUSED"] } },
            select: { id: true },
        })
        if (projects.length > 0) {
            await prisma.projectMember.createMany({
                data: projects.map((p) => ({ projectId: p.id, memberId })),
                skipDuplicates: true,
            })
        }
    }

    revalidatePath(`/team/${memberId}/profile`)
}

/** Soft-disable a member — they retain historical data but lose access. OWNER/ADMIN only. */
export async function setMemberDisabled(memberId: string, disabled: boolean): Promise<void> {
    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can disable members")

    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: caller.workspaceId },
    })
    if (!target) throw new Error("Member not found")
    if (target.role === "OWNER") throw new Error("Cannot disable an Owner")

    await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { disabledAt: disabled ? new Date() : null },
    })

    revalidateTag(`workspace-managers-${caller.workspaceId}`, "minutes")
    revalidatePath("/team")
    revalidatePath(`/team/${memberId}/profile`)
}

/** Revoke (delete) an invite. OWNER/ADMIN only. */
export async function revokeInvite(inviteId: string): Promise<void> {
    const { member: caller } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(caller.role)) throw new Error("Only Owners and Admins can revoke invites")

    const invite = await prisma.invite.findFirst({
        where: { id: inviteId, workspaceId: caller.workspaceId },
    })
    if (!invite) throw new Error("Invite not found")

    await prisma.invite.delete({ where: { id: inviteId } })
    revalidatePath("/team")
}

export async function changeRole(memberId: string, newRole: string) {
    const validRoles = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "CONTRACTOR"]
    if (!validRoles.includes(newRole)) throw new Error(`Invalid role "${newRole}". Must be one of: ${validRoles.join(", ")}`)

    const { member: callerMember } = await getSessionMember()

    if (!["OWNER", "ADMIN"].includes(callerMember.role)) throw new Error("Only Owners and Admins can change member roles")
    if (callerMember.id === memberId) throw new Error("Cannot change your own role")

    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: callerMember.workspaceId },
    })
    if (!target) throw new Error("Member not found")
    if (target.role === "OWNER") throw new Error("Cannot change the role of an Owner")
    if (newRole === "OWNER") throw new Error("Cannot promote to Owner — use a dedicated ownership transfer flow")

    const permissionClear = newRole !== "MANAGER"
        ? { canManageProjects: false, canEditOthersTime: false, canSeeRates: false, canEditClients: false, canWithdrawApprovals: false }
        : {}

    await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { role: newRole as import("@prisma/client").Role, ...permissionClear },
    })

    revalidatePath("/team")
}

export async function removeMember(memberId: string) {
    const { member: callerMember } = await getSessionMember()

    if (!["OWNER", "ADMIN"].includes(callerMember.role)) throw new Error("Only Owners and Admins can remove workspace members")
    if (callerMember.id === memberId) throw new Error("Cannot remove yourself")

    const target = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: callerMember.workspaceId },
    })
    if (!target) throw new Error("Member not found")
    if (target.role === "OWNER") throw new Error("Cannot remove the workspace owner")

    await prisma.teifiProject.updateMany({
        where: { managerId: memberId, workspaceId: target.workspaceId },
        data: { managerId: null },
    })

    await prisma.workspaceMember.delete({ where: { id: memberId } })

    revalidatePath("/team")
}

"use server"

import { getSessionMember } from "@/app/actions"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateMyProfile(data: {
    firstName: string
    lastName: string
    employeeId: string
    isContractor: boolean
    roles: string[]
    weeklyCapacityHours: number
    timezone: string
    title: string
    teamName: string
}) {
    const { user, member } = await getSessionMember()

    // Validate bounds — allow 0.5h increments (e.g. 37.5)
    const capacity = Math.round(data.weeklyCapacityHours * 2) / 2
    if (!Number.isFinite(capacity) || capacity < 0.5 || capacity > 168) {
        throw new Error("Weekly capacity must be between 0.5 and 168 hours")
    }

    // Update the user's display name
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ").trim()
    if (fullName) {
        await prisma.user.update({
            where: { id: user.id },
            data: { name: fullName },
        })
    }

    // Determine new role: preserve privilege roles, only toggle CONTRACTOR vs MEMBER
    const privilegeRoles = ["OWNER", "ADMIN", "MANAGER"] as const
    type PrivilegeRole = typeof privilegeRoles[number]
    const isPrivilege = (privilegeRoles as readonly string[]).includes(member.role)

    const newRole = isPrivilege
        ? member.role // never downgrade a privileged role
        : data.isContractor
        ? "CONTRACTOR"
        : "MEMBER"

    await prisma.workspaceMember.update({
        where: { id: member.id },
        data: {
            role: newRole,
            employeeId: data.employeeId || null,
            roles: data.roles,
            weeklyCapacityHours: capacity,
            timezone: data.timezone || "UTC",
            title: data.title || null,
            teamName: data.teamName || null,
        },
    })

    revalidatePath("/profile")
    revalidatePath("/team")
    revalidatePath(`/team/${member.id}/profile`)
}

export async function updateMyRates(data: {
    defaultBillableCents: number
    costRateCents: number
}) {
    const { user, member } = await getSessionMember()

    if (data.defaultBillableCents < 0 || data.costRateCents < 0) {
        throw new Error("Rates cannot be negative")
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            defaultBillableCents: data.defaultBillableCents,
            costRateCents: data.costRateCents,
        },
    })

    revalidatePath("/profile")
    revalidatePath(`/team/${member.id}/profile`)
}

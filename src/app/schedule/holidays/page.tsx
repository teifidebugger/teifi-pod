import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { HolidayManager } from "./HolidayForm"

export default async function HolidaysPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { id: true, workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(member.role)
    const isAdmin = ["OWNER", "ADMIN"].includes(member.role)

    const holidays = await prisma.workspaceHoliday.findMany({
        where: { workspaceId: member.workspaceId },
        orderBy: { date: "asc" },
    })

    const workspaceMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId: member.workspaceId },
        include: {
            user: { select: { name: true } },
        },
        orderBy: { user: { name: "asc" } },
    })

    const memberTimeOff = await prisma.memberTimeOff.findMany({
        where: { workspaceId: member.workspaceId },
        orderBy: { date: "asc" },
    })

    const serializedHolidays = holidays.map((h) => ({
        id: h.id,
        name: h.name,
        date: h.date,
    }))

    const serializedMembers = workspaceMembers.map((wm) => ({
        id: wm.id,
        name: wm.user.name ?? "Unknown",
    }))

    const serializedTimeOff = memberTimeOff.map((t) => ({
        id: t.id,
        memberId: t.memberId,
        date: t.date,
        reason: t.reason,
    }))

    return (
        <div className="flex-1 space-y-6 pt-6 max-w-4xl">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">Holidays & Time Off</h1>
                <p className="text-muted-foreground mt-1">
                    Manage company holidays and personal days off.
                </p>
            </div>
            <HolidayManager
                holidays={serializedHolidays}
                members={serializedMembers}
                timeOff={serializedTimeOff}
                currentMemberId={member.id}
                canManage={canManage}
                isAdmin={isAdmin}
            />
        </div>
    )
}

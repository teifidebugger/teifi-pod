import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ExpenseReportView } from "./ExpenseReportView"

export default async function ExpenseReportPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    // Filter options
    const [projects, members, categories] = await Promise.all([
        prisma.teifiProject.findMany({
            where: { workspaceId: member.workspaceId },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
        prisma.workspaceMember.findMany({
            where: { workspaceId: member.workspaceId },
            select: { userId: true, user: { select: { name: true, email: true } } },
            orderBy: { user: { name: "asc" } },
        }),
        prisma.expenseCategory.findMany({
            where: { workspaceId: member.workspaceId, isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ])

    const memberList = members.map((m) => ({
        id: m.userId,
        name: m.user.name ?? m.user.email,
    }))

    return (
        <ExpenseReportView
            projects={projects}
            members={memberList}
            categories={categories}
        />
    )
}

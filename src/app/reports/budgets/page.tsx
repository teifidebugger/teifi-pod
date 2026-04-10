import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { BudgetReportView } from "./BudgetReportView"
import { cacheLife } from "next/dist/server/use-cache/cache-life"

async function fetchBudgetData(workspaceId: string) {
    "use cache"
    cacheLife("hours")

    const [projects, entriesByProject, expByProject] = await Promise.all([
        prisma.teifiProject.findMany({
            where: { workspaceId },
            include: {
                client: { select: { name: true } },
                _count: { select: { timeEntries: true } },
            },
            orderBy: { name: "asc" },
        }),
        prisma.timeEntry.findMany({
            where: { project: { workspaceId }, timerStartedAt: null },
            select: { projectId: true, durationSeconds: true, billableRateCents: true, costRateCents: true, date: true },
        }),
        prisma.expense.groupBy({
            by: ["projectId"],
            where: { project: { workspaceId } },
            _sum: { amountCents: true },
        }),
    ])

    return { projects, entriesByProject, expByProject }
}

export default async function BudgetReportPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    const { workspaceId } = member

    const workspace = await prisma.workspace.findFirst({ where: { id: workspaceId }, select: { currency: true } })
    const currency = workspace?.currency ?? "USD"

    const canSeeBudget = ["OWNER", "ADMIN", "MANAGER"].includes(member.role ?? "")
    if (!canSeeBudget) redirect("/reports")

    const { projects, entriesByProject, expByProject } = await fetchBudgetData(workspaceId)

    const expMap = new Map(expByProject.map(e => [e.projectId, e._sum]))

    const now = new Date()
    const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd")
    const monthEnd = format(new Date(now.getFullYear(), now.getMonth() + 1, 1), "yyyy-MM-dd")

    // Enrich projects with computed fields
    const enriched = projects.map(p => {
        const projectEntries = entriesByProject.filter(e => e.projectId === p.id)
        const budgetEntries = p.budgetIsMonthly
            ? projectEntries.filter(e => e.date >= monthStart && e.date < monthEnd)
            : projectEntries
        const exp = expMap.get(p.id)
        const totalSeconds = projectEntries.reduce((s, e) => s + e.durationSeconds, 0)
        const totalHours = totalSeconds / 3600
        const costAmountCents = budgetEntries.reduce((s, e) => s + Math.round((e.durationSeconds / 3600) * e.costRateCents), 0)
        const billableAmountCents = budgetEntries.reduce((s, e) => s + Math.round((e.durationSeconds / 3600) * e.billableRateCents), 0)
        const expensesCents = exp?.amountCents ?? 0

        return {
            id: p.id,
            name: p.name,
            status: p.status,
            billingType: p.billingType,
            budgetBy: p.budgetBy,
            budgetHours: p.budgetHours,
            budgetCents: p.budgetCents,
            feeCents: p.feeCents,
            costBudgetCents: p.costBudgetCents,
            costBudgetIncludeExpenses: p.costBudgetIncludeExpenses,
            notifyWhenOverBudget: p.notifyWhenOverBudget,
            overBudgetNotificationPercent: p.overBudgetNotificationPercent,
            clientName: p.client?.name ?? null,
            totalHours,
            costAmountCents,
            expensesCents,
            entryCount: p._count.timeEntries,
        }
    })

    const clients = [...new Set(projects.map(p => p.client?.name).filter(Boolean))] as string[]

    return <BudgetReportView projects={enriched} clients={clients} currency={currency} />
}

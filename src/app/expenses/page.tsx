import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ExpenseForm } from "./ExpenseForm"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Receipt, DollarSign, TrendingUp, Tag, Settings2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PageProps {
    searchParams: Promise<{
        dateFrom?: string
        dateTo?: string
        projectId?: string
        userId?: string
        categoryId?: string
    }>
}

function displayAmount(cents: number): string {
    return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function ExpensesPage({ searchParams }: PageProps) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    const isAdmin = ["OWNER", "ADMIN", "MANAGER"].includes(member.role)

    const params = await searchParams
    const now = new Date()
    const dateFrom = params.dateFrom ? new Date(params.dateFrom) : startOfMonth(now)
    const dateTo = params.dateTo ? new Date(params.dateTo) : endOfMonth(now)
    const filterProjectId = params.projectId && params.projectId !== "__all__" ? params.projectId : undefined
    const filterUserId = params.userId && params.userId !== "__all__" ? params.userId : undefined
    const filterCategoryId = params.categoryId && params.categoryId !== "__all__" ? params.categoryId : undefined

    // Load expenses
    const expenses = await prisma.expense.findMany({
        where: {
            project: { workspaceId: member.workspaceId },
            date: { gte: dateFrom, lte: dateTo },
            ...(filterProjectId ? { projectId: filterProjectId } : {}),
            ...(isAdmin && filterUserId ? { userId: filterUserId } : isAdmin ? {} : { userId: session.user.id }),
            ...(filterCategoryId ? { expenseCategoryId: filterCategoryId } : {}),
        },
        include: {
            project: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
            expenseCategory: { select: { id: true, name: true, unitPriceCents: true, unitName: true } },
        },
        orderBy: { date: "desc" },
    })

    // Projects for form (all workspace projects)
    const projects = await prisma.teifiProject.findMany({
        where: { workspaceId: member.workspaceId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    })

    // Active expense categories for form
    const categories = await prisma.expenseCategory.findMany({
        where: { workspaceId: member.workspaceId, isActive: true },
        select: { id: true, name: true, unitPriceCents: true, unitName: true },
        orderBy: { name: "asc" },
    })

    // Members for admin "log for" dropdown
    const members = isAdmin
        ? await prisma.workspaceMember.findMany({
              where: { workspaceId: member.workspaceId },
              select: { userId: true, user: { select: { name: true } } },
          })
        : []

    const memberList = members.map((m) => ({ id: m.userId, name: m.user.name }))

    // Summary stats for current month (always full month regardless of filter)
    const thisMonthExpenses = await prisma.expense.findMany({
        where: {
            project: { workspaceId: member.workspaceId },
            date: { gte: startOfMonth(now), lte: endOfMonth(now) },
            ...(isAdmin ? {} : { userId: session.user.id }),
        },
        select: {
            amountCents: true,
            isBillable: true,
            expenseCategory: { select: { name: true } },
        },
    })

    const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amountCents, 0)
    const billableThisMonth = thisMonthExpenses.filter((e) => e.isBillable).reduce((s, e) => s + e.amountCents, 0)

    // Top category
    const categoryCounts: Record<string, number> = {}
    for (const e of thisMonthExpenses) {
        const cat = e.expenseCategory?.name ?? "Uncategorized"
        categoryCounts[cat] = (categoryCounts[cat] ?? 0) + e.amountCents
    }
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"

    // Group filtered expenses by month
    const grouped = new Map<string, typeof expenses>()
    for (const exp of expenses) {
        const key = format(exp.date, "MMMM yyyy")
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(exp)
    }

    return (
        <div className="flex-1 space-y-6 pt-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Expenses</h2>
                    <p className="text-muted-foreground mt-1">Track and manage project-related expenses.</p>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/expenses/categories">
                                <Settings2 className="w-4 h-4 mr-1" /> Manage Categories
                            </Link>
                        </Button>
                    )}
                    <ExpenseForm mode="create" projects={projects} categories={categories} isAdmin={isAdmin} members={memberList} />
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Month</p>
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold tracking-tight text-foreground">{displayAmount(totalThisMonth)}</p>
                    <p className="text-xs text-muted-foreground">{thisMonthExpenses.length} expense{thisMonthExpenses.length !== 1 ? "s" : ""}</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Billable Amount</p>
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold tracking-tight text-foreground">{displayAmount(billableThisMonth)}</p>
                    <p className="text-xs text-muted-foreground">
                        {totalThisMonth > 0
                            ? Math.round((billableThisMonth / totalThisMonth) * 100)
                            : 0}% of total
                    </p>
                </div>

                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Category</p>
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold tracking-tight text-foreground">{topCategory}</p>
                    <p className="text-xs text-muted-foreground">by spend this month</p>
                </div>
            </div>

            {/* Expense list grouped by month */}
            {grouped.size === 0 ? (
                <div className="rounded-md border border-sidebar-border bg-sidebar/30 p-12 flex flex-col items-center justify-center text-center">
                    <Receipt className="w-10 h-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No expenses found for this period.</p>
                    <ExpenseForm mode="create" projects={projects} categories={categories} isAdmin={isAdmin} members={memberList} />
                </div>
            ) : (
                <div className="space-y-6">
                    {Array.from(grouped.entries()).map(([month, monthExpenses]) => {
                        const monthTotal = monthExpenses.reduce((s, e) => s + e.amountCents, 0)
                        const monthBillable = monthExpenses
                            .filter((e) => e.isBillable)
                            .reduce((s, e) => s + e.amountCents, 0)

                        return (
                            <div key={month}>
                                {/* Month header */}
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                            {month}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {monthExpenses.length} expense{monthExpenses.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-muted-foreground">
                                            Billable: <span className="font-medium text-foreground">{displayAmount(monthBillable)}</span>
                                        </span>
                                        <span className="font-semibold">
                                            Total: {displayAmount(monthTotal)}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-md border border-sidebar-border bg-sidebar/30 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow className="border-sidebar-border hover:bg-transparent">
                                                <TableHead>Date</TableHead>
                                                <TableHead>Project</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Category</TableHead>
                                                {isAdmin && <TableHead>Member</TableHead>}
                                                <TableHead className="text-center">Billable</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead className="w-[60px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {monthExpenses.map((exp) => (
                                                <TableRow
                                                    key={exp.id}
                                                    className="border-sidebar-border hover:bg-sidebar/50 transition-colors"
                                                >
                                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                        {format(exp.date, "MMM d")}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-sm">
                                                        {exp.project.name}
                                                    </TableCell>
                                                    <TableCell className="text-sm max-w-[200px] truncate">
                                                        {exp.description}
                                                        {exp.notes && (
                                                            <span className="text-muted-foreground ml-1 text-xs">
                                                                — {exp.notes}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {exp.expenseCategory ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                <Badge variant="secondary" className="text-xs w-fit">
                                                                    {exp.expenseCategory.name}
                                                                </Badge>
                                                                {exp.quantity != null && exp.expenseCategory.unitName && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {exp.quantity} {exp.expenseCategory.unitName}
                                                                        {exp.expenseCategory.unitPriceCents != null && (
                                                                            <> × ${(exp.expenseCategory.unitPriceCents / 100).toFixed(2)}</>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">—</span>
                                                        )}
                                                    </TableCell>
                                                    {isAdmin && (
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {exp.user.name ?? exp.user.id}
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="text-center">
                                                        {exp.isBillable ? (
                                                            <Badge variant="outline" className="text-xs border-green-500/40 text-green-600 dark:text-green-400">
                                                                Billable
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                Non-billable
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold tabular-nums">
                                                        {displayAmount(exp.amountCents)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <ExpenseForm
                                                            mode="edit"
                                                            expense={{
                                                                id: exp.id,
                                                                projectId: exp.projectId,
                                                                date: exp.date,
                                                                amountCents: exp.amountCents,
                                                                quantity: exp.quantity,
                                                                description: exp.description,
                                                                expenseCategoryId: exp.expenseCategoryId,
                                                                isBillable: exp.isBillable,
                                                                notes: exp.notes,
                                                            }}
                                                            projects={projects}
                                                            categories={categories}
                                                            isAdmin={isAdmin}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

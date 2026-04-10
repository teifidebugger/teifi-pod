import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CategoryManager } from "./CategoryManager"

interface PageProps {
    searchParams: Promise<{ archived?: string }>
}

export default async function ExpenseCategoriesPage({ searchParams }: PageProps) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    const isAdmin = ["OWNER", "ADMIN"].includes(member.role)
    if (!isAdmin) redirect("/expenses")

    const params = await searchParams
    const showArchived = params.archived === "1"

    const categories = await prisma.expenseCategory.findMany({
        where: { workspaceId: member.workspaceId },
        include: { _count: { select: { expenses: true } } },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
    })

    const serialized = categories.map((c) => ({
        id: c.id,
        name: c.name,
        isActive: c.isActive,
        unitPriceCents: c.unitPriceCents,
        unitName: c.unitName,
        expenseCount: c._count.expenses,
    }))

    const archivedCount = categories.filter((c) => !c.isActive).length

    return (
        <div className="w-[calc(100%-120px)] mx-auto max-w-[80ch] space-y-6 py-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/expenses">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Expenses
                    </Link>
                </Button>
            </div>

            <div>
                <h2 className="text-xl font-semibold tracking-tight">Expense categories</h2>
                <p className="text-muted-foreground mt-1">
                    Manage categories for classifying expenses. Categories with unit prices let you track by quantity.
                </p>
            </div>

            <CategoryManager categories={serialized} showArchived={showArchived} />

            {archivedCount > 0 && (
                <div className="text-sm">
                    <Link
                        href={showArchived ? "/expenses/categories" : "/expenses/categories?archived=1"}
                        className="text-muted-foreground underline hover:text-foreground"
                    >
                        {showArchived
                            ? "Hide archived categories"
                            : `Show ${archivedCount} archived categor${archivedCount === 1 ? "y" : "ies"}`}
                    </Link>
                </div>
            )}
        </div>
    )
}

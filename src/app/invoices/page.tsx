import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { FileText, Plus } from "lucide-react"
import { InvoiceForm } from "./InvoiceForm"

function displayAmount(cents: number): string {
    return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const STATUS_BADGE: Record<string, string> = {
    DRAFT: "secondary",
    SENT: "default",
    PAID: "default",
    VOID: "secondary",
}

const STATUS_CLASSES: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    SENT: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    PAID: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    VOID: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
}

export default async function InvoicesPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true, canSeeRates: true },
    })
    if (!member) redirect("/")

    const isAdmin = ["OWNER", "ADMIN"].includes(member.role)
    const canView = isAdmin || (member.role === "MANAGER" && member.canSeeRates)

    if (!canView) {
        redirect("/")
    }

    const invoices = await prisma.invoice.findMany({
        where: { workspaceId: member.workspaceId },
        include: {
            client: { select: { id: true, name: true } },
            _count: { select: { lineItems: true, timeEntries: true } },
        },
        orderBy: { createdAt: "desc" },
    })

    const clients = await prisma.client.findMany({
        where: { workspaceId: member.workspaceId, archivedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    })

    // Summary stats
    const draftTotal = invoices.filter((i) => i.status === "DRAFT").reduce((s, i) => s + i.totalCents, 0)
    const sentTotal = invoices.filter((i) => i.status === "SENT").reduce((s, i) => s + i.totalCents, 0)
    const paidTotal = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.totalCents, 0)

    return (
        <div className="flex-1 space-y-6 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Invoices</h1>
                    <p className="text-muted-foreground mt-1">Create and manage client invoices.</p>
                </div>
                {isAdmin && <InvoiceForm clients={clients} />}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-sidebar-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{displayAmount(draftTotal)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{invoices.filter((i) => i.status === "DRAFT").length} invoices</p>
                    </CardContent>
                </Card>
                <Card className="border-sidebar-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{displayAmount(sentTotal)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{invoices.filter((i) => i.status === "SENT").length} invoices sent</p>
                    </CardContent>
                </Card>
                <Card className="border-sidebar-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{displayAmount(paidTotal)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{invoices.filter((i) => i.status === "PAID").length} invoices paid</p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice table */}
            <Card className="border-sidebar-border">
                <CardContent className="p-0">
                    {invoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                            <FileText className="h-10 w-10 opacity-30" />
                            <p className="text-sm">No invoices yet. Create your first one above.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Issued</TableHead>
                                    <TableHead>Due</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Items</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((inv) => (
                                    <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell>
                                            <Link href={`/invoices/${inv.id}`} className="font-mono text-sm font-medium hover:underline">
                                                {inv.invoiceNum}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {inv.client?.name ?? <span className="italic opacity-50">No client</span>}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_CLASSES[inv.status] ?? ""}`}>
                                                {inv.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {inv.issuedAt ? format(inv.issuedAt, "MMM d, yyyy") : "—"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {inv.dueAt ? format(inv.dueAt, "MMM d, yyyy") : "—"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium">
                                            {displayAmount(inv.totalCents)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            {inv._count.lineItems}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

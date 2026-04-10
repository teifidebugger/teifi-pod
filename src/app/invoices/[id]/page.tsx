import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ChevronLeft } from "lucide-react"
import { InvoiceActions } from "./InvoiceActions"
import { AddLineItemForm } from "./AddLineItemForm"
import { RemoveButton } from "./RemoveButton"

function displayAmount(cents: number): string {
    return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const STATUS_CLASSES: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground border-muted",
    SENT: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    PAID: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    VOID: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true, canSeeRates: true },
    })
    if (!member) redirect("/")

    const isAdmin = ["OWNER", "ADMIN"].includes(member.role)
    const canView = isAdmin || (member.role === "MANAGER" && member.canSeeRates)
    if (!canView) redirect("/")

    const { id } = await params

    const invoice = await prisma.invoice.findFirst({
        where: { id, workspaceId: member.workspaceId },
        include: {
            client: { select: { id: true, name: true } },
            lineItems: { orderBy: { id: "asc" } },
        },
    })
    if (!invoice) notFound()

    const canEdit = isAdmin && invoice.status !== "VOID"

    return (
        <div className="flex-1 space-y-6 pt-6 max-w-4xl">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/invoices">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Invoices
                    </Link>
                </Button>
            </div>

            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold tracking-tight font-mono">{invoice.invoiceNum}</h1>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_CLASSES[invoice.status] ?? ""}`}>
                            {invoice.status}
                        </span>
                    </div>
                    {invoice.client && (
                        <p className="text-muted-foreground mt-1">{invoice.client.name}</p>
                    )}
                </div>
                {isAdmin && (
                    <InvoiceActions invoice={{ id: invoice.id, status: invoice.status }} />
                )}
            </div>

            {/* Meta */}
            <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Issued</p>
                    <p>{invoice.issuedAt ? format(invoice.issuedAt, "MMM d, yyyy") : "—"}</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Due</p>
                    <p>{invoice.dueAt ? format(invoice.dueAt, "MMM d, yyyy") : "—"}</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Paid</p>
                    <p>{invoice.paidAt ? format(invoice.paidAt, "MMM d, yyyy") : "—"}</p>
                </div>
            </div>

            {/* Line Items */}
            <Card className="border-sidebar-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Line Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right w-24">Qty</TableHead>
                                <TableHead className="text-right w-28">Unit Price</TableHead>
                                <TableHead className="text-right w-28">Total</TableHead>
                                {canEdit && <TableHead className="w-16" />}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.lineItems.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={canEdit ? 5 : 4} className="text-center text-muted-foreground py-8">
                                        No line items yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {invoice.lineItems.map((li) => (
                                <TableRow key={li.id}>
                                    <TableCell>
                                        <span className="text-sm">{li.description}</span>
                                        <span className="ml-2 text-[10px] text-muted-foreground uppercase">{li.kind}</span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">{li.quantity}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">{displayAmount(li.unitPrice)}</TableCell>
                                    <TableCell className="text-right font-mono text-sm font-medium">{displayAmount(li.totalCents)}</TableCell>
                                    {canEdit && (
                                        <TableCell className="text-right">
                                            <RemoveButton lineItemId={li.id} />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Totals */}
                    <div className="border-t border-sidebar-border p-4 space-y-1">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="font-mono">{displayAmount(invoice.subtotalCents)}</span>
                        </div>
                        {invoice.taxRatePercent > 0 && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Tax ({invoice.taxRatePercent}%)</span>
                                <span className="font-mono">{displayAmount(invoice.taxCents)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-semibold pt-1 border-t border-sidebar-border">
                            <span>Total</span>
                            <span className="font-mono">{displayAmount(invoice.totalCents)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {canEdit && <AddLineItemForm invoiceId={invoice.id} />}

            {invoice.noteToClient && (
                <Card className="border-sidebar-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Note to Client</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{invoice.noteToClient}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

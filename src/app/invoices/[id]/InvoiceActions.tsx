"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { markInvoiceSent, markInvoicePaid, voidInvoice, deleteInvoice } from "@/app/actions/invoices"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Send, CheckCircle, Ban, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
    invoice: { id: string; status: string }
}

export function InvoiceActions({ invoice }: Props) {
    const [pending, startTransition] = useTransition()
    const router = useRouter()

    function handle(action: () => Promise<void>, successMsg: string) {
        startTransition(async () => {
            try {
                await action()
                toast.success(successMsg)
                router.refresh()
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to update invoice")
            }
        })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={pending}>
                    Actions
                    <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {invoice.status === "DRAFT" && (
                    <DropdownMenuItem onClick={() => handle(() => markInvoiceSent(invoice.id), "Invoice marked as sent")}>
                        <Send className="h-4 w-4 mr-2" />
                        Mark as Sent
                    </DropdownMenuItem>
                )}
                {invoice.status === "SENT" && (
                    <DropdownMenuItem onClick={() => handle(() => markInvoicePaid(invoice.id), "Invoice marked as paid")}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Paid
                    </DropdownMenuItem>
                )}
                {(invoice.status === "DRAFT" || invoice.status === "SENT") && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handle(() => voidInvoice(invoice.id), "Invoice voided")}
                        >
                            <Ban className="h-4 w-4 mr-2" />
                            Void Invoice
                        </DropdownMenuItem>
                    </>
                )}
                {invoice.status === "DRAFT" && (
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handle(async () => {
                            await deleteInvoice(invoice.id)
                            router.push("/invoices")
                        }, "Invoice deleted")}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

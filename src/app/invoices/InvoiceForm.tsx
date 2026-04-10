"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createInvoice } from "@/app/actions/invoices"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Client {
    id: string
    name: string
}

interface Props {
    clients: Client[]
}

export function InvoiceForm({ clients }: Props) {
    const [open, setOpen] = useState(false)
    const [pending, startTransition] = useTransition()
    const router = useRouter()

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            try {
                const id = await createInvoice(formData)
                toast.success("Invoice created")
                setOpen(false)
                router.push(`/invoices/${id}`)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to create invoice")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New Invoice
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>New Invoice</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="clientId">Client</Label>
                        <Select name="clientId" defaultValue="__none__">
                            <SelectTrigger id="clientId">
                                <SelectValue placeholder="Select client…" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">No client</SelectItem>
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="issuedAt">Issue Date</Label>
                            <Input
                                id="issuedAt"
                                name="issuedAt"
                                type="date"
                                defaultValue={new Date().toISOString().slice(0, 10)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueAt">Due Date</Label>
                            <Input id="dueAt" name="dueAt" type="date" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="taxRatePercent">Tax Rate (%)</Label>
                        <Input
                            id="taxRatePercent"
                            name="taxRatePercent"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            defaultValue="0"
                            placeholder="0"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="noteToClient">Note to Client</Label>
                        <Textarea
                            id="noteToClient"
                            name="noteToClient"
                            rows={3}
                            placeholder="Thank you for your business…"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={pending}>
                            {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Create Invoice
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

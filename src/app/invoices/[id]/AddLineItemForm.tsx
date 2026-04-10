"use client"

import { useState, useTransition } from "react"
import { addLineItem } from "@/app/actions/invoices"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Props {
    invoiceId: string
}

export function AddLineItemForm({ invoiceId }: Props) {
    const [pending, startTransition] = useTransition()
    const [description, setDescription] = useState("")
    const [quantity, setQuantity] = useState("1")
    const [unitPrice, setUnitPrice] = useState("")
    const [kind, setKind] = useState("custom")
    const router = useRouter()

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!description.trim()) { toast.error("Description is required"); return }
        const qty = parseFloat(quantity)
        const price = parseFloat(unitPrice)
        if (isNaN(qty) || qty <= 0) { toast.error("Invalid quantity"); return }
        if (isNaN(price) || price < 0) { toast.error("Invalid unit price"); return }

        startTransition(async () => {
            try {
                await addLineItem(invoiceId, {
                    description: description.trim(),
                    quantity: qty,
                    unitPrice: Math.round(price * 100),
                    kind,
                })
                toast.success("Line item added")
                setDescription("")
                setQuantity("1")
                setUnitPrice("")
                router.refresh()
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to add line item")
            }
        })
    }

    return (
        <Card className="border-sidebar-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Add Line Item</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5 space-y-1">
                        <Label htmlFor="li-desc" className="text-xs">Description</Label>
                        <Input
                            id="li-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Service description…"
                            required
                        />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <Label htmlFor="li-qty" className="text-xs">Qty</Label>
                        <Input
                            id="li-qty"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <Label htmlFor="li-price" className="text-xs">Unit Price ($)</Label>
                        <Input
                            id="li-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={unitPrice}
                            onChange={(e) => setUnitPrice(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Kind</Label>
                        <Select value={kind} onValueChange={setKind}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="custom">Custom</SelectItem>
                                <SelectItem value="time">Time</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-1">
                        <Button type="submit" size="icon" disabled={pending}>
                            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

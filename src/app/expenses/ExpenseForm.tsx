"use client"

import { useState } from "react"
import { logExpense, updateExpense, deleteExpense } from "@/app/actions/expenses"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ReceiptUpload } from "./ReceiptUpload"

interface Project {
    id: string
    name: string
}

interface ExpenseCategory {
    id: string
    name: string
    unitPriceCents: number | null
    unitName: string | null
}

interface ExpenseRow {
    id: string
    projectId: string
    date: Date
    amountCents: number
    quantity?: number | null
    description: string
    expenseCategoryId: string | null
    isBillable: boolean
    notes: string | null
    receiptUrl?: string | null
}

interface ExpenseFormProps {
    mode: "create" | "edit"
    expense?: ExpenseRow
    projects: Project[]
    categories: ExpenseCategory[]
    isAdmin?: boolean
    members?: { id: string; name: string | null }[]
    children?: React.ReactNode
}

function toDateInput(d: Date): string {
    return d.toISOString().slice(0, 10)
}

function displayAmount(cents: number): string {
    return (cents / 100).toFixed(2)
}

export function ExpenseForm({ mode, expense, projects, categories, isAdmin, members, children }: ExpenseFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // Controlled select values (shadcn Select requires controlled state to show defaults)
    const [projectId, setProjectId] = useState(expense?.projectId ?? (projects[0]?.id ?? ""))
    const [categoryId, setCategoryId] = useState<string>(expense?.expenseCategoryId ?? "__none__")
    const [forUserId, setForUserId] = useState("__self__")
    const [isBillable, setIsBillable] = useState(expense?.isBillable ?? true)
    const [quantity, setQuantity] = useState<string>(
        expense?.quantity != null ? String(expense.quantity) : ""
    )

    const [receiptUrl, setReceiptUrl] = useState<string | null>(expense?.receiptUrl ?? null)

    const selectedCategory = categories.find((c) => c.id === categoryId) ?? null
    const isUnitPrice = selectedCategory?.unitPriceCents != null

    // Computed amount when unit price category is selected
    const computedAmount = isUnitPrice && selectedCategory && quantity
        ? (parseFloat(quantity) * selectedCategory.unitPriceCents!) / 100
        : null

    function resetForm() {
        setProjectId(expense?.projectId ?? (projects[0]?.id ?? ""))
        setCategoryId(expense?.expenseCategoryId ?? "__none__")
        setIsBillable(expense?.isBillable ?? true)
        setQuantity(expense?.quantity != null ? String(expense.quantity) : "")
        setReceiptUrl(expense?.receiptUrl ?? null)
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const raw = new FormData(e.currentTarget)
        const formData = new FormData()

        // Copy text fields
        formData.set("projectId", projectId)
        formData.set("description", raw.get("description") as string)
        // For unit-price categories, use the computed amount
        const amountValue = isUnitPrice && computedAmount != null
            ? computedAmount.toFixed(2)
            : raw.get("amount") as string
        formData.set("amount", amountValue)
        if (isUnitPrice && quantity) formData.set("quantity", quantity)
        formData.set("date", raw.get("date") as string)
        // Map "__none__" sentinel back to empty (action handles null conversion)
        formData.set("expenseCategoryId", categoryId === "__none__" ? "" : categoryId)
        formData.set("isBillable", String(isBillable))
        formData.set("notes", (raw.get("notes") as string) ?? "")
        if (isAdmin && forUserId !== "__self__") {
            formData.set("forUserId", forUserId)
        }
        if (receiptUrl) formData.set("receiptUrl", receiptUrl)

        try {
            if (mode === "create") {
                await logExpense(formData)
                toast.success("Expense logged")
            } else if (expense) {
                await updateExpense(expense.id, formData)
                toast.success("Expense updated")
            }
            setOpen(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : String(error) || "Failed to save expense")
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!expense) return
        if (!confirm("Are you sure you want to delete this expense?")) return
        setDeleting(true)
        try {
            await deleteExpense(expense.id)
            toast.success("Expense deleted")
            setOpen(false)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : String(error) || "Failed to delete expense")
        } finally {
            setDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) resetForm() }}>
            <DialogTrigger asChild>
                {children || (
                    <Button
                        variant={mode === "create" ? "default" : "outline"}
                        size={mode === "create" ? "default" : "sm"}
                    >
                        {mode === "create" ? (
                            <><Plus className="w-4 h-4 mr-2" /> Log Expense</>
                        ) : (
                            <Edit className="w-4 h-4" />
                        )}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Log Expense" : "Edit Expense"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Record a new expense against a project."
                            : "Update the expense details."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4 pt-2">
                    {/* Date */}
                    <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                            id="date"
                            name="date"
                            type="date"
                            required
                            defaultValue={expense ? toDateInput(expense.date) : toDateInput(new Date())}
                        />
                    </div>

                    {/* Project */}
                    <div className="space-y-2">
                        <Label>Project *</Label>
                        <Select value={projectId} onValueChange={setProjectId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Amount — or quantity + computed amount for unit-price categories */}
                    {isUnitPrice && selectedCategory ? (
                        <div className="space-y-2">
                            <Label htmlFor="quantity">
                                Quantity ({selectedCategory.unitName || "units"}) *
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="quantity"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    placeholder="e.g. 12.5"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="flex-1"
                                />
                                {computedAmount != null && (
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                        = ${computedAmount.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                ${(selectedCategory.unitPriceCents! / 100).toFixed(2)} per {selectedCategory.unitName || "unit"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount ($) *</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                placeholder="49.99"
                                defaultValue={expense ? displayAmount(expense.amountCents) : ""}
                            />
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Input
                            id="description"
                            name="description"
                            required
                            placeholder="Flight to client site"
                            defaultValue={expense?.description ?? ""}
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">No category</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Billable */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="isBillable"
                            checked={isBillable}
                            onCheckedChange={(v) => setIsBillable(v === true)}
                        />
                        <Label htmlFor="isBillable" className="cursor-pointer">
                            Billable to client
                        </Label>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Optional additional notes..."
                            defaultValue={expense?.notes ?? ""}
                            rows={3}
                        />
                    </div>

                    {/* Receipt */}
                    <div className="space-y-2">
                        <Label>Receipt</Label>
                        <ReceiptUpload value={receiptUrl} onChange={setReceiptUrl} />
                    </div>

                    {/* Admin: log for another member */}
                    {isAdmin && members && members.length > 0 && mode === "create" && (
                        <div className="space-y-2">
                            <Label>Log for member (optional)</Label>
                            <Select value={forUserId} onValueChange={setForUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Myself" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__self__">Myself</SelectItem>
                                    {members.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name ?? m.id}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter className="pt-4 flex items-center justify-between sm:justify-between">
                        {mode === "edit" ? (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                disabled={deleting || loading}
                                className="mr-auto"
                            >
                                {deleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Delete
                            </Button>
                        ) : (
                            <div />
                        )}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={loading || deleting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || deleting}>
                                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {mode === "create" ? "Log Expense" : "Save Changes"}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

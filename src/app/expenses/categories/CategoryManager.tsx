"use client"

import { useState } from "react"
import { createExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from "@/app/actions/expenses"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

export interface Category {
    id: string
    name: string
    isActive: boolean
    unitPriceCents: number | null
    unitName: string | null
    expenseCount: number
}

interface Props {
    categories: Category[]
    showArchived: boolean
}

export function CategoryManager({ categories, showArchived }: Props) {
    const [editing, setEditing] = useState<null | "new" | string>(null)
    const [name, setName] = useState("")
    const [hasUnitPrice, setHasUnitPrice] = useState(false)
    const [unitPrice, setUnitPrice] = useState("")
    const [unitName, setUnitName] = useState("")
    const [loading, setLoading] = useState(false)

    function startNew() {
        setEditing("new")
        setName("")
        setHasUnitPrice(false)
        setUnitPrice("")
        setUnitName("")
    }

    function startEdit(cat: Category) {
        setEditing(cat.id)
        setName(cat.name)
        setHasUnitPrice(cat.unitPriceCents !== null)
        setUnitPrice(cat.unitPriceCents ? (cat.unitPriceCents / 100).toFixed(2) : "")
        setUnitName(cat.unitName ?? "")
    }

    function cancel() {
        setEditing(null)
    }

    async function save() {
        if (!name.trim()) { toast.error("Category name is required"); return }
        const unitPriceCents = hasUnitPrice && unitPrice ? Math.round(parseFloat(unitPrice) * 100) : null
        const resolvedUnitName = hasUnitPrice ? unitName.trim() || null : null

        setLoading(true)
        try {
            if (editing === "new") {
                await createExpenseCategory(name.trim(), unitPriceCents, resolvedUnitName)
                toast.success("Category created")
            } else if (editing) {
                await updateExpenseCategory(editing, { name: name.trim(), unitPriceCents, unitName: resolvedUnitName })
                toast.success("Category updated")
            }
            setEditing(null)
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : String(e) || "Failed to save")
        } finally {
            setLoading(false)
        }
    }

    async function archive(id: string, currentlyActive: boolean) {
        try {
            await updateExpenseCategory(id, { isActive: !currentlyActive })
            toast.success(currentlyActive ? "Category archived" : "Category restored")
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : String(e) || "Failed to update")
        }
    }

    async function remove(id: string) {
        setLoading(true)
        try {
            await deleteExpenseCategory(id)
            toast.success("Category deleted")
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : String(e) || "Failed to delete")
        } finally {
            setLoading(false)
        }
    }

    const visible = showArchived ? categories : categories.filter((c) => c.isActive)

    return (
        <div className="space-y-4 max-w-2xl">
            <Button onClick={startNew} disabled={editing !== null}>
                <Plus className="w-4 h-4 mr-2" /> New category
            </Button>

            {/* Inline form */}
            {editing !== null && (
                <div className="rounded-lg border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="cat-name">Category name</Label>
                        <Input
                            id="cat-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Mileage"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="hasUnitPrice"
                                checked={hasUnitPrice}
                                onCheckedChange={(v) => setHasUnitPrice(v === true)}
                            />
                            <Label htmlFor="hasUnitPrice" className="cursor-pointer">
                                This expense has a unit price.{" "}
                                <span className="text-muted-foreground text-xs font-normal underline cursor-help" title="Unit prices let you track expenses by quantity rather than price. Teifi Time automatically calculates the total. Examples: $0.70 per mile, $2 per copy.">
                                    What&apos;s a unit price?
                                </span>
                            </Label>
                        </div>

                        {hasUnitPrice && (
                            <div className="pl-6 space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    Unit prices let you track expenses by quantity rather than price. Teifi Time automatically
                                    calculates the total price of all units tracked. Some examples of unit prices: $1 per mile,
                                    $2 per copy, $3 per cake.
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-24"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        placeholder="0.00"
                                    />
                                    <span className="text-sm">per</span>
                                    <Input
                                        className="w-36"
                                        value={unitName}
                                        onChange={(e) => setUnitName(e.target.value)}
                                        placeholder="Unit name"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={save} disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editing === "new" ? "Create category" : "Update category"}
                        </Button>
                        <Button variant="outline" onClick={cancel} disabled={loading}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Category list */}
            <div className="divide-y divide-sidebar-border rounded-lg border border-sidebar-border overflow-hidden">
                {visible.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No categories yet. Create your first expense category.
                    </div>
                ) : (
                    visible.map((cat) => (
                        <div
                            key={cat.id}
                            className={`flex items-center gap-3 px-4 py-3 ${!cat.isActive ? "opacity-50" : ""}`}
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEdit(cat)}
                                disabled={editing !== null}
                            >
                                Edit
                            </Button>
                            <span className="flex-1 font-medium text-sm">
                                {cat.name}
                                {cat.unitPriceCents !== null && cat.unitName && (
                                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                                        (${(cat.unitPriceCents / 100).toFixed(2)} per {cat.unitName})
                                    </span>
                                )}
                                {!cat.isActive && (
                                    <span className="ml-2 text-xs text-muted-foreground">(archived)</span>
                                )}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => archive(cat.id, cat.isActive)}
                                disabled={editing !== null || loading}
                            >
                                {cat.isActive ? "Archive" : "Restore"}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={cat.expenseCount > 0 || editing !== null || loading}
                                onClick={() => remove(cat.id)}
                                className="text-destructive hover:text-destructive disabled:opacity-40"
                            >
                                Delete
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

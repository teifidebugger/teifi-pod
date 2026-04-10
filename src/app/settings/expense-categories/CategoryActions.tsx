"use client"

import { useState, useTransition } from "react"
import {
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
} from "@/app/actions/expenses"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function AddCategoryForm() {
    const [value, setValue] = useState("")
    const [pending, startTransition] = useTransition()

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!value.trim()) return
        startTransition(async () => {
            try {
                await createExpenseCategory(value.trim())
                setValue("")
                toast.success("Category created")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) || "Failed to create category")
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="New category name…"
                className="max-w-xs"
                disabled={pending}
            />
            <Button type="submit" disabled={pending || !value.trim()}>
                {pending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add
            </Button>
        </form>
    )
}

interface CategoryActiveToggleProps {
    id: string
    isActive: boolean
}

export function CategoryActiveToggle({ id, isActive }: CategoryActiveToggleProps) {
    const [pending, startTransition] = useTransition()

    function handleToggle(checked: boolean) {
        startTransition(async () => {
            try {
                await updateExpenseCategory(id, { isActive: checked })
                toast.success(checked ? "Category activated" : "Category deactivated")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) || "Failed to update category")
            }
        })
    }

    return (
        <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={pending}
            aria-label="Toggle active"
        />
    )
}

interface DeleteCategoryButtonProps {
    id: string
    name: string
}

export function DeleteCategoryButton({ id, name }: DeleteCategoryButtonProps) {
    const [pending, startTransition] = useTransition()

    function handleDelete() {
        startTransition(async () => {
            try {
                await deleteExpenseCategory(id)
                toast.success("Category deleted")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : String(err) || "Failed to delete category")
            }
        })
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={pending} className="text-muted-foreground hover:text-destructive">
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete &ldquo;{name}&rdquo;?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This category will be permanently deleted. This action cannot be undone.
                        Categories with existing expenses cannot be deleted — deactivate them instead.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

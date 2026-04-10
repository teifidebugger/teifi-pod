"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { removeLineItem } from "@/app/actions/invoices"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { toast } from "sonner"

export function RemoveButton({ lineItemId }: { lineItemId: string }) {
    const [pending, startTransition] = useTransition()
    const router = useRouter()

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            disabled={pending}
            onClick={() => {
                startTransition(async () => {
                    try {
                        await removeLineItem(lineItemId)
                        router.refresh()
                    } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : "Failed to remove line item")
                    }
                })
            }}
        >
            <X className="h-3.5 w-3.5" />
        </Button>
    )
}

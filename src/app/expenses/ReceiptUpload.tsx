"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, X, Loader2, FileImage } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface Props {
    value: string | null
    onChange: (url: string | null) => void
}

export function ReceiptUpload({ value, onChange }: Props) {
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const fd = new FormData()
            fd.append("file", file)
            const res = await fetch("/api/upload", { method: "POST", body: fd })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? "Upload failed")
            onChange(data.url)
            toast.success("Receipt uploaded")
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Upload failed")
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ""
        }
    }

    const isImage = value && /\.(jpg|jpeg|png|webp|gif)$/i.test(value)

    return (
        <div className="space-y-2">
            {value ? (
                <div className="flex items-center gap-2">
                    {isImage ? (
                        <a href={value} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            <Image src={value} alt="Receipt" width={48} height={48} className="rounded border border-sidebar-border object-cover h-12 w-12" />
                            View receipt
                        </a>
                    ) : (
                        <a href={value} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            <FileImage className="h-4 w-4" />
                            View receipt
                        </a>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onChange(null)}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Paperclip className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? "Uploading…" : "Attach receipt"}
                </Button>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFile}
            />
        </div>
    )
}

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Maximize2, ExternalLink, Download, Copy, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PortalImageViewerProps {
    src: string
    alt?: string
    compact?: boolean
}

function getFilename(src: string): string {
    try {
        // For proxied URLs like /api/portal/image?url=...
        const urlParam = new URL(src, "http://localhost").searchParams.get("url")
        if (urlParam) {
            const decoded = decodeURIComponent(urlParam)
            const parts = decoded.split("/")
            const last = parts[parts.length - 1]?.split("?")[0]
            if (last) return last
        }
        // For direct URLs
        const parts = src.split("/")
        const last = parts[parts.length - 1]?.split("?")[0]
        if (last) return last
    } catch {
        // ignore
    }
    return "image"
}

export function PortalImageViewer({ src, alt, compact }: PortalImageViewerProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [hovered, setHovered] = useState(false)
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const caption = alt || getFilename(src)

    const openLightbox = useCallback(() => setLightboxOpen(true), [])
    const closeLightbox = useCallback(() => setLightboxOpen(false), [])

    // Escape key to close lightbox
    useEffect(() => {
        if (!lightboxOpen) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLightbox()
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [lightboxOpen, closeLightbox])

    // Prevent body scroll while lightbox is open
    useEffect(() => {
        if (lightboxOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => { document.body.style.overflow = "" }
    }, [lightboxOpen])

    const handleCopyUrl = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            // Copy the original URL (unwrap proxy if needed)
            let originalUrl = src
            try {
                const urlParam = new URL(src, window.location.origin).searchParams.get("url")
                if (urlParam) originalUrl = decodeURIComponent(urlParam)
            } catch { /* use src as-is */ }
            await navigator.clipboard.writeText(originalUrl)
            setCopied(true)
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
        } catch {
            // clipboard not available
        }
    }, [src])

    const handleDownload = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        const a = document.createElement("a")
        a.href = src
        a.download = getFilename(src)
        a.target = "_blank"
        a.rel = "noopener noreferrer"
        a.click()
    }, [src])

    const handleOpenNewTab = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        window.open(src, "_blank", "noopener,noreferrer")
    }, [src])

    const handleExpand = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        openLightbox()
    }, [openLightbox])

    return (
        <>
            {/* Image container */}
            <span
                className="block my-4 group"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <span className="relative inline-block max-w-full">
                    {/* The image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={alt ?? ""}
                        loading="lazy"
                        onClick={openLightbox}
                        className={cn(
                            "block rounded-lg border border-border/60 shadow-sm cursor-zoom-in",
                            "transition-all duration-200",
                            compact ? "max-h-40 max-w-[280px] w-auto" : "max-w-full",
                            hovered && "border-primary/40 shadow-md"
                        )}
                    />

                    {/* Hover action overlay — top-right corner */}
                    <span
                        className={cn(
                            "absolute top-2 right-2 flex items-center gap-1",
                            "transition-opacity duration-150",
                            hovered ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}
                        aria-hidden={!hovered}
                    >
                        <ActionButton
                            label="View full size"
                            onClick={handleExpand}
                        >
                            <Maximize2 className="h-3.5 w-3.5" />
                        </ActionButton>
                        <ActionButton
                            label="Open in new tab"
                            onClick={handleOpenNewTab}
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                        </ActionButton>
                        <ActionButton
                            label="Download"
                            onClick={handleDownload}
                        >
                            <Download className="h-3.5 w-3.5" />
                        </ActionButton>
                        <ActionButton
                            label={copied ? "Copied!" : "Copy URL"}
                            onClick={handleCopyUrl}
                        >
                            <Copy className="h-3.5 w-3.5" />
                            {copied && (
                                <span className="text-[10px] font-medium leading-none">
                                    Copied!
                                </span>
                            )}
                        </ActionButton>
                    </span>
                </span>

                {/* Caption */}
                {caption && (
                    <span className="block text-xs text-muted-foreground text-center mt-1.5 truncate max-w-full px-2">
                        {caption}
                    </span>
                )}
            </span>

            {/* Lightbox portal */}
            {lightboxOpen && (
                <LightboxOverlay src={src} alt={alt} caption={caption} onClose={closeLightbox} />
            )}
        </>
    )
}

// ── Small action button ────────────────────────────────────────────────────────

interface ActionButtonProps {
    label: string
    onClick: (e: React.MouseEvent) => void
    children: React.ReactNode
}

function ActionButton({ label, onClick, children }: ActionButtonProps) {
    return (
        <button
            type="button"
            title={label}
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-1 h-7 px-2 rounded-md",
                "bg-black/70 text-white backdrop-blur-sm",
                "text-xs font-medium",
                "hover:bg-black/90 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            )}
        >
            {children}
        </button>
    )
}

// ── Lightbox overlay ───────────────────────────────────────────────────────────

interface LightboxOverlayProps {
    src: string
    alt?: string
    caption: string
    onClose: () => void
}

function LightboxOverlay({ src, alt, caption, onClose }: LightboxOverlayProps) {
    // Click backdrop (not image) to close
    const handleBackdropClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) onClose()
        },
        [onClose]
    )

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={alt ?? caption ?? "Image viewer"}
            className={cn(
                "fixed inset-0 z-50",
                "bg-black/85 backdrop-blur-sm",
                "flex flex-col items-center justify-center",
                "animate-in fade-in duration-150"
            )}
            onClick={handleBackdropClick}
        >
            {/* Close button */}
            <button
                type="button"
                onClick={onClose}
                aria-label="Close image viewer"
                className={cn(
                    "absolute top-4 right-4",
                    "inline-flex items-center justify-center w-9 h-9 rounded-full",
                    "bg-white/10 text-white hover:bg-white/20",
                    "transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                )}
            >
                <X className="h-5 w-5" />
            </button>

            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt ?? ""}
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                onClick={e => e.stopPropagation()}
            />

            {/* Caption bar */}
            {caption && (
                <p className="mt-3 text-sm text-white/70 text-center max-w-[80vw] truncate px-4">
                    {caption}
                </p>
            )}
        </div>
    )
}

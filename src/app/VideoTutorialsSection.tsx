"use client"

import { useState } from "react"
import { PlayCircle, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface TutorialVideo {
    id: string
    title: string
    description: string
    src: string
    /** Optional tag shown on the card e.g. "UAT Portal", "Time Tracking" */
    tag?: string
}

const VIDEOS: TutorialVideo[] = [
    {
        id: "uat-portal",
        title: "Setup UAT Portal",
        description: "Learn how to link Linear teams, invite clients, and manage UAT feedback through the portal.",
        src: "/video/uat.webm",
        tag: "UAT Portal",
    },
]

export function VideoTutorialsSection() {
    const [active, setActive] = useState<TutorialVideo | null>(null)

    return (
        <>
            <Dialog open={!!active} onOpenChange={open => { if (!open) setActive(null) }}>
                <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
                    <DialogHeader className="px-5 pt-5 pb-3 flex flex-row items-start justify-between gap-4">
                        <div>
                            <DialogTitle className="text-base">{active?.title}</DialogTitle>
                            {active?.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{active.description}</p>
                            )}
                        </div>
                    </DialogHeader>
                    {active && (
                        <>
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <video
                                key={active.id}
                                src={active.src}
                                controls
                                autoPlay
                                className="w-full max-h-[70vh] bg-black"
                                onError={e => {
                                    const el = e.currentTarget
                                    el.style.display = "none"
                                    const fallback = el.nextElementSibling as HTMLElement | null
                                    if (fallback) fallback.style.display = "block"
                                }}
                            />
                            <p className="hidden px-5 py-4 text-sm text-muted-foreground">
                                Video unavailable. Please contact your administrator.
                            </p>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <section className="space-y-3">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-foreground">Video Tutorials</h3>
                    <div className="flex-1 h-px bg-border/60" />
                    <span className="text-xs text-muted-foreground tabular-nums">{VIDEOS.length} video{VIDEOS.length !== 1 ? "s" : ""}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {VIDEOS.map(video => (
                        <button
                            key={video.id}
                            onClick={() => setActive(video)}
                            className="group text-left rounded-lg border border-border bg-sidebar hover:bg-sidebar/80 overflow-hidden transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {/* Thumbnail area */}
                            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                <video
                                    src={`${video.src}#t=0.1`}
                                    preload="metadata"
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur-sm group-hover:bg-black/70 transition-colors"
                                        style={{ boxShadow: "0 0 20px color-mix(in srgb, #1492FF 40%, transparent)" }}
                                    >
                                        <PlayCircle className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                {video.tag && (
                                    <span className="absolute top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-black/60 text-white/80 backdrop-blur-sm border border-white/10">
                                        {video.tag}
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="px-3 py-2.5">
                                <p className="text-xs font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                                    {video.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                                    {video.description}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </section>
        </>
    )
}

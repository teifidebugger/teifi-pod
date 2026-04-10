import Link from "next/link"

interface LiveSessionBannerProps {
  liveSession: { id: string; name: string } | null
}

export function LiveSessionBanner({ liveSession }: LiveSessionBannerProps) {
  if (!liveSession) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border-l-2 border-l-green-500 border border-border/50 bg-muted/30 px-4 py-3 text-sm">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
      </span>
      <span className="flex-1 text-foreground/80">
        Live session: <span className="font-medium text-foreground">{liveSession.name}</span>
      </span>
      <Link
        href={`/estimation/${liveSession.id}`}
        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Join →
      </Link>
    </div>
  )
}

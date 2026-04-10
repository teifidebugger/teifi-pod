import Link from "next/link"
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PortalStatusPanelProps {
  setupNeeded: boolean
  active: boolean
  clientsReady: number
  usersTotal: number
}

export function PortalStatusPanel({ setupNeeded, active, clientsReady, usersTotal }: PortalStatusPanelProps) {
  if (!setupNeeded && !active) return null

  if (setupNeeded) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-4 h-full">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Get started with UAT Portal</p>
        </div>
        <ol className="space-y-1.5 text-sm text-muted-foreground list-none mb-4">
          <li className="flex items-start gap-2">
            <span className="shrink-0 flex items-center justify-center size-4 rounded-full border border-border text-[10px] font-medium text-foreground/50 mt-0.5">1</span>
            <span>Link a Linear team to each client in <Link href="/clients" className="text-foreground/70 underline underline-offset-2 hover:text-foreground transition-colors">Clients</Link></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 flex items-center justify-center size-4 rounded-full border border-border text-[10px] font-medium text-foreground/50 mt-0.5">2</span>
            <span>Invite client users via the client detail page</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 flex items-center justify-center size-4 rounded-full border border-border text-[10px] font-medium text-foreground/50 mt-0.5">3</span>
            <span>Preview the portal before sharing with clients</span>
          </li>
        </ol>
        <Button asChild variant="outline" size="sm" className="h-7 text-xs px-3 border-border/60">
          <Link href="/settings/portal">Set up UAT Portal →</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">UAT Portal</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-2xl font-semibold text-foreground tracking-tight">{clientsReady}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {clientsReady === 1 ? "client" : "clients"} with portal active
          </p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-foreground tracking-tight">{usersTotal}</p>
          <p className="text-xs text-muted-foreground mt-1">portal users across all clients</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-3 text-muted-foreground hover:text-foreground">
          <Link href="/uat">Open Portal →</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-7 text-xs px-3 border-border/60">
          <Link href="/settings/portal">Manage →</Link>
        </Button>
      </div>
    </div>
  )
}

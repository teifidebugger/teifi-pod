import Link from "next/link"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  href: string
  badge?: string
  badgeVariant?: "amber" | "green" | "blue" | "red"
}

const badgeStyles = {
  amber: "bg-amber-100/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  green: "bg-green-100/80 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  blue: "bg-blue-100/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  red: "bg-red-100/80 text-red-700 dark:bg-red-950/40 dark:text-red-400",
}

export function StatCard({ label, value, href, badge, badgeVariant = "amber" }: StatCardProps) {
  return (
    <Link href={href}>
      <div className="rounded-lg border border-border/50 bg-card px-4 py-4 hover:border-border hover:bg-muted/20 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold mt-0.5 text-foreground tracking-tight">{value}</p>
          </div>
          {badge && (
            <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded mt-0.5", badgeStyles[badgeVariant])}>
              {badge}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

import { format, addDays } from "date-fns"

interface WeekHeaderProps {
  weeks: Date[]
  todayWeekStart: string
  skillLabelWidth?: number
}

export function WeekHeader({ weeks, todayWeekStart, skillLabelWidth = 150 }: WeekHeaderProps) {
  return (
    <div className="flex border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div style={{ width: skillLabelWidth, minWidth: skillLabelWidth }} className="shrink-0 border-r px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Skill
      </div>
      <div className="flex flex-1">
        {weeks.map(week => {
          const weekStr = format(week, "yyyy-MM-dd")
          const isCurrentWeek = weekStr === todayWeekStart
          const endDate = addDays(week, 4)
          const label = format(week, "MMM d") + "\u2013" + format(endDate, "d")
          return (
            <div
              key={weekStr}
              className={`flex-1 min-w-[80px] px-2 py-2 text-center text-xs border-r last:border-r-0 ${
                isCurrentWeek
                  ? "bg-primary/5 font-semibold text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

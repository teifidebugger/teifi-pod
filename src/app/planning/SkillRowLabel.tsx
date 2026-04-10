interface SkillRowLabelProps {
  skill: string
  width?: number
}

export function SkillRowLabel({ skill, width = 150 }: SkillRowLabelProps) {
  return (
    <div
      style={{ width, minWidth: width }}
      className="shrink-0 border-r px-3 flex items-center text-sm font-medium text-foreground/80"
    >
      {skill}
    </div>
  )
}

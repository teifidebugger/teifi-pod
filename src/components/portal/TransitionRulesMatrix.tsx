import { UAT_COLUMNS, type AllowedTransitions, type UATColumn, type UATColumnConfig } from "@/lib/uat-mapping"

function hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace("#", "")
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

interface TransitionRulesMatrixProps {
    fromColumns: UATColumn[]
    toColumns: UATColumn[]
    transitions: AllowedTransitions
    onChange: (from: UATColumn, to: UATColumn) => void
    disabled?: boolean
    columns: UATColumnConfig[]
    actor?: "clients" | "staff"
}

export function TransitionRulesMatrix({
    fromColumns,
    toColumns,
    transitions,
    onChange,
    disabled,
    columns,
    actor = "clients",
}: TransitionRulesMatrixProps) {
    function getCol(id: UATColumn): UATColumnConfig {
        return columns.find(c => c.id === id) ?? UAT_COLUMNS.find(c => c.id === id) ?? { id, title: id, description: "", color: "#6b7280", allowIssueCreation: false }
    }

    return (
        <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
            {fromColumns.map(from => {
                const fromCol = getCol(from)
                return (
                    <div key={from} className="px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: fromCol.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                                Tickets in <span className="font-medium text-foreground">{fromCol.title}</span> — {actor === "staff" ? "staff" : "clients"} can move to
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pl-4.5">
                            {toColumns.filter(to => to !== from).map(to => {
                                const toCol = getCol(to)
                                const isChecked = (transitions[from] ?? []).includes(to)
                                return (
                                    <button
                                        key={to}
                                        type="button"
                                        onClick={() => !disabled && onChange(from, to)}
                                        disabled={disabled}
                                        className={[
                                            "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                                            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                                        ].join(" ")}
                                        style={isChecked ? {
                                            backgroundColor: hexToRgba(toCol.color, 0.12),
                                            color: toCol.color,
                                            borderColor: hexToRgba(toCol.color, 0.3),
                                        } : {
                                            backgroundColor: "transparent",
                                            color: "var(--muted-foreground)",
                                            borderColor: "var(--border)",
                                        }}
                                    >
                                        <span
                                            className="h-1.5 w-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: isChecked ? toCol.color : "var(--muted-foreground)", opacity: isChecked ? 1 : 0.5 }}
                                        />
                                        {toCol.title}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

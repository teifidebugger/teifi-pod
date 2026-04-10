export const COLOR_SWATCHES = [
    { key: "orange", hex: "#f97316" },
    { key: "green",  hex: "#22c55e" },
    { key: "sky",    hex: "#38bdf8" },
    { key: "blue",   hex: "#3b82f6" },
    { key: "purple", hex: "#a855f7" },
    { key: "pink",   hex: "#ec4899" },
    { key: "red",    hex: "#ef4444" },
    { key: "gray",   hex: "#6b7280" },
] as const

export type ColorKey = (typeof COLOR_SWATCHES)[number]["key"]

export const COLOR_HEX_MAP = Object.fromEntries(
    COLOR_SWATCHES.map(s => [s.key, s.hex])
) as Record<string, string>

export const DEFAULT_COLOR_LABELS: Record<ColorKey, string> = {
    orange: "Orange",
    green:  "Green",
    sky:    "Sky",
    blue:   "Blue",
    purple: "Purple",
    pink:   "Pink",
    red:    "Red",
    gray:   "Gray",
}

export const PROJECT_COLOR_CLASSES: Record<string, string> = {
    orange: "bg-orange-100 text-orange-800 border-orange-300",
    green: "bg-green-100 text-green-800 border-green-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    sky: "bg-sky-100 text-sky-800 border-sky-300",
    purple: "bg-purple-100 text-purple-800 border-purple-300",
    pink: "bg-pink-100 text-pink-800 border-pink-300",
    red: "bg-red-100 text-red-800 border-red-300",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    teal: "bg-teal-100 text-teal-800 border-teal-300",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-300",
    gray: "bg-gray-100 text-gray-800 border-gray-300",
    rose: "bg-rose-100 text-rose-800 border-rose-300",
    violet: "bg-violet-100 text-violet-800 border-violet-300",
    cyan: "bg-cyan-100 text-cyan-800 border-cyan-300",
    amber: "bg-amber-100 text-amber-800 border-amber-300",
    lime: "bg-lime-100 text-lime-800 border-lime-300",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-300",
}

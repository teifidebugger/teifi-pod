/**
 * Deterministic avatar background color based on a person's name.
 * Returns a Tailwind bg class + matching text class.
 */

const AVATAR_PALETTES = [
    { bg: "bg-blue-500",    text: "text-white" },
    { bg: "bg-violet-500",  text: "text-white" },
    { bg: "bg-emerald-500", text: "text-white" },
    { bg: "bg-amber-500",   text: "text-white" },
    { bg: "bg-rose-500",    text: "text-white" },
    { bg: "bg-cyan-500",    text: "text-white" },
    { bg: "bg-pink-500",    text: "text-white" },
    { bg: "bg-orange-500",  text: "text-white" },
    { bg: "bg-teal-500",    text: "text-white" },
    { bg: "bg-indigo-500",  text: "text-white" },
]

export function avatarColor(name: string): { bg: string; text: string } {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff
    }
    return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]
}

/** Convenience: just the bg class */
export function avatarBg(name: string): string {
    return avatarColor(name).bg
}

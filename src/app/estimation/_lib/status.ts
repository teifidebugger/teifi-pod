export const STATUS_BADGE: Record<string, string> = {
    LOBBY:     "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    ACTIVE:    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    COMPLETED: "bg-muted text-muted-foreground border-border",
}

export const STATUS_LABEL: Record<string, string> = {
    LOBBY: "Lobby",
    ACTIVE: "Active",
    COMPLETED: "Completed",
}

export const STATUS_DESCRIPTION: Record<string, string> = {
    LOBBY: "Session created — waiting for host to start",
    ACTIVE: "Voting in progress",
    COMPLETED: "Session completed",
}

export const DECK_LABEL: Record<string, string> = {
    fibonacci:   "Fibonacci",
    tshirt:      "T-Shirt",
    powers_of_2: "Powers of 2",
    custom:      "Custom",
}

export const DECK_TOOLTIP: Record<string, string> = {
    fibonacci: "Fibonacci scale: 1, 2, 3, 5, 8, 13, 21",
    tshirt: "T-shirt sizes: XS, S, M, L, XL",
    powers_of_2: "Powers of two: 1, 2, 4, 8, 16, 32",
}

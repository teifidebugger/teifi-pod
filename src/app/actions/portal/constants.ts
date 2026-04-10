export const RATE_LIMIT_MAX = 10
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

export function resolveActorRole(isStaff: boolean): 'staff' | 'client' {
    if (isStaff) return 'staff'
    return 'client'
}

export function assertTeamAccess(
    profile: { client: { linearTeams: Array<{ id: string }> } },
    teamId: string | null | undefined,
    msg = "Access denied: team not linked to your client",
): asserts teamId is string {
    if (!teamId || !profile.client.linearTeams.some(t => t.id === teamId)) {
        throw new Error(msg)
    }
}

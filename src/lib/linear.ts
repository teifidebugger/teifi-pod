import { LinearClient } from '@linear/sdk'
import { createClient as createLinearGenqlClient } from '@/lib/linear-genql'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Create a Linear client authenticated with the given user's stored OAuth token.
 * Returns null if the user has not connected their Linear account.
 */
export async function getLinearClient(userId: string): Promise<LinearClient | null> {
    const tokenRecord = await prisma.linearUserToken.findFirst({
        where: { userId },
    })
    if (!tokenRecord) return null
    let accessToken: string
    try {
        accessToken = decryptToken(tokenRecord.accessToken)
    } catch {
        await prisma.linearUserToken.deleteMany({ where: { userId } })
        return null
    }
    return new LinearClient({ accessToken })
}

// ─── Linear OAuth helpers ─────────────────────────────────────────────────────

const LINEAR_AUTH_URL = 'https://linear.app/oauth/authorize'
const LINEAR_TOKEN_URL = 'https://api.linear.app/oauth/token'

export function buildLinearAuthUrl(state: string, scope: 'read' | 'read,write' = 'read'): string {
    const params = new URLSearchParams({
        client_id: process.env.LINEAR_CLIENT_ID!,
        redirect_uri: `${process.env.BETTER_AUTH_URL}/api/linear/callback`,
        response_type: 'code',
        scope,
        state,
        prompt: 'consent',
    })
    return `${LINEAR_AUTH_URL}?${params.toString()}`
}

export async function exchangeLinearCode(code: string): Promise<{
    accessToken: string
    tokenType: string
    expiresIn: number | null
    scope: string
}> {
    const res = await fetch(LINEAR_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.LINEAR_CLIENT_ID!,
            client_secret: process.env.LINEAR_CLIENT_SECRET!,
            redirect_uri: `${process.env.BETTER_AUTH_URL}/api/linear/callback`,
            grant_type: 'authorization_code',
            code,
        }),
    })

    if (!res.ok) {
        const body = await res.text()
        throw new Error(`Linear token exchange failed: ${body}`)
    }

    const data = await res.json()
    return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in ?? null,
        scope: data.scope,
    }
}

/**
 * Fetch the current Linear user's profile using an access token.
 * Uses genql for type-safe single-request read.
 */
export async function getLinearViewer(accessToken: string): Promise<{
    id: string
    email: string
    name: string
}> {
    const client = createLinearGenqlClient({
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await client.query({
        viewer: {
            id: true,
            email: true,
            name: true,
        },
    })
    if (!data.viewer?.id) throw new Error('Linear viewer query returned no user')
    return {
        id: data.viewer.id,
        email: data.viewer.email ?? '',
        name: data.viewer.name ?? '',
    }
}

// ─── Team / Cycle cache helpers ───────────────────────────────────────────────

/**
 * Sync a workspace's Linear Teams into the DB cache using the given access token.
 * Typically called on webhook events or on first connect.
 */
export async function syncLinearTeams(
    workspaceId: string,
    accessToken: string
): Promise<void> {
    const client = createLinearGenqlClient({
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    const data = await client.query({
        teams: {
            __args: {},
            nodes: {
                id: true,
                name: true,
                key: true,
                cycles: {
                    __args: { first: 10, orderBy: 'createdAt' as const },
                    nodes: {
                        id: true,
                        name: true,
                        number: true,
                        startsAt: true,
                        endsAt: true,
                    },
                },
            },
        },
    })

    const teams = data.teams?.nodes ?? []

    for (const team of teams) {
        if (!team.id) continue
        await prisma.linearTeam.upsert({
            where: { id: team.id },
            create: { id: team.id, name: team.name ?? '', key: team.key ?? '', workspaceId, syncedAt: new Date() },
            update: { name: team.name ?? '', key: team.key ?? '', syncedAt: new Date() },
        })

        for (const cycle of team.cycles?.nodes ?? []) {
            if (!cycle.id) continue
            await prisma.linearCycle.upsert({
                where: { id: cycle.id },
                create: {
                    id: cycle.id,
                    name: cycle.name ?? null,
                    number: cycle.number ?? 0,
                    startsAt: cycle.startsAt ? new Date(cycle.startsAt) : null,
                    endsAt: cycle.endsAt ? new Date(cycle.endsAt) : null,
                    teamId: team.id,
                    syncedAt: new Date(),
                },
                update: {
                    name: cycle.name ?? null,
                    startsAt: cycle.startsAt ? new Date(cycle.startsAt) : null,
                    endsAt: cycle.endsAt ? new Date(cycle.endsAt) : null,
                    syncedAt: new Date(),
                },
            })
        }
    }
}

/**
 * Fetch issues on-demand from Linear and cache them locally.
 * Searches by identifier prefix (e.g. "ENG") or title substring.
 */
export async function searchAndCacheLinearIssues(
    query: string,
    accessToken: string,
    teamId: string
): Promise<Array<{ id: string; identifier: string; title: string; state: string; url: string }>> {
    const client = createLinearGenqlClient({
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    const data = await client.query({
        issues: {
            __args: {
                filter: {
                    team: { id: { eq: teamId } },
                    or: [
                        { title: { containsIgnoreCase: query } },
                        { identifier: { startsWith: query } },
                    ],
                },
                first: 20,
            },
            nodes: {
                id: true,
                identifier: true,
                title: true,
                url: true,
                state: { name: true },
                team: { id: true },
                cycle: { id: true },
            },
        },
    })

    const issues = data.issues?.nodes ?? []

    // Cache them
    for (const issue of issues) {
        if (!issue.id) continue
        await prisma.linearIssue.upsert({
            where: { id: issue.id },
            create: {
                id: issue.id,
                identifier: issue.identifier ?? '',
                title: issue.title ?? '',
                state: issue.state?.name ?? '',
                url: issue.url ?? '',
                teamId: issue.team?.id ?? teamId,
                cycleId: issue.cycle?.id ?? null,
                syncedAt: new Date(),
            },
            update: {
                title: issue.title ?? '',
                state: issue.state?.name ?? '',
                syncedAt: new Date(),
            },
        })
    }

    return issues.filter(i => i.id).map(i => ({
        id: i.id!,
        identifier: i.identifier ?? '',
        title: i.title ?? '',
        state: i.state?.name ?? '',
        url: i.url ?? '',
    }))
}

// ─── Live fetch helpers (no DB cache) ────────────────────────────────────────

export interface LinearTeamInfo {
    id: string
    name: string
    key: string
}

export interface LinearIssueInfo {
    id: string
    identifier: string
    title: string
    state: string
    url: string
    teamId: string
}

/**
 * Fetch all teams the user belongs to, directly from Linear API.
 * Uses genql for type-safe field selection. No DB cache involved.
 */
export async function getLinearTeams(accessToken: string): Promise<LinearTeamInfo[]> {
    const client = createLinearGenqlClient({
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    const data = await client.query({
        teams: {
            __args: {},
            nodes: { id: true, name: true, key: true },
        },
    })

    // Deduplicate by team ID
    const uniqueTeams = new Map<string, LinearTeamInfo>()
    for (const t of (data.teams?.nodes ?? [])) {
        if (t.id && !uniqueTeams.has(t.id)) {
            uniqueTeams.set(t.id, { id: t.id, name: t.name ?? '', key: t.key ?? '' })
        }
    }
    return Array.from(uniqueTeams.values())
}

export type LinearProjectInfo = {
    id: string
    name: string
    state: string   // "planned" | "started" | "paused" | "completed" | "cancelled"
}

/**
 * Fetch projects belonging to a Linear team.
 * Used in Project Settings to let admins pick an optional project-level filter.
 */
export async function getLinearProjectsForTeam(accessToken: string, teamId: string): Promise<LinearProjectInfo[]> {
    const client = createLinearGenqlClient({
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    const data = await client.query({
        team: {
            __args: { id: teamId },
            projects: {
                __args: { first: 100 },
                nodes: { id: true, name: true, state: true },
            },
        },
    })

    const unique = new Map<string, LinearProjectInfo>()
    for (const p of (data.team?.projects?.nodes ?? [])) {
        if (p.id && !unique.has(p.id)) {
            unique.set(p.id, { id: p.id, name: p.name ?? '', state: p.state ?? '' })
        }
    }
    return Array.from(unique.values())
}

/**
 * Fetch issues for all given teams directly from Linear API.
 * Uses genql for type-safe field selection. One request per team (no N+1).
 */
export async function getLinearIssues(
    accessToken: string,
    teamIds: string[]
): Promise<LinearIssueInfo[]> {
    if (teamIds.length === 0) return []

    const client = createLinearGenqlClient({
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    // Deduplicate by issue ID to prevent React duplicate key errors in UI
    const uniqueIssues = new Map<string, LinearIssueInfo>()
    const dedupedTeamIds = Array.from(new Set(teamIds))

    // Fetch per team in parallel — one request per team, no N+1
    await Promise.all(
        dedupedTeamIds.map(async (teamId) => {
            try {
                const data = await client.query({
                    issues: {
                        __args: {
                            filter: {
                                team: { id: { eq: teamId } },
                                state: { type: { nin: ['completed', 'canceled'] } },
                            },
                            first: 50,
                            orderBy: 'updatedAt' as const,
                        },
                        nodes: {
                            id: true,
                            identifier: true,
                            title: true,
                            url: true,
                            state: { name: true },
                            team: { id: true },
                        },
                    },
                })

                for (const issue of (data.issues?.nodes ?? [])) {
                    if (issue.id && !uniqueIssues.has(issue.id)) {
                        uniqueIssues.set(issue.id, {
                            id: issue.id,
                            identifier: issue.identifier ?? '',
                            title: issue.title ?? '',
                            state: issue.state?.name ?? '',
                            url: issue.url ?? '',
                            teamId: issue.team?.id ?? teamId,
                        })
                    }
                }
            } catch (err) {
                console.error(`[Linear] Failed to fetch issues for team ${teamId}:`, err)
            }
        })
    )

    return Array.from(uniqueIssues.values())
}

// ─── Token encryption (AES-256-GCM) ──────────────────────────────────────────

// Current key: HKDF-derived from BETTER_AUTH_SECRET (secure)
const ENCRYPTION_KEY = Buffer.from(crypto.hkdfSync(
    'sha256',
    Buffer.from(process.env.BETTER_AUTH_SECRET ?? ''),
    Buffer.alloc(0),
    Buffer.from('linear-token-encryption'),
    32
))

// Legacy key: used before HKDF migration — needed to decrypt existing DB tokens
const LEGACY_ENCRYPTION_KEY = Buffer.from(
    (process.env.BETTER_AUTH_SECRET ?? '').padEnd(32, '0').slice(0, 32)
)

function encryptToken(plaintext: string): string {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    return `${iv.toString('hex')}.${encrypted.toString('hex')}.${authTag.toString('hex')}`
}

function decryptToken(ciphertext: string): string {
    const [ivHex, encHex, tagHex] = ciphertext.split('.')
    const iv = Buffer.from(ivHex, 'hex')
    const enc = Buffer.from(encHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')

    // Try current HKDF key first
    try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv, { authTagLength: 16 })
        decipher.setAuthTag(tag)
        return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
    } catch {
        // Fall back to legacy key for tokens encrypted before HKDF migration
        const decipher = crypto.createDecipheriv('aes-256-gcm', LEGACY_ENCRYPTION_KEY, iv, { authTagLength: 16 })
        decipher.setAuthTag(tag)
        return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
    }
}

export { encryptToken, decryptToken }

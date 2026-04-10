import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { LinearClientManager, LinearAuthError } from '@/services/linear'

/**
 * Action-layer wrapper around LinearClientManager for portal operations.
 * Handles redirect to /api/linear/auth (with returnTo) when staff Linear token is missing/invalid.
 *
 * NOTE: Do NOT call resolvePortalToken before getPortalClient/getPortalGenqlClient —
 * both methods resolve the token internally. A separate pre-call causes double DB
 * queries and double Linear API validation calls (19 call sites affected).
 */

async function getReturnToPath(): Promise<string> {
    try {
        const hdrs = await headers()
        const referer = hdrs.get('referer') ?? ''
        const url = new URL(referer)
        return url.pathname + url.search
    } catch {
        return '/uat'
    }
}

function linearAuthRedirect(returnTo: string): never {
    redirect(`/api/linear/auth?returnTo=${encodeURIComponent(returnTo)}`)
}

/** Linear SDK client for portal write operations (mutations only). */
export async function getPortalLinearClient(userId?: string) {
    try {
        return await LinearClientManager.getPortalClient(userId)
    } catch (e) {
        if (e instanceof LinearAuthError) linearAuthRedirect(await getReturnToPath())
        throw e
    }
}

/**
 * GenQL client for portal batched reads.
 * Per CLAUDE.md: use genql for all reads, @linear/sdk for mutations only.
 */
export async function getPortalLinearGenqlClient(userId?: string) {
    try {
        return await LinearClientManager.getPortalGenqlClient(userId)
    } catch (e) {
        if (e instanceof LinearAuthError) linearAuthRedirect(await getReturnToPath())
        throw e
    }
}

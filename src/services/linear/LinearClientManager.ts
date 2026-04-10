import { LinearClient } from '@linear/sdk'
import { createClient } from '@/lib/linear-genql'
import { prisma } from '@/lib/prisma'
import { decryptToken } from '@/lib/linear-crypto'

/**
 * Unified Linear client factory.
 *
 * Pure service — no Next.js dependencies (no redirect, headers, or cookies).
 * Callers in the action layer are responsible for handling redirect logic.
 *
 * Three auth modes:
 *   1. User OAuth    — getLinearClient(userId)       personal token from DB
 *   2. Service acct  — getServiceAccountClient()     LINEAR_SERVICE_ACCOUNT_API_KEY
 *   3. Portal        — getPortalClient(userId?)      service acct or admin OAuth preview
 */
export class LinearClientManager {
    // ─── User OAuth ───────────────────────────────────────────────────────────

    /**
     * Returns a LinearClient for the given user's stored OAuth token.
     * Returns null if the user has not connected Linear.
     */
    static async getUserClient(userId: string): Promise<LinearClient | null> {
        const record = await prisma.linearUserToken.findFirst({ where: { userId } })
        if (!record) return null
        let accessToken: string
        try {
            accessToken = decryptToken(record.accessToken)
        } catch (e) {
            console.error('[LinearClientManager] Token decryption failed, deleting:', { userId, error: String(e) })
            await prisma.linearUserToken.deleteMany({ where: { userId } })
            return null
        }
        return new LinearClient({ accessToken })
    }

    /**
     * Returns the decrypted access token for a user, or null if not connected.
     */
    static async getUserAccessToken(userId: string): Promise<string | null> {
        const record = await prisma.linearUserToken.findFirst({ where: { userId } })
        if (!record) return null
        try {
            return decryptToken(record.accessToken)
        } catch (e) {
            console.error('[LinearClientManager] Token decryption failed, deleting:', { userId, error: String(e) })
            await prisma.linearUserToken.deleteMany({ where: { userId } })
            return null
        }
    }

    // ─── Service Account ──────────────────────────────────────────────────────

    /**
     * Returns a LinearClient using the workspace service account API key.
     * Throws if LINEAR_SERVICE_ACCOUNT_API_KEY is not set.
     */
    static getServiceAccountClient(): LinearClient {
        const apiKey = process.env.LINEAR_SERVICE_ACCOUNT_API_KEY
        if (!apiKey) throw new Error('LINEAR_SERVICE_ACCOUNT_API_KEY is not set.')
        return new LinearClient({ apiKey })
    }

    static async validateServiceAccount(): Promise<boolean> {
        try {
            const client = LinearClientManager.getServiceAccountClient()
            await client.viewer
            return true
        } catch {
            return false
        }
    }

    // ─── GenQL (typed read client) ────────────────────────────────────────────

    /**
     * Returns a genql client authenticated with the given access token.
     * Use for all Linear reads (type-safe, batched queries).
     */
    static getGenqlClient(accessToken: string) {
        return createClient({
            headers: { Authorization: `Bearer ${accessToken}` },
        })
    }

    /**
     * Returns a genql client authenticated with the service account API key.
     * Note: API keys use bare Authorization (no "Bearer" prefix).
     */
    static getServiceAccountGenqlClient() {
        const apiKey = process.env.LINEAR_SERVICE_ACCOUNT_API_KEY
        if (!apiKey) throw new Error('LINEAR_SERVICE_ACCOUNT_API_KEY is not set.')
        return createClient({ headers: { Authorization: apiKey } })
    }

    // ─── Portal (service acct OR admin preview OAuth) ─────────────────────────

    /**
     * Resolves the access token for portal operations.
     *
     * - Admin preview (userId provided): uses admin's stored OAuth token.
     *   Throws LinearAuthError if token is missing or invalid.
     * - Real portal users (no userId): uses LINEAR_SERVICE_ACCOUNT_API_KEY.
     *
     * NOTE: This method throws — callers in the action layer should catch
     * LinearAuthError and redirect to /settings/integrations.
     */
    static async resolvePortalToken(userId?: string): Promise<string> {
        if (userId) {
            const record = await prisma.linearUserToken.findFirst({ where: { userId } })
            if (!record) throw new LinearAuthError('NO_TOKEN', userId)
            let token: string
            try {
                token = decryptToken(record.accessToken)
            } catch (e) {
                console.error('[LinearClientManager] Token decryption failed, deleting:', { userId, error: String(e) })
                await prisma.linearUserToken.deleteMany({ where: { userId } })
                throw new LinearAuthError('INVALID_TOKEN', userId)
            }
            const status = await createClient({ headers: { Authorization: `Bearer ${token}` } })
                .query({ viewer: { id: true } })
                .then(() => 'valid' as const)
                .catch((e: unknown) => {
                    const httpStatus = (e as { response?: { status?: number } })?.response?.status
                    return httpStatus === 401 ? 'revoked' as const : 'network_error' as const
                })
            if (status === 'revoked') {
                await prisma.linearUserToken.deleteMany({ where: { userId } })
                throw new LinearAuthError('REVOKED_TOKEN', userId)
            }
            // network_error: Linear API temporarily unavailable — fail open.
            // Token is returned unvalidated; downstream call will fail with a clear error
            // rather than invalidating a likely-valid token due to transient network issues.
            return token
        }
        const apiKey = process.env.LINEAR_SERVICE_ACCOUNT_API_KEY
        if (!apiKey) throw new Error('LINEAR_SERVICE_ACCOUNT_API_KEY is not set.')
        return apiKey
    }

    /**
     * Returns a LinearClient for portal write operations.
     * Throws LinearAuthError if admin preview token is missing/invalid.
     */
    static async getPortalClient(userId?: string): Promise<LinearClient> {
        const token = await LinearClientManager.resolvePortalToken(userId)
        return userId
            ? new LinearClient({ accessToken: token })
            : new LinearClient({ apiKey: token })
    }

    /**
     * Returns a genql client for portal read operations.
     * Throws LinearAuthError if admin preview token is missing/invalid.
     */
    static async getPortalGenqlClient(userId?: string) {
        const token = await LinearClientManager.resolvePortalToken(userId)
        return createClient({
            headers: {
                // OAuth tokens need "Bearer"; API keys use bare value
                Authorization: userId ? `Bearer ${token}` : token,
            },
        })
    }
}

// ─── Error types ──────────────────────────────────────────────────────────────

export type LinearAuthErrorCode = 'NO_TOKEN' | 'INVALID_TOKEN' | 'REVOKED_TOKEN'

export class LinearAuthError extends Error {
    constructor(
        public readonly code: LinearAuthErrorCode,
        public readonly userId: string,
    ) {
        super(`Linear auth error [${code}] for user ${userId}`)
        this.name = 'LinearAuthError'
    }
}

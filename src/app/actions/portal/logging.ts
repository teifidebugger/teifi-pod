"use server"

import { prisma } from "@/lib/prisma"
import type { PortalEventType } from "@prisma/client"
import { cookies } from "next/headers"
import { after } from "next/server"
import { getPortalUser } from "./auth"

async function logPortalEvent(p: {
    workspaceId: string
    clientId: string
    teamId?: string
    userId: string
    issueId?: string | null
    issueTitle?: string | null
    issueIdentifier?: string | null
    eventType: PortalEventType
    actorRole: 'client' | 'staff'
    fromColumn?: string | null
    toColumn?: string | null
    metadata?: Record<string, unknown>
}): Promise<void> {
    try {
        await prisma.portalEvent.create({
            data: {
                workspaceId: p.workspaceId,
                clientId: p.clientId,
                teamId: p.teamId,
                userId: p.userId,
                issueId: p.issueId ?? undefined,
                issueTitle: p.issueTitle ?? '',
                issueIdentifier: p.issueIdentifier ?? '',
                eventType: p.eventType,
                actorRole: p.actorRole,
                fromColumn: p.fromColumn,
                toColumn: p.toColumn,
                metadata: p.metadata as import('@prisma/client').Prisma.InputJsonValue | undefined,
            },
        })
    } catch (e) {
        console.error('[PortalEvent]', e)
    }
}

export { logPortalEvent }

/** Log a user_login event. Skip for staff — only tracks real portal clients. */
export async function logPortalLogin(): Promise<void> {
    try {
        const { profile, user, isStaff, workspaceId } = await getPortalUser()
        if (isStaff) return
        const cookieStore = await cookies()
        cookieStore.set('portal_login_logged', '1', { httpOnly: true, sameSite: 'lax', path: '/uat' })
        after(() => logPortalEvent({
            workspaceId,
            clientId: profile.clientId,
            userId: user.id,
            eventType: 'user_login',
            actorRole: 'client',
        }))
    } catch (e) {
        console.warn('[PortalEvent] Non-critical log failed:', e)
    }
}

/** Log an issue_viewed event. Skip for staff. */
export async function logPortalIssueViewed(params: {
    teamId: string
    issueId: string
    issueTitle: string
    issueIdentifier: string
}): Promise<void> {
    try {
        const { profile, user, isStaff, workspaceId } = await getPortalUser({ teamId: params.teamId })
        if (isStaff) return
        after(() => logPortalEvent({
            workspaceId,
            clientId: profile.clientId,
            teamId: params.teamId,
            userId: user.id,
            issueId: params.issueId,
            issueTitle: params.issueTitle,
            issueIdentifier: params.issueIdentifier,
            eventType: 'issue_viewed',
            actorRole: 'client',
        }))
    } catch (e) {
        console.warn('[PortalEvent] Non-critical log failed:', e)
    }
}

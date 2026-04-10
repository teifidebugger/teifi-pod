import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createHash } from "crypto"

export type ApiContext = {
    userId: string
    workspaceId: string
    memberId: string
}

/**
 * Authenticates a request via Bearer token.
 * Dual-auth: accepts either a Teifi API token (Bearer) or session cookie.
 * Returns null if neither is valid.
 */
export async function verifyApiToken(req: NextRequest): Promise<ApiContext | null> {
    const authHeader = req.headers.get("authorization") ?? ""
    if (!authHeader.startsWith("Bearer ")) return null

    const raw = authHeader.slice(7).trim()
    if (!raw) return null

    const hash = createHash("sha256").update(raw).digest("hex")

    const token = await prisma.apiToken.findUnique({
        where: { tokenHash: hash },
        select: { id: true, userId: true, workspaceId: true, expiresAt: true },
    })

    if (!token) return null
    if (token.expiresAt && token.expiresAt < new Date()) return null

    // Fire-and-forget lastUsedAt update
    prisma.apiToken
        .update({ where: { id: token.id }, data: { lastUsedAt: new Date() } })
        .catch(() => {})

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: token.userId, workspaceId: token.workspaceId },
        select: { id: true },
    })
    if (!member) return null

    return { userId: token.userId, workspaceId: token.workspaceId, memberId: member.id }
}

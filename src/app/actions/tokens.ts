"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember, getSessionUser } from "@/app/actions"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

function generateToken() {
    return "teifi_" + crypto.randomBytes(32).toString("hex")
}

function hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex")
}

export async function createApiToken(name: string, expiresInDays?: number) {
    const { user, member } = await getSessionMember()

    if (!name || name.trim().length === 0) {
        throw new Error("Token name is required")
    }

    const rawToken = generateToken()
    const tokenHash = hashToken(rawToken)

    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined

    await prisma.apiToken.create({
        data: {
            name: name.trim(),
            tokenHash,
            userId: user.id,
            workspaceId: member.workspaceId,
            expiresAt,
        }
    })

    revalidatePath("/settings/tokens")
    return { rawToken }
}

export async function revokeApiToken(id: string) {
    const user = await getSessionUser()
    
    await prisma.apiToken.deleteMany({
        where: { id, userId: user.id }
    })
    
    revalidatePath("/settings/tokens")
}

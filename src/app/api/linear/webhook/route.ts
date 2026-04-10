import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Linear Webhook endpoint.
 * Linear sends events for Team and Cycle changes, which we cache in the DB.
 * Register this URL in: Linear Settings → API → Webhooks
 * URL: https://your-domain.com/api/linear/webhook
 */
export async function POST(req: NextRequest) {
    const rawBody = await req.text()

    // 1. Verify Webhook Signature
    const signatureHeader = req.headers.get('linear-signature')
    const secret = process.env.LINEAR_WEBHOOK_SECRET

    if (!secret) {
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }
    if (!signatureHeader) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }
    const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
    if (signature !== signatureHeader) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 2. Parse Body
    const body = JSON.parse(rawBody)

    const { action, type, data } = body

    try {
        if (type === 'Team') {
            if (action === 'create' || action === 'update') {
                // We need a workspaceId — find any workspace that already has this team
                const existingTeam = await prisma.linearTeam.findUnique({ where: { id: data.id } })
                if (existingTeam) {
                    await prisma.linearTeam.update({
                        where: { id: data.id },
                        data: { name: data.name, key: data.key, syncedAt: new Date() },
                    })
                }
                // If team is new but we don't know the workspace yet, we skip — 
                // it'll be picked up on next manual sync
            } else if (action === 'remove') {
                await prisma.linearTeam.deleteMany({ where: { id: data.id } })
            }
        }

        if (type === 'Cycle') {
            if (action === 'create' || action === 'update') {
                const team = await prisma.linearTeam.findUnique({ where: { id: data.teamId } })
                if (team) {
                    await prisma.linearCycle.upsert({
                        where: { id: data.id },
                        create: {
                            id: data.id,
                            name: data.name ?? null,
                            number: data.number,
                            startsAt: data.startsAt ? new Date(data.startsAt) : null,
                            endsAt: data.endsAt ? new Date(data.endsAt) : null,
                            teamId: data.teamId,
                            syncedAt: new Date(),
                        },
                        update: {
                            name: data.name ?? null,
                            startsAt: data.startsAt ? new Date(data.startsAt) : null,
                            endsAt: data.endsAt ? new Date(data.endsAt) : null,
                            syncedAt: new Date(),
                        },
                    })
                }
            } else if (action === 'remove') {
                await prisma.linearCycle.deleteMany({ where: { id: data.id } })
            }
        }

        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('[linear/webhook] Error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

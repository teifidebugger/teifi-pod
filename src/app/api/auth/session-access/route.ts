import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() })

        if (!session?.user) {
            return NextResponse.json({ member: false, client: false, authenticated: false })
        }

        const [member, portal] = await Promise.all([
            prisma.workspaceMember.findFirst({
                where: { userId: session.user.id },
            }),
            prisma.portalProfile.findFirst({
                where: { userId: session.user.id, isActive: true },
                select: { clientId: true },
            }),
        ])

        return NextResponse.json({
            member: !!member,
            client: !!portal,
            clientId: portal?.clientId ?? null,
            authenticated: true,
        })
    } catch (error) {
        console.error('[Session Access Guard]', error)
        return NextResponse.json({ member: false, client: false, authenticated: false }, { status: 500 })
    }
}

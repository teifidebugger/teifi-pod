import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.linearUserToken.deleteMany({
        where: { userId: session.user.id },
    })

    return NextResponse.redirect(new URL('/settings/integrations?success=linear_disconnected', req.url))
}

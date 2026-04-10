import { auth } from '@/lib/auth'
import { NextRequest } from 'next/server'

export const GET = async (req: NextRequest) => {
    try {
        return await auth.handler(req)
    } catch (err) {
        console.error('[auth-error GET]', err)
        throw err
    }
}
export const POST = async (req: NextRequest) => {
    try {
        return await auth.handler(req)
    } catch (err) {
        console.error('[auth-error POST]', err)
        throw err
    }
}

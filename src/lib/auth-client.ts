import { createAuthClient } from 'better-auth/react'

// Use window.location.origin so auth API calls always go to the current domain.
// This supports both portal.teifi.work and uat.teifi.work without CORS issues.
const baseURL = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')

export const authClient = createAuthClient({ baseURL })

export const { signIn, signOut, useSession } = authClient

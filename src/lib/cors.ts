import { NextResponse } from "next/server"

// WARNING: Wildcard CORS is safe for Bearer-token-only APIs.
// Do NOT add cookie/session auth to v1 routes without restricting this to specific origins.
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
}

/** Attach CORS headers to a NextResponse. Bearer-token APIs are safe with wildcard origin. */
export function withCors(res: NextResponse): NextResponse {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
    return res
}

/** Handle OPTIONS preflight for CORS. */
export function corsOptions(): NextResponse {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

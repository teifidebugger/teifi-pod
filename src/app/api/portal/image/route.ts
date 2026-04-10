import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export const maxDuration = 30

// Only proxy Linear asset URLs — prevent SSRF
const ALLOWED_HOSTS = ["uploads.linear.app", "assets.linear.app", "media.linear.app"]

function isAllowedLinearUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return parsed.protocol === "https:" && ALLOWED_HOSTS.some(h => parsed.hostname === h)
    } catch {
        return false
    }
}

export async function GET(request: NextRequest) {
    // Auth check
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify user has active portal profile OR is a workspace member
    const [portalProfile, workspaceMember] = await Promise.all([
        prisma.portalProfile.findFirst({
            where: { userId: session.user.id, isActive: true },
        }),
        prisma.workspaceMember.findFirst({
            where: { userId: session.user.id },
        }),
    ])

    if (!portalProfile && !workspaceMember) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    const url = request.nextUrl.searchParams.get("url")
    if (!url) {
        return new NextResponse("Missing url parameter", { status: 400 })
    }

    if (!isAllowedLinearUrl(url)) {
        return new NextResponse("URL not allowed", { status: 400 })
    }

    const apiKey = process.env.LINEAR_SERVICE_ACCOUNT_API_KEY
    if (!apiKey) {
        return new NextResponse("Image proxy not configured", { status: 503 })
    }

    const upstream = await fetch(url, {
        headers: { Authorization: apiKey },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cache: "no-store" as any,
    })

    if (!upstream.ok) {
        return new NextResponse("Failed to fetch image", { status: upstream.status })
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream"
    const body = await upstream.arrayBuffer()

    return new NextResponse(body, {
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "private, max-age=3600",
        },
    })
}

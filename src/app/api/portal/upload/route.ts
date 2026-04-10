import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/linear-genql"

export const maxDuration = 30

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    "application/pdf",
    "text/plain", "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

export async function POST(request: NextRequest) {
    // Auth check
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has active portal profile OR is a workspace member
    const [portalProfile, workspaceMember] = await Promise.all([
        prisma.portalProfile.findFirst({
            where: { userId: session.user.id, isActive: true },
        }),
        prisma.workspaceMember.findFirst({
            where: { userId: session.user.id, role: { in: ["OWNER", "ADMIN", "MANAGER"] } },
        }),
    ])

    if (!portalProfile && !workspaceMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse and validate the uploaded file
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    const apiKey = process.env.LINEAR_SERVICE_ACCOUNT_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: "Upload service not configured" }, { status: 503 })
    }

    // Step 1: Ask Linear for a pre-signed upload URL via genql client
    const linearClient = createClient({ headers: { Authorization: apiKey } })
    let uploadFile: { uploadUrl: string; assetUrl: string; headers: { key: string; value: string }[] }
    try {
        const result = await linearClient.mutation({
            fileUpload: {
                __args: {
                    contentType: file.type,
                    filename: file.name,
                    size: file.size,
                },
                success: true,
                uploadFile: {
                    uploadUrl: true,
                    assetUrl: true,
                    headers: { key: true, value: true },
                },
            },
        })
        const uf = result.fileUpload?.uploadFile
        if (!uf?.uploadUrl || !uf?.assetUrl) {
            return NextResponse.json({ error: "Linear did not return upload URL" }, { status: 502 })
        }
        uploadFile = { uploadUrl: uf.uploadUrl, assetUrl: uf.assetUrl, headers: uf.headers ?? [] }
    } catch (err: unknown) {
        const detail = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: "Failed to initiate upload", detail }, { status: 502 })
    }

    // Step 2: PUT the file bytes to the pre-signed S3 URL
    const uploadHeaders: Record<string, string> = {
        "Content-Type": file.type,
        "Cache-Control": "public, max-age=31536000",
    }
    for (const h of uploadFile.headers ?? []) {
        if (h.key && h.value) uploadHeaders[h.key] = h.value
    }

    const fileBuffer = await file.arrayBuffer()
    const s3Res = await fetch(uploadFile.uploadUrl, {
        method: "PUT",
        headers: uploadHeaders,
        body: fileBuffer,
    })

    if (!s3Res.ok) {
        const text = await s3Res.text()
        return NextResponse.json({ error: "S3 upload failed", detail: text }, { status: 502 })
    }

    return NextResponse.json({
        url: uploadFile.assetUrl,
        filename: file.name,
    })
}

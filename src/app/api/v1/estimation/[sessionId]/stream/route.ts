import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { withCors, corsOptions } from "@/lib/cors"

export function OPTIONS() {
  return corsOptions()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

  const pokerSession = await prisma.pokerSession.findUnique({
    where: { id: sessionId },
    include: {
      project: { select: { id: true, name: true, linearTeamId: true, linearProjectId: true } },
      createdBy: { select: { id: true, user: { select: { name: true, image: true } } } },
      rounds: {
        include: {
          votes: {
            include: {
              participant: {
                include: { member: { include: { user: { select: { id: true, name: true, image: true } } } } }
              }
            }
          }
        },
        orderBy: { position: "asc" }
      },
      participants: {
        include: {
          member: { include: { user: { select: { id: true, name: true, image: true } } } }
        },
        orderBy: { joinedAt: "asc" }
      }
    }
  })

  if (!pokerSession) return withCors(NextResponse.json({ error: "Session not found" }, { status: 404 }))

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId: pokerSession.workspaceId }
  })
  if (!member) return withCors(NextResponse.json({ error: "Forbidden" }, { status: 403 }))

  return withCors(NextResponse.json(pokerSession))
}

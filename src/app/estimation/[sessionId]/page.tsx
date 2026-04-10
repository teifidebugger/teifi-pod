import { getPokerSession } from "@/app/actions/estimation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { SessionRoom } from "./SessionRoom"

export default async function EstimationSessionPage({
    params,
}: {
    params: Promise<{ sessionId: string }>
}) {
    const { sessionId } = await params

    const authSession = await auth.api.getSession({ headers: await headers() })
    if (!authSession?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: authSession.user.id },
        select: { id: true, workspaceId: true },
    })
    if (!member) redirect("/login")

    let session
    try {
        session = await getPokerSession(sessionId)
    } catch {
        notFound()
    }

    const currentParticipant = session.participants.find(
        (p) => p.member.id === member.id
    )
    const isHost = session.createdById === member.id

    return (
        <SessionRoom
            initialSession={session}
            currentMemberId={member.id}
            currentUserId={authSession.user.id}
            isHost={isHost}
            currentParticipantId={currentParticipant?.id ?? null}
        />
    )
}

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
    params: Promise<{ token: string }>
}

export default async function AcceptInvitePage({ params }: Props) {
    const { token } = await params

    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        redirect(`/invite/${token}`)
    }

    const invite = await prisma.invite.findUnique({
        where: { token },
        include: { workspace: { select: { id: true, name: true } } },
    })

    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md border-sidebar-border">
                    <CardHeader className="text-center">
                        <CardTitle>Invite Not Valid</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground text-center">
                        This invite has expired, already been used, or is invalid. Contact your workspace admin.
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md border-sidebar-border">
                    <CardHeader className="text-center">
                        <CardTitle>Wrong Account</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground text-center">
                        This invite was sent to <span className="font-medium text-foreground">{invite.email}</span>.{" "}
                        You are signed in as <span className="font-medium text-foreground">{session.user.email}</span>.{" "}
                        Please sign in with the correct Google account.
                    </CardContent>
                </Card>
            </div>
        )
    }

    try {
        const existingMember = await prisma.workspaceMember.findFirst({
            where: { userId: session.user.id, workspaceId: invite.workspaceId },
        })

        if (!existingMember) {
            const newMember = await prisma.workspaceMember.create({
                data: {
                    userId: session.user.id,
                    workspaceId: invite.workspaceId,
                    role: invite.role,
                    managerId: invite.managerId ?? null,
                },
            })

            if (invite.projectIds.length > 0) {
                await prisma.projectMember.createMany({
                    data: invite.projectIds.map((projectId) => ({ projectId, memberId: newMember.id })),
                    skipDuplicates: true,
                })
            }
        }

        await prisma.invite.update({
            where: { id: invite.id },
            data: { usedAt: new Date() },
        })
    } catch (err) {
        console.error("[invite-accept] Failed to create member:", err)
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md border-sidebar-border">
                    <CardHeader className="text-center">
                        <CardTitle>Something went wrong</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground text-center">
                        Could not accept invite. Please try again or contact your workspace admin.
                        <pre className="mt-4 text-xs text-left bg-muted p-3 rounded overflow-auto max-h-40">
                            {err instanceof Error ? err.message : String(err)}
                        </pre>
                    </CardContent>
                </Card>
            </div>
        )
    }

    redirect("/time")
}

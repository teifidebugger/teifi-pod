import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
    params: Promise<{ token: string }>
}

export default async function AcceptPortalInvitePage({ params }: Props) {
    const { token } = await params

    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        redirect(`/invite/portal/${token}`)
    }

    const invite = await prisma.portalInvite.findUnique({
        where: { token },
        include: { client: { select: { id: true, name: true } } },
    })

    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md border-sidebar-border">
                    <CardHeader className="text-center">
                        <CardTitle>Invite Not Valid</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground text-center">
                        This invite has expired, already been used, or is invalid. Contact your account manager.
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
                        This invite was sent to{" "}
                        <span className="font-medium text-foreground">{invite.email}</span>.{" "}
                        You are signed in as{" "}
                        <span className="font-medium text-foreground">{session.user.email}</span>.{" "}
                        Please sign in with the correct Google account.
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Create PortalProfile if not already exists
    // PortalProfile has a @unique on userId — one user can only be a portal guest for one client.
    const existing = await prisma.portalProfile.findUnique({
        where: { userId: session.user.id },
    })

    if (existing && existing.clientId !== invite.clientId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md border-sidebar-border">
                    <CardHeader className="text-center">
                        <CardTitle>Already Have Portal Access</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground text-center">
                        You already have portal access for a different client. Contact your account manager if you need access changed.
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!existing) {
        try {
            await prisma.portalProfile.create({
                data: {
                    userId: session.user.id,
                    clientId: invite.clientId,
                    isActive: true,
                },
            })
        } catch (err: unknown) {
            // Unique constraint on userId — another profile was created concurrently
            const isUniqueViolation =
                err instanceof Error && err.message.includes("Unique constraint")
            if (isUniqueViolation) {
                return (
                    <div className="min-h-screen flex items-center justify-center bg-background px-4">
                        <Card className="w-full max-w-md border-sidebar-border">
                            <CardHeader className="text-center">
                                <CardTitle>Already Have Portal Access</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground text-center">
                                You already have a portal account linked to a different client. Please contact your administrator.
                            </CardContent>
                        </Card>
                    </div>
                )
            }
            throw err
        }
    } else if (!existing.isActive) {
        await prisma.portalProfile.update({
            where: { userId: session.user.id },
            data: { isActive: true },
        })
    }

    await prisma.portalInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
    })

    redirect("/uat")
}

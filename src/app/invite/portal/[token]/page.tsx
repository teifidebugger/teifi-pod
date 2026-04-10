import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PortalInviteSignInButton } from "./PortalInviteSignInButton"

interface Props {
    params: Promise<{ token: string }>
}

export default async function PortalInvitePage({ params }: Props) {
    const { token } = await params

    const invite = await prisma.portalInvite.findUnique({
        where: { token },
        include: { client: { select: { name: true } } },
    })

    const isExpired = !invite || invite.expiresAt < new Date()
    const isUsed = !!invite?.usedAt

    if (!invite || isExpired || isUsed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md border-sidebar-border">
                    <CardHeader className="text-center">
                        <CardTitle>Invite Not Valid</CardTitle>
                        <CardDescription>
                            {isUsed
                                ? "This Client UAT Portal invite has already been used."
                                : "This invite link has expired or is invalid."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">
                        Contact your account manager to request a new invite.
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md border-sidebar-border">
                <CardHeader className="text-center">
                    <CardTitle>Client UAT Portal Access Invite</CardTitle>
                    <CardDescription>
                        You&apos;ve been invited to access the{" "}
                        <span className="font-semibold text-foreground">{invite.client.name}</span> Client UAT Portal
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                        Sign in as <span className="font-medium text-foreground">{invite.email}</span> to accept this invite.
                    </p>
                    <PortalInviteSignInButton token={token} email={invite.email} />
                </CardContent>
            </Card>
        </div>
    )
}

import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InviteSignInButton } from "./InviteSignInButton"

interface Props {
    params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
    const { token } = await params

    const invite = await prisma.invite.findUnique({
        where: { token },
        include: { workspace: { select: { name: true } } },
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
                                ? "This invite has already been used."
                                : "This invite link has expired or is invalid."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">
                        Contact your workspace admin to request a new invite.
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md border-sidebar-border">
                <CardHeader className="text-center">
                    <CardTitle>You&apos;ve been invited</CardTitle>
                    <CardDescription>
                        Join <span className="font-semibold text-foreground">{invite.workspace.name}</span> on Teifi Portal
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground text-center">
                        <p>You were invited as <span className="font-medium text-foreground capitalize">{invite.role.toLowerCase()}</span>.</p>
                        <p className="mt-1">Sign in with the Google account for <span className="font-medium text-foreground">{invite.email}</span> to accept.</p>
                    </div>
                    <InviteSignInButton token={token} />
                </CardContent>
            </Card>
        </div>
    )
}

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function ProfileRedirect({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>
}) {
    const { tab } = await searchParams
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
    })
    if (!member) redirect("/login")

    const tabParam = tab ? `?tab=${tab}` : ""
    redirect(`/team/${member.id}/profile${tabParam}`)
}

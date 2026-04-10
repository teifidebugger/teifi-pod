import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { RolesManager } from "./RolesManager"

export default async function RolesPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(member.role)
    if (!canManage) redirect("/schedule")

    // Fetch workspace roles
    const workspaceRoles = await prisma.workspaceRole.findMany({
        where: { workspaceId: member.workspaceId },
        orderBy: { name: "asc" },
    })

    // Fetch members and placeholders to compute usage counts
    const workspaceMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId: member.workspaceId },
        select: { roles: true },
    })

    const placeholders = await prisma.placeholder.findMany({
        where: { workspaceId: member.workspaceId, archivedAt: null },
        select: { roles: true },
    })

    const rolesWithUsage = workspaceRoles.map((role) => ({
        id: role.id,
        name: role.name,
        memberCount: workspaceMembers.filter((m) => m.roles.includes(role.name)).length,
        placeholderCount: placeholders.filter((p) => p.roles.includes(role.name)).length,
    }))

    return (
        <div className="flex-1 space-y-6 pt-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/schedule/placeholders">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Roles</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage the centralized skill and department role catalog. Roles can be assigned to team members and placeholders.
                    </p>
                </div>
            </div>

            <RolesManager roles={rolesWithUsage} />
        </div>
    )
}

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Tags } from "lucide-react"
import { PlaceholderList } from "./PlaceholderForm"

export default async function PlaceholdersPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    // Only OWNER/ADMIN/MANAGER can manage placeholders
    const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(member.role)
    if (!canManage) redirect("/schedule")

    // Fetch all placeholders (including archived) with allocation counts
    const placeholders = await prisma.placeholder.findMany({
        where: { workspaceId: member.workspaceId },
        include: {
            _count: { select: { allocations: true } },
        },
        orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
    })

    // Fetch workspace roles for suggestions
    const workspaceRoles = await prisma.workspaceRole.findMany({
        where: { workspaceId: member.workspaceId },
        orderBy: { name: "asc" },
    })

    // Fetch workspace members for "Assign to Person"
    const workspaceMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId: member.workspaceId, disabledAt: null },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { user: { name: "asc" } },
    })

    const serialized = placeholders.map((p) => ({
        id: p.id,
        name: p.name,
        roles: p.roles,
        weeklyCapacityHours: p.weeklyCapacityHours,
        archivedAt: p.archivedAt?.toISOString() ?? null,
        allocationCount: p._count.allocations,
    }))

    const members = workspaceMembers.map((m) => ({
        id: m.id,
        name: m.user.name,
        email: m.user.email,
    }))

    return (
        <div className="flex-1 space-y-6 pt-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/schedule">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h2 className="text-xl font-semibold tracking-tight">Placeholders</h2>
                    <p className="text-muted-foreground mt-1">
                        Unfilled team member slots — schedule capacity before the real person is hired or assigned.
                    </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/schedule/roles">
                        <Tags className="h-4 w-4 mr-1" />
                        Manage Guilds
                    </Link>
                </Button>
            </div>

            <PlaceholderList
                placeholders={serialized}
                availableRoles={workspaceRoles.map((r) => r.name)}
                members={members}
            />
        </div>
    )
}

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ClientForm } from "./ClientForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, Phone, User, ArrowUp, ArrowDown, ArrowUpDown, Zap } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type SortColumn = "name" | "contact" | "projects" | "hours"
type SortDir = "asc" | "desc"

function buildSortUrl(base: Record<string, string | undefined>, col: SortColumn, currentSort?: string, currentDir?: string) {
    const params = new URLSearchParams()
    if (base.archived) params.set("archived", base.archived)
    if (base.q) params.set("q", base.q)
    params.set("sort", col)
    params.set("dir", currentSort === col && currentDir === "asc" ? "desc" : "asc")
    return `/clients?${params.toString()}`
}

function SortIcon({ column, currentSort, currentDir }: { column: SortColumn; currentSort?: string; currentDir?: string }) {
    if (currentSort !== column) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
    return currentDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
}

export default async function ClientsPage({
    searchParams,
}: {
    searchParams: Promise<{ archived?: string; q?: string; sort?: string; dir?: string }>
}) {
    const { archived, q, sort, dir } = await searchParams
    const showArchived = archived === "1"
    const sortCol = (["name", "contact", "projects", "hours"].includes(sort ?? "") ? sort : "name") as SortColumn
    const sortDir: SortDir = dir === "desc" ? "desc" : "asc"

    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true, canEditClients: true },
    })

    if (!member) redirect("/")

    const isAdmin =
        ["OWNER", "ADMIN"].includes(member.role) ||
        (member.role === "MANAGER" && member.canEditClients)

    const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(member.role)

    const clientWhere = {
        workspaceId: member.workspaceId,
        archivedAt: showArchived ? { not: null } : null,
        ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    } as const

    // Fetch clients + contacts + active project count (no timeEntries loaded)
    const [clients, hoursByClient] = await Promise.all([
        prisma.client.findMany({
            where: clientWhere,
            include: {
                contacts: { orderBy: { createdAt: "asc" }, take: 1 },
                _count: { select: { projects: { where: { status: "ACTIVE" } } } },
            },
            orderBy: sortCol === "name" ? { name: sortDir } : { name: "asc" },
        }),
        // Aggregate total hours per client in one query
        prisma.timeEntry.groupBy({
            by: ["projectId"],
            where: {
                project: {
                    workspaceId: member.workspaceId,
                    client: clientWhere,
                },
            },
            _sum: { durationSeconds: true },
        }),
    ])

    // Get project→client mapping for hour aggregation
    const projectsWithClient = await prisma.teifiProject.findMany({
        where: {
            clientId: { in: clients.map(c => c.id) },
        },
        select: { id: true, clientId: true },
    })

    const projToClient = new Map(projectsWithClient.map(p => [p.id, p.clientId!]))
    const clientHoursMap = new Map<string, number>()
    for (const row of hoursByClient) {
        const clientId = projToClient.get(row.projectId)
        if (clientId) {
            clientHoursMap.set(clientId, (clientHoursMap.get(clientId) ?? 0) + (row._sum.durationSeconds ?? 0))
        }
    }

    // Sort in-memory for computed columns (projects count, hours, contact)
    const sortedClients = [...clients]
    if (sortCol === "projects") {
        sortedClients.sort((a, b) => {
            const diff = a._count.projects - b._count.projects
            return sortDir === "asc" ? diff : -diff
        })
    } else if (sortCol === "hours") {
        sortedClients.sort((a, b) => {
            const diff = (clientHoursMap.get(a.id) ?? 0) - (clientHoursMap.get(b.id) ?? 0)
            return sortDir === "asc" ? diff : -diff
        })
    } else if (sortCol === "contact") {
        sortedClients.sort((a, b) => {
            const nameA = a.contacts[0]?.firstName?.toLowerCase() ?? a.email?.toLowerCase() ?? "zzz"
            const nameB = b.contacts[0]?.firstName?.toLowerCase() ?? b.email?.toLowerCase() ?? "zzz"
            const cmp = nameA.localeCompare(nameB)
            return sortDir === "asc" ? cmp : -cmp
        })
    }

    const baseParams = { archived: showArchived ? "1" : undefined, q: q || undefined }

    return (
        <div className="flex-1 space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Clients</h2>
                    <p className="text-muted-foreground mt-1">Manage your client pipeline and business organizations.</p>
                </div>
                <div className="flex items-center gap-2">
                    {isOwnerOrAdmin && (
                        <Link href="/clients/onboard">
                            <Button variant="outline" size="sm"><Zap className="h-4 w-4 mr-2" />Onboard Client</Button>
                        </Link>
                    )}
                    {isAdmin && !showArchived && (
                        <ClientForm mode="create" />
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between py-2 gap-3">
                <form method="GET" action="/clients" className="relative w-full max-w-sm">
                    {showArchived && <input type="hidden" name="archived" value="1" />}
                    {sort && <input type="hidden" name="sort" value={sort} />}
                    {dir && <input type="hidden" name="dir" value={dir} />}
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="search"
                        name="q"
                        defaultValue={q ?? ""}
                        placeholder="Search clients..."
                        className="pl-8 bg-sidebar/50 border-sidebar-border"
                    />
                </form>
                <Link href={showArchived ? (q ? `/clients?q=${encodeURIComponent(q)}` : "/clients") : (q ? `/clients?archived=1&q=${encodeURIComponent(q)}` : "/clients?archived=1")}>
                    <Button variant="outline" size="sm" className="shrink-0">
                        {showArchived ? "Show active" : "Show archived"}
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border border-sidebar-border bg-sidebar/30 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-sidebar-border hover:bg-transparent">
                            <TableHead>
                                <Link href={buildSortUrl(baseParams, "name", sort, dir)} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                                    Client Name <SortIcon column="name" currentSort={sort} currentDir={dir} />
                                </Link>
                            </TableHead>
                            <TableHead>
                                <Link href={buildSortUrl(baseParams, "contact", sort, dir)} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                                    Contact <SortIcon column="contact" currentSort={sort} currentDir={dir} />
                                </Link>
                            </TableHead>
                            <TableHead className="text-center">
                                <Link href={buildSortUrl(baseParams, "projects", sort, dir)} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors justify-center w-full">
                                    Active Projects <SortIcon column="projects" currentSort={sort} currentDir={dir} />
                                </Link>
                            </TableHead>
                            <TableHead className="text-right">
                                <Link href={buildSortUrl(baseParams, "hours", sort, dir)} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors justify-end w-full">
                                    Total Hours <SortIcon column="hours" currentSort={sort} currentDir={dir} />
                                </Link>
                            </TableHead>
                            {isAdmin && <TableHead className="w-[100px] text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedClients.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 5 : 4} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center">
                                        <p className="mb-4">No clients found. Add a client to get started.</p>
                                        {isAdmin && <ClientForm mode="create" />}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                        {sortedClients.map((client) => {
                            const totalSeconds = clientHoursMap.get(client.id) ?? 0
                            const totalHours = (totalSeconds / 3600).toFixed(1)
                            const primaryContact = client.contacts[0]

                            return (
                                <TableRow key={client.id} className="border-sidebar-border hover:bg-sidebar/50 transition-colors group">
                                    <TableCell className="font-semibold align-top pt-4">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/clients/${client.id}`} className="hover:underline hover:text-primary transition-colors">
                                                {client.name}
                                            </Link>
                                            {showArchived && (
                                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Archived</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground align-top pt-4">
                                        <div className="flex flex-col gap-1.5">
                                            {primaryContact ? (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="text-foreground font-medium">
                                                            {primaryContact.firstName}{primaryContact.lastName ? ` ${primaryContact.lastName}` : ""}
                                                            {primaryContact.title && <span className="text-muted-foreground font-normal ml-1">· {primaryContact.title}</span>}
                                                        </span>
                                                    </div>
                                                    {primaryContact.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="w-3.5 h-3.5 shrink-0" />
                                                            <a href={`mailto:${primaryContact.email}`} className="hover:underline hover:text-foreground">{primaryContact.email}</a>
                                                        </div>
                                                    )}
                                                    {primaryContact.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="w-3.5 h-3.5 shrink-0" />
                                                            <a href={`tel:${primaryContact.phone}`} className="hover:underline hover:text-foreground">{primaryContact.phone}</a>
                                                        </div>
                                                    )}
                                                </>
                                            ) : client.email ? (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    <a href={`mailto:${client.email}`} className="hover:underline hover:text-foreground">{client.email}</a>
                                                </div>
                                            ) : (
                                                <Link href={`/clients/${client.id}`} className="opacity-50 italic hover:opacity-80 hover:not-italic hover:underline transition-opacity">
                                                    Add contact
                                                </Link>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center align-top pt-4">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold ring-1 ring-primary/20">
                                            {client._count.projects}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-medium align-top pt-4">
                                        <span className="text-muted-foreground">{totalHours}h</span>
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell className="text-right align-top pt-3">
                                            <ClientForm mode="edit" client={client} />
                                        </TableCell>
                                    )}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ClientForm } from "@/app/clients/ClientForm"
import { AddContactButton, EditContactButton, DeleteContactButton } from "./ContactActions"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Globe, Mail, Phone, User } from "lucide-react"

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

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
    const client = await prisma.client.findFirst({
        where: { id, workspaceId: member.workspaceId },
        include: {
            contacts: { orderBy: { createdAt: "asc" } },
            projects: {
                where: { status: "ACTIVE" },
                select: { id: true, name: true, billingType: true, status: true },
            },
            _count: { select: { projects: true } },
        },
    })

    if (!client) notFound()

    const billingTypeLabel: Record<string, string> = {
        HOURLY: "Hourly",
        FIXED_FEE: "Fixed Fee",
        NON_BILLABLE: "Non-billable",
    }

    const billingTypeVariant: Record<string, "default" | "secondary" | "outline"> = {
        HOURLY: "default",
        FIXED_FEE: "secondary",
        NON_BILLABLE: "outline",
    }

    return (
        <div className="flex-1 space-y-6 pt-6">
            {/* Back links */}
            <div className="flex items-center gap-4">
                <Link
                    href="/clients"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Clients
                </Link>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">{client.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {client.email && (
                            <a
                                href={`mailto:${client.email}`}
                                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                {client.email}
                            </a>
                        )}
                        {client.website && (
                            <a
                                href={client.website}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                            >
                                <Globe className="w-3.5 h-3.5" />
                                {client.website}
                            </a>
                        )}
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                        <ClientForm mode="edit" client={client} />
                    </div>
                )}
            </div>

            {/* Projects + Contacts — 2-column grid on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Projects */}
            <Card className="border-sidebar-border bg-sidebar/30 overflow-hidden">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                        Projects ({client._count.projects})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {client.projects.length === 0 ? (
                        <p className="px-6 pb-6 text-sm text-muted-foreground italic">No active projects.</p>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-sidebar-border hover:bg-transparent">
                                    <TableHead>Project Name</TableHead>
                                    <TableHead>Billing Type</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {client.projects.map((project) => (
                                    <TableRow key={project.id} className="border-sidebar-border hover:bg-sidebar/50">
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/projects/${project.id}`}
                                                className="hover:underline text-foreground"
                                            >
                                                {project.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={billingTypeVariant[project.billingType] ?? "outline"}>
                                                {billingTypeLabel[project.billingType] ?? project.billingType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{project.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Contacts */}
            <Card className="border-sidebar-border bg-sidebar/30">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base font-semibold">
                        Contacts ({client.contacts.length})
                    </CardTitle>
                    {isAdmin && <AddContactButton clientId={client.id} />}
                </CardHeader>
                <CardContent className="p-0">
                    {client.contacts.length === 0 ? (
                        <p className="px-6 pb-6 text-sm text-muted-foreground italic">No contacts yet.</p>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-sidebar-border hover:bg-transparent">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    {isAdmin && <TableHead className="w-[80px] text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {client.contacts.map((contact) => (
                                    <TableRow key={contact.id} className="border-sidebar-border hover:bg-sidebar/50">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                {contact.firstName}
                                                {contact.lastName ? ` ${contact.lastName}` : ""}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {contact.title || <span className="italic opacity-50">—</span>}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {contact.email ? (
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors max-w-[180px]"
                                                >
                                                    <Mail className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{contact.email}</span>
                                                </a>
                                            ) : (
                                                <span className="italic opacity-50">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {contact.phone ? (
                                                <a
                                                    href={`tel:${contact.phone}`}
                                                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors max-w-[160px]"
                                                >
                                                    <Phone className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{contact.phone}</span>
                                                </a>
                                            ) : (
                                                <span className="italic opacity-50">—</span>
                                            )}
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <EditContactButton contact={contact} />
                                                    <DeleteContactButton contactId={contact.id} />
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            </div>{/* end 2-column grid */}

        </div>
    )
}

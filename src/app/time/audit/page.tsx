import { redirect } from "next/navigation"
import { format } from "date-fns"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/app/actions"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"

function formatFieldValue(field: string, value: string | null): string {
    if (value === null || value === "") return "(empty)"
    if (field === "durationSeconds") {
        const n = parseInt(value, 10)
        if (!isNaN(n)) return `${(n / 3600).toFixed(2)}h`
    }
    if (field === "isBillable") return value === "true" ? "Billable" : "Non-billable"
    return value
}

function fieldLabel(field: string): string {
    const labels: Record<string, string> = {
        description: "Description",
        date: "Date",
        durationSeconds: "Duration",
        projectId: "Project",
        isBillable: "Billing",
    }
    return labels[field] ?? field
}

export default async function AuditPage() {
    const user = await getSessionUser().catch(() => null)
    if (!user) redirect("/login")
    const member = await prisma.workspaceMember.findFirst({ where: { userId: user.id } })
    if (!member) redirect("/")

    const allowedRoles = ["OWNER", "ADMIN", "MANAGER"]
    if (!allowedRoles.includes(member.role)) redirect("/time")

    const records = await prisma.timeEntryHistory.findMany({
        where: {
            timeEntry: {
                project: { workspaceId: member.workspaceId },
            },
        },
        orderBy: { changedAt: "desc" },
        take: 200,
        include: {
            changedBy: { select: { id: true, name: true, email: true, image: true } },
            timeEntry: {
                include: {
                    project: { select: { id: true, name: true } },
                },
            },
        },
    })

    // Group by date
    const grouped = new Map<string, typeof records>()
    for (const record of records) {
        const dateKey = format(record.changedAt, "yyyy-MM-dd")
        if (!grouped.has(dateKey)) grouped.set(dateKey, [])
        grouped.get(dateKey)!.push(record)
    }

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Activity Audit Log</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Recent time entry edits across the workspace (last 200 changes)
                </p>
            </div>

            {records.length === 0 && (
                <p className="text-sm text-muted-foreground">No audit records yet. Edit a time entry to see changes recorded here.</p>
            )}

            {Array.from(grouped.entries()).map(([dateKey, dayRecords]) => (
                <div key={dateKey} className="space-y-2">
                    <h2 className="text-sm font-medium text-muted-foreground">
                        {format(new Date(dateKey + "T12:00:00"), "EEEE, MMMM d, yyyy")}
                    </h2>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Who</TableHead>
                                    <TableHead>Entry</TableHead>
                                    <TableHead>Field</TableHead>
                                    <TableHead>Old Value</TableHead>
                                    <TableHead>New Value</TableHead>
                                    <TableHead className="text-right">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dayRecords.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="size-6">
                                                    <AvatarFallback className={`text-xs text-white ${avatarBg(record.changedBy.name ?? record.changedBy.email ?? "?")}`}>
                                                        {(record.changedBy.name ?? record.changedBy.email ?? "?")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm truncate max-w-[120px]">
                                                    {record.changedBy.name ?? record.changedBy.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <span className="font-medium">{record.timeEntry.project.name}</span>
                                                {record.timeEntry.description && (
                                                    <span className="text-muted-foreground ml-1 truncate max-w-[200px] inline-block align-bottom">
                                                        — {record.timeEntry.description}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs font-mono">
                                                {fieldLabel(record.fieldName ?? record.action)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatFieldValue(record.fieldName ?? "", record.oldValue)}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatFieldValue(record.fieldName ?? "", record.newValue)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {format(record.changedAt, "HH:mm")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ))}
        </div>
    )
}

import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/app/actions"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { headers } from "next/headers"
import { TokensClient } from "./TokensClient"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default async function ApiTokensPage() {
    const user = await getSessionUser().catch(() => null)
    if (!user) redirect("/login")
    const member = await prisma.workspaceMember.findFirst({ where: { userId: user.id }, select: { workspaceId: true } })
    const tokens = await prisma.apiToken.findMany({
        where: { userId: user.id, workspaceId: member?.workspaceId },
        orderBy: { createdAt: "desc" },
    })

    const hdrs = await headers()
    const host = hdrs.get("host") ?? "localhost:3000"
    const proto = hdrs.get("x-forwarded-proto") ?? "http"
    const baseUrl = `${proto}://${host}`

    const now = new Date()
    const formattedTokens = tokens.map(t => ({
        id: t.id,
        name: t.name,
        createdAt: format(t.createdAt, "MMM d, yyyy"),
        lastUsedAt: t.lastUsedAt ? format(t.lastUsedAt, "MMM d, yyyy HH:mm") : "Never used",
        expiresAt: t.expiresAt ? format(t.expiresAt, "MMM d, yyyy") : null,
        isExpired: t.expiresAt ? t.expiresAt < now : false,
    }))

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-12">

            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold tracking-tight">API Tokens</h1>
                <p className="text-muted-foreground mt-1">
                    Generate personal access tokens to authenticate API requests from external tools, scripts, and browser extensions.
                </p>
            </div>

            {/* Token management */}
            <TokensClient tokens={formattedTokens} />

            <Separator className="border-sidebar-border" />

            {/* Authentication */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Authentication</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Include your token in the{" "}
                        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Authorization</code>{" "}
                        header on every request. Base URL:{" "}
                        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{baseUrl}/api/v1</code>
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">cURL</p>
                        <CodeBlock code={`curl ${baseUrl}/api/v1/me \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">JavaScript</p>
                        <CodeBlock code={`const res = await fetch("${baseUrl}/api/v1/me", {
  headers: { Authorization: "Bearer YOUR_TOKEN" },
})
const data = await res.json()`} />
                    </div>
                </div>
                <div className="rounded-lg border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 px-4 py-2.5 text-sm text-foreground/80">
                    Tokens are personal — they authenticate as <strong>you</strong> and inherit your workspace role.
                    Never share tokens or commit them to version control.
                </div>
            </section>

            <Separator className="border-sidebar-border" />

            {/* API Reference */}
            <section className="space-y-10">
                <div>
                    <h2 className="text-lg font-semibold">API Reference</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        All endpoints are REST+JSON. Successful responses return <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">200</code> or{" "}
                        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">201</code>. Errors always return{" "}
                        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{"{ \"error\": \"...\" }"}</code>.
                    </p>
                </div>

                {/* GET /me */}
                <EndpointDoc
                    method="GET"
                    path="/api/v1/me"
                    description="Returns the authenticated user's profile, workspace membership, and workspace settings."
                    responseExample={`{
  "user": {
    "id": "clxabc123",
    "name": "Jane Smith",
    "email": "jane@acme.com",
    "image": "https://..."
  },
  "member": {
    "id": "clxmem456",
    "role": "ADMIN",
    "title": "Engineering Lead",
    "weeklyCapacityHours": 40
  },
  "workspace": {
    "id": "clxws789",
    "name": "Acme Inc",
    "currency": "USD",
    "timeFormat": "decimal"
  }
}`}
                    curlExample={`curl ${baseUrl}/api/v1/me \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                    jsExample={`const res = await fetch("${baseUrl}/api/v1/me", {
  headers: { Authorization: "Bearer YOUR_TOKEN" },
})
const { user, member, workspace } = await res.json()`}
                />

                {/* GET /projects */}
                <EndpointDoc
                    method="GET"
                    path="/api/v1/projects"
                    description="Lists projects in your workspace with their tasks. Use the status param to filter archived or paused projects."
                    queryParams={[
                        { name: "status", type: "string", required: false, description: '"ACTIVE" | "PAUSED" | "all" — defaults to "ACTIVE"' },
                    ]}
                    responseExample={`[
  {
    "id": "clxproj001",
    "name": "Website Redesign",
    "code": "WEB",
    "status": "ACTIVE",
    "billingType": "HOURLY",
    "billBy": "People",
    "client": { "id": "clxcli001", "name": "Acme Inc" },
    "tasks": [
      { "id": "clxtask01", "name": "Design", "isBillable": true },
      { "id": "clxtask02", "name": "Frontend", "isBillable": true }
    ]
  }
]`}
                    curlExample={`# Active projects (default)
curl "${baseUrl}/api/v1/projects" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# All non-archived
curl "${baseUrl}/api/v1/projects?status=all" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                    jsExample={`const res = await fetch("${baseUrl}/api/v1/projects", {
  headers: { Authorization: "Bearer YOUR_TOKEN" },
})
const projects = await res.json()
// projects[0].tasks — array of tasks`}
                />

                {/* GET /timer */}
                <EndpointDoc
                    method="GET"
                    path="/api/v1/timer"
                    description="Returns the currently running timer, or null if no timer is active. elapsedSeconds is computed server-side at request time."
                    responseExample={`// Running timer
{
  "id": "clxte001",
  "date": "2025-03-06",
  "description": "Building login page",
  "timerStartedAt": "2025-03-06T09:00:00.000Z",
  "elapsedSeconds": 3612,
  "isBillable": true,
  "project": { "id": "clxproj001", "name": "Website Redesign", "code": "WEB" },
  "task": { "id": "clxtask02", "name": "Frontend" }
}

// No running timer
null`}
                    curlExample={`curl ${baseUrl}/api/v1/timer \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                    jsExample={`const res = await fetch("${baseUrl}/api/v1/timer", {
  headers: { Authorization: "Bearer YOUR_TOKEN" },
})
const timer = await res.json() // null if no active timer`}
                />

                {/* POST /timer/start */}
                <EndpointDoc
                    method="POST"
                    path="/api/v1/timer/start"
                    description="Starts a new timer. Any currently running timer is automatically stopped first. Billing rate is resolved from the project's billing configuration. Returns 201 on success."
                    bodyFields={[
                        { name: "projectId", type: "string", required: true, description: "ID of the project to log time against" },
                        { name: "taskId", type: "string", required: false, description: "ID of a specific task within the project" },
                        { name: "description", type: "string", required: false, description: "Notes for this entry (required if workspace has requireTimeEntryNotes enabled)" },
                        { name: "linearIssueId", type: "string", required: false, description: "Linear issue ID — auto-creates or links a matching task" },
                        { name: "energyLevel", type: "number", required: false, description: "1–5 energy level at start of work (shown if workspace has energyTracking enabled)" },
                    ]}
                    responseExample={`// 201 Created
{
  "id": "clxte002",
  "date": "2025-03-06",
  "timerStartedAt": "2025-03-06T14:22:00.000Z",
  "description": "Building login page",
  "isBillable": true,
  "project": { "id": "clxproj001", "name": "Website Redesign", "code": "WEB" },
  "task": { "id": "clxtask02", "name": "Frontend" }
}`}
                    curlExample={`curl -X POST ${baseUrl}/api/v1/timer/start \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "projectId": "clxproj001", "description": "Building login page" }'`}
                    jsExample={`const res = await fetch("${baseUrl}/api/v1/timer/start", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    projectId: "clxproj001",
    description: "Building login page",
  }),
})
const entry = await res.json() // 201`}
                />

                {/* POST /timer/stop */}
                <EndpointDoc
                    method="POST"
                    path="/api/v1/timer/stop"
                    description="Stops the running timer and finalises the time entry. Workspace time rounding is applied automatically. Returns 404 if no timer is active."
                    responseExample={`// 200 OK
{
  "id": "clxte002",
  "date": "2025-03-06",
  "durationSeconds": 4080,
  "description": "Building login page",
  "isBillable": true,
  "project": { "id": "clxproj001", "name": "Website Redesign", "code": "WEB" },
  "task": { "id": "clxtask02", "name": "Frontend" }
}

// 404 if no timer running
{ "error": "No running timer" }`}
                    curlExample={`curl -X POST ${baseUrl}/api/v1/timer/stop \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                    jsExample={`const res = await fetch("${baseUrl}/api/v1/timer/stop", {
  method: "POST",
  headers: { Authorization: "Bearer YOUR_TOKEN" },
})
const entry = await res.json()`}
                />

                {/* POST /time */}
                <EndpointDoc
                    method="POST"
                    path="/api/v1/time"
                    description="Creates a completed manual time entry (not a live timer). Duration is rounded per workspace settings. Billing rate is derived from the project's billing configuration. Returns 201 on success."
                    bodyFields={[
                        { name: "projectId", type: "string", required: true, description: "ID of the project" },
                        { name: "date", type: "string", required: true, description: "Entry date — format: yyyy-MM-dd" },
                        { name: "hours", type: "number", required: true, description: "Duration in decimal hours, e.g. 1.5 = 1h 30m. Must be > 0." },
                        { name: "taskId", type: "string", required: false, description: "Task within the project (optional)" },
                        { name: "description", type: "string", required: false, description: "Notes (required if workspace has requireTimeEntryNotes enabled)" },
                        { name: "energyLevel", type: "number", required: false, description: "1–5 energy level at time of logging" },
                    ]}
                    responseExample={`// 201 Created
{
  "id": "clxte003",
  "date": "2025-03-06",
  "durationSeconds": 5400,
  "description": "Reviewed pull requests",
  "isBillable": true,
  "project": { "id": "clxproj001", "name": "Website Redesign" },
  "task": { "id": "clxtask01", "name": "Code Review" }
}`}
                    curlExample={`curl -X POST ${baseUrl}/api/v1/time \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectId": "clxproj001",
    "date": "2025-03-06",
    "hours": 1.5,
    "description": "Reviewed pull requests"
  }'`}
                    jsExample={`const res = await fetch("${baseUrl}/api/v1/time", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    projectId: "clxproj001",
    date: new Date().toISOString().slice(0, 10),
    hours: 1.5,
    description: "Reviewed pull requests",
  }),
})
const entry = await res.json() // 201`}
                />

                {/* GET /time/entries */}
                <EndpointDoc
                    method="GET"
                    path="/api/v1/time/entries"
                    description="Lists all time entries for the authenticated user on a given date, ordered oldest-first. Includes both completed entries and any running timer (with durationSeconds computed as elapsed time)."
                    queryParams={[
                        { name: "date", type: "string", required: true, description: "Date to fetch — format: yyyy-MM-dd" },
                    ]}
                    responseExample={`[
  {
    "id": "clxte003",
    "date": "2025-03-06",
    "durationSeconds": 5400,
    "timerStartedAt": null,
    "description": "Morning standup",
    "isBillable": false,
    "energyLevel": 4,
    "approvalStatus": "PENDING",
    "isLocked": false,
    "project": { "id": "clxproj001", "name": "Website Redesign", "code": "WEB" },
    "task": { "id": "clxtask01", "name": "Meetings" }
  }
]`}
                    curlExample={`curl "${baseUrl}/api/v1/time/entries?date=2025-03-06" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                    jsExample={`const today = new Date().toISOString().slice(0, 10)
const res = await fetch(
  \`${baseUrl}/api/v1/time/entries?date=\${today}\`,
  { headers: { Authorization: "Bearer YOUR_TOKEN" } }
)
const entries = await res.json()`}
                />

                {/* GET /time/entries/[id] */}
                <EndpointDoc
                    method="GET"
                    path="/api/v1/time/entries/:id"
                    description="Returns a single time entry by ID. Only entries belonging to the authenticated user are accessible."
                    responseExample={`{
  "id": "clxte003",
  "date": "2025-03-06",
  "durationSeconds": 5400,
  "timerStartedAt": null,
  "description": "Reviewed pull requests",
  "isBillable": true,
  "billableRateCents": 15000,
  "energyLevel": 3,
  "approvalStatus": "PENDING",
  "isLocked": false,
  "project": { "id": "clxproj001", "name": "Website Redesign", "code": "WEB" },
  "task": { "id": "clxtask01", "name": "Code Review" }
}`}
                    curlExample={`curl "${baseUrl}/api/v1/time/entries/clxte003" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                    jsExample={`const res = await fetch(
  \`${baseUrl}/api/v1/time/entries/\${entryId}\`,
  { headers: { Authorization: "Bearer YOUR_TOKEN" } }
)
const entry = await res.json()`}
                />

                {/* PATCH /time/entries/[id] */}
                <EndpointDoc
                    method="PATCH"
                    path="/api/v1/time/entries/:id"
                    description="Updates one or more fields on a time entry. Only send the fields you want to change. Blocked on approved, locked, or invoiced entries (409). Workspace notes requirement and time rounding are enforced."
                    bodyFields={[
                        { name: "description", type: "string", required: false, description: "Updated notes" },
                        { name: "date", type: "string", required: false, description: "Reassign to a different date — yyyy-MM-dd" },
                        { name: "hours", type: "number", required: false, description: "New duration in decimal hours. Must be > 0." },
                        { name: "projectId", type: "string", required: false, description: "Move entry to a different project (billing is recalculated)" },
                        { name: "taskId", type: "string | null", required: false, description: "Change or clear the task (null to remove)" },
                        { name: "isBillable", type: "boolean", required: false, description: "Override billability (billing rate is recalculated)" },
                        { name: "energyLevel", type: "number | null", required: false, description: "1–5 energy level, or null to clear" },
                    ]}
                    responseExample={`// 200 OK — same shape as GET /time/entries/:id`}
                    curlExample={`curl -X PATCH "${baseUrl}/api/v1/time/entries/clxte003" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "description": "Updated notes", "hours": 2.0 }'`}
                    jsExample={`const res = await fetch(
  \`${baseUrl}/api/v1/time/entries/\${entryId}\`,
  {
    method: "PATCH",
    headers: {
      Authorization: "Bearer YOUR_TOKEN",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ description: "Updated notes", hours: 2.0 }),
  }
)
const updated = await res.json()`}
                />

                {/* DELETE /time/entries/[id] */}
                <EndpointDoc
                    method="DELETE"
                    path="/api/v1/time/entries/:id"
                    description="Permanently deletes a time entry. Blocked on approved, locked, or invoiced entries (409). Returns 204 No Content on success."
                    responseExample={`// 204 No Content (empty body)

// 409 if entry is locked, approved, or invoiced
{ "error": "Entry has been approved and cannot be deleted" }`}
                    curlExample={`curl -X DELETE "${baseUrl}/api/v1/time/entries/clxte003" \\
  -H "Authorization: Bearer YOUR_TOKEN"
# → 204 No Content`}
                    jsExample={`const res = await fetch(
  \`${baseUrl}/api/v1/time/entries/\${entryId}\`,
  {
    method: "DELETE",
    headers: { Authorization: "Bearer YOUR_TOKEN" },
  }
)
// res.status === 204 on success`}
                />
            </section>

            <Separator className="border-sidebar-border" />

            {/* Error codes */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold">Error Codes</h2>
                <div className="rounded-md border border-sidebar-border overflow-hidden text-sm">
                    {[
                        { status: "400", label: "Bad Request", desc: "A required field is missing or invalid. The error message specifies the issue." },
                        { status: "401", label: "Unauthorized", desc: "Token is missing, invalid, expired, or has been revoked." },
                        { status: "404", label: "Not Found", desc: "The resource does not exist or does not belong to your workspace." },
                        { status: "409", label: "Conflict", desc: "The operation is not allowed in the current state — entry is approved, locked, or attached to an invoice." },
                        { status: "500", label: "Server Error", desc: "An unexpected error occurred. Contact support if this persists." },
                    ].map(({ status, label, desc }, i) => (
                        <div key={status} className={`flex items-start gap-4 px-4 py-3 ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                            <code className="font-mono text-xs text-muted-foreground w-8 shrink-0 pt-0.5">{status}</code>
                            <span className="font-medium w-32 shrink-0">{label}</span>
                            <span className="text-muted-foreground">{desc}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    All errors return JSON:{" "}
                    <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{`{ "error": "Description of the error" }`}</code>
                </p>
            </section>

            <Separator className="border-sidebar-border" />

            {/* Entry states */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold">Entry States &amp; Constraints</h2>
                <p className="text-sm text-muted-foreground">
                    Time entries carry state that restricts which operations are permitted.
                </p>
                <div className="rounded-md border border-sidebar-border overflow-hidden text-sm">
                    {[
                        { field: "approvalStatus", values: "PENDING · APPROVED · REJECTED", desc: "Approved entries cannot be edited or deleted via API." },
                        { field: "isLocked", values: "true · false", desc: "Locked entries (e.g. closed billing periods) block all edits." },
                        { field: "invoiceId", values: "string | null", desc: "Entries attached to an invoice cannot be edited or deleted." },
                        { field: "timerStartedAt", values: "ISO string | null", desc: "Non-null means the timer is currently running. durationSeconds reflects elapsed time." },
                    ].map(({ field, values, desc }, i) => (
                        <div key={field} className={`flex items-start gap-4 px-4 py-3 ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                            <code className="font-mono text-xs text-foreground w-36 shrink-0 pt-0.5">{field}</code>
                            <code className="font-mono text-xs text-muted-foreground w-48 shrink-0 pt-0.5 hidden sm:block">{values}</code>
                            <span className="text-muted-foreground text-xs">{desc}</span>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
    GET:    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    POST:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    PATCH:  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    DELETE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
}

function EndpointDoc({
    method,
    path,
    description,
    queryParams,
    bodyFields,
    responseExample,
    curlExample,
    jsExample,
}: {
    method: string
    path: string
    description: string
    queryParams?: { name: string; type: string; required: boolean; description: string }[]
    bodyFields?: { name: string; type: string; required: boolean; description: string }[]
    responseExample: string
    curlExample: string
    jsExample: string
}) {
    const color = METHOD_COLORS[method] ?? METHOD_COLORS.GET
    return (
        <div className="space-y-4 pb-2">
            <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`font-mono text-xs font-bold rounded border ${color} hover:${color}`} variant="outline">
                    {method}
                </Badge>
                <code className="text-sm font-mono text-foreground">{path}</code>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>

            {queryParams && queryParams.length > 0 && (
                <ParamsTable title="Query Parameters" params={queryParams} />
            )}

            {bodyFields && bodyFields.length > 0 && (
                <ParamsTable title="Request Body" params={bodyFields} />
            )}

            {bodyFields?.length === 0 && method === "POST" && (
                <p className="text-xs text-muted-foreground">No request body required.</p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">cURL</p>
                    <CodeBlock code={curlExample} />
                </div>
                <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">JavaScript</p>
                    <CodeBlock code={jsExample} />
                </div>
                <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Response</p>
                    <CodeBlock code={responseExample} />
                </div>
            </div>
        </div>
    )
}

function ParamsTable({ title, params }: {
    title: string
    params: { name: string; type: string; required: boolean; description: string }[]
}) {
    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <div className="rounded-md border border-sidebar-border overflow-hidden text-sm">
                {params.map(({ name, type, required, description }, i) => (
                    <div key={name} className={`flex items-start gap-3 px-4 py-2.5 ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                        <code className="font-mono text-xs text-foreground w-36 shrink-0 pt-0.5">{name}</code>
                        <code className="font-mono text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{type}</code>
                        <div className="flex-1 text-xs text-muted-foreground">
                            {required && (
                                <span className="text-[10px] font-semibold text-destructive mr-2 uppercase tracking-wide">required</span>
                            )}
                            {description}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function CodeBlock({ code }: { code: string }) {
    return (
        <pre className="rounded-md border border-sidebar-border bg-sidebar/60 dark:bg-sidebar/40 p-4 text-xs font-mono overflow-x-auto leading-relaxed text-foreground/90 whitespace-pre-wrap h-full">
            {code}
        </pre>
    )
}

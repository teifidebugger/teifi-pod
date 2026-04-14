"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

// ─── Token encryption (same key derivation as Linear) ────────────────────────

const ENCRYPTION_KEY = Buffer.from(
    crypto.hkdfSync(
        "sha256",
        process.env.BETTER_AUTH_SECRET ?? "dev-secret",
        "teifi-harvest",
        "harvest-token-v1",
        32
    )
)

function encryptToken(plaintext: string): string {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([iv, tag, encrypted]).toString("base64")
}

function decryptToken(ciphertext: string): string {
    const buf = Buffer.from(ciphertext, "base64")
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const encrypted = buf.subarray(28)
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv, { authTagLength: 16 })
    decipher.setAuthTag(tag)
    return decipher.update(encrypted) + decipher.final("utf8")
}

// ─── Harvest API helpers ──────────────────────────────────────────────────────

const HARVEST_BASE = "https://api.harvestapp.com/v2"

type HarvestHeaders = { Authorization: string; "Harvest-Account-Id": string; "User-Agent": string }

function harvestHeaders(token: string, accountId: string): HarvestHeaders {
    return {
        Authorization: `Bearer ${token}`,
        "Harvest-Account-Id": accountId,
        "User-Agent": "teifi-pod/1.0",
    }
}

async function harvestGet<T>(path: string, headers: HarvestHeaders): Promise<T> {
    const res = await fetch(`${HARVEST_BASE}${path}`, { headers })
    if (!res.ok) throw new Error(`Harvest API ${path}: ${res.status} ${res.statusText}`)
    return res.json()
}

async function harvestPaginate<T>(
    path: string,
    key: string,
    headers: HarvestHeaders
): Promise<T[]> {
    const results: T[] = []
    let page = 1
    while (true) {
        const sep = path.includes("?") ? "&" : "?"
        const data = await harvestGet<Record<string, T[]> & { total_pages: number }>(
            `${path}${sep}per_page=100&page=${page}`,
            headers
        )
        results.push(...(data[key] ?? []))
        if (page >= data.total_pages) break
        page++
        await new Promise(r => setTimeout(r, 150))
    }
    return results
}

// ─── Session guard ────────────────────────────────────────────────────────────

async function getCallerMember() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new Error("Not authenticated")
    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { id: true, workspaceId: true, role: true, userId: true },
    })
    if (!member) throw new Error("Not a workspace member")
    if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) throw new Error("Insufficient permissions")
    return { member, userId: session.user.id }
}

// ─── Save / delete token ──────────────────────────────────────────────────────

export async function saveHarvestToken(token: string, accountId: string) {
    const { member, userId } = await getCallerMember()

    const hdrs = harvestHeaders(token, accountId)
    const me = await harvestGet<{ id: number; email: string; first_name: string; last_name: string; account: { id: number; name: string } }>(
        "/users/me",
        hdrs
    )

    await prisma.harvestToken.upsert({
        where: { userId_workspaceId: { userId, workspaceId: member.workspaceId } },
        create: {
            userId,
            workspaceId: member.workspaceId,
            token: encryptToken(token),
            accountId,
            accountName: me.account?.name ?? null,
        },
        update: {
            token: encryptToken(token),
            accountId,
            accountName: me.account?.name ?? null,
        },
    })

    revalidatePath("/settings/integrations")
    return { name: `${me.first_name} ${me.last_name}`, email: me.email, accountName: me.account?.name }
}

export async function deleteHarvestToken() {
    const { member, userId } = await getCallerMember()
    await prisma.harvestToken.deleteMany({
        where: { userId, workspaceId: member.workspaceId },
    })
    revalidatePath("/settings/integrations")
}

// ─── Preview ──────────────────────────────────────────────────────────────────

export type HarvestPreview = {
    clients: { total: number; new: number }
    projects: { total: number; new: number }
    users: { total: number; matched: number; unmatched: number }
    tasks: { total: number }
    timeEntries: { total: number }
}

export async function previewHarvestImport(dateFrom: string, dateTo: string): Promise<HarvestPreview> {
    const { member, userId } = await getCallerMember()

    const stored = await prisma.harvestToken.findFirst({
        where: { userId, workspaceId: member.workspaceId },
    })
    if (!stored) throw new Error("No Harvest token saved")

    const token = decryptToken(stored.token)
    const hdrs = harvestHeaders(token, stored.accountId)

    const [hClients, hProjects, hUsers, hTasks, hEntries] = await Promise.all([
        harvestPaginate<{ id: number }>("clients", "clients", hdrs),
        harvestPaginate<{ id: number }>("projects", "projects", hdrs),
        harvestPaginate<{ id: number; email: string }>("users", "users", hdrs),
        harvestPaginate<{ id: number }>("tasks", "tasks", hdrs),
        harvestPaginate<{ id: number }>(`time_entries?from=${dateFrom}&to=${dateTo}`, "time_entries", hdrs),
    ])

    const existingClientIds = new Set(
        (await prisma.client.findMany({ where: { workspaceId: member.workspaceId, harvestId: { not: null } }, select: { harvestId: true } }))
            .map(c => c.harvestId!)
    )
    const existingProjectIds = new Set(
        (await prisma.teifiProject.findMany({ where: { workspaceId: member.workspaceId, harvestId: { not: null } }, select: { harvestId: true } }))
            .map(p => p.harvestId!)
    )

    const allEmails = new Set(
        (await prisma.user.findMany({ select: { email: true } })).map(u => u.email.toLowerCase())
    )

    const matched = hUsers.filter((u: { email: string }) => allEmails.has(u.email.toLowerCase())).length

    return {
        clients: { total: hClients.length, new: hClients.filter((c: { id: number }) => !existingClientIds.has(c.id)).length },
        projects: { total: hProjects.length, new: hProjects.filter((p: { id: number }) => !existingProjectIds.has(p.id)).length },
        users: { total: hUsers.length, matched, unmatched: hUsers.length - matched },
        tasks: { total: hTasks.length },
        timeEntries: { total: hEntries.length },
    }
}

// ─── Import ───────────────────────────────────────────────────────────────────

export type ImportResult = {
    clients: number
    projects: number
    users: number
    tasks: number
    timeEntries: number
    stubUsersCreated: number
}

export async function runHarvestImport(dateFrom: string, dateTo: string): Promise<ImportResult> {
    const { member, userId } = await getCallerMember()
    const { workspaceId } = member

    const stored = await prisma.harvestToken.findFirst({
        where: { userId, workspaceId },
    })
    if (!stored) throw new Error("No Harvest token saved")

    const token = decryptToken(stored.token)
    const hdrs = harvestHeaders(token, stored.accountId)

    // 1. Fetch all data from Harvest
    const [hClients, hProjects, hUsers, hTasks, hEntries] = await Promise.all([
        harvestPaginate<HarvestClient>("clients", "clients", hdrs),
        harvestPaginate<HarvestProject>("projects", "projects", hdrs),
        harvestPaginate<HarvestUser>("users", "users", hdrs),
        harvestPaginate<HarvestTask>("tasks", "tasks", hdrs),
        harvestPaginate<HarvestTimeEntry>(`time_entries?from=${dateFrom}&to=${dateTo}`, "time_entries", hdrs),
    ])

    const result: ImportResult = { clients: 0, projects: 0, users: 0, tasks: 0, timeEntries: 0, stubUsersCreated: 0 }

    // 2. Upsert clients
    const clientIdMap = new Map<number, string>() // harvestId → teifi cuid
    for (const c of hClients) {
        const existing = await prisma.client.findFirst({ where: { workspaceId, harvestId: c.id } })
        if (existing) {
            clientIdMap.set(c.id, existing.id)
        } else {
            const created = await prisma.client.create({
                data: { name: c.name, workspaceId, harvestId: c.id },
            })
            clientIdMap.set(c.id, created.id)
            result.clients++
        }
    }

    // 3. Upsert projects
    const projectIdMap = new Map<number, string>()
    for (const p of hProjects) {
        const clientId = p.client?.id ? clientIdMap.get(p.client.id) ?? null : null
        const existing = await prisma.teifiProject.findFirst({ where: { workspaceId, harvestId: p.id } })
        if (existing) {
            projectIdMap.set(p.id, existing.id)
        } else {
            const created = await prisma.teifiProject.create({
                data: {
                    name: p.name,
                    workspaceId,
                    harvestId: p.id,
                    clientId,
                    billingType: p.bill_by === "none" ? "NON_BILLABLE" : "HOURLY",
                    hourlyRateCents: p.hourly_rate ? Math.round(p.hourly_rate * 100) : null,
                    budgetHours: p.budget ?? null,
                },
            })
            projectIdMap.set(p.id, created.id)
            result.projects++
        }
    }

    // 4. Upsert users → WorkspaceMember (email match or stub)
    const userIdMap = new Map<number, string>() // harvestId → User.id
    for (const hu of hUsers) {
        let user = await prisma.user.findFirst({ where: { email: { equals: hu.email, mode: "insensitive" } } })
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: hu.email.toLowerCase(),
                    name: `${hu.first_name} ${hu.last_name}`.trim(),
                    emailVerified: false,
                },
            })
            result.stubUsersCreated++
        }
        userIdMap.set(hu.id, user.id)

        // Ensure WorkspaceMember exists
        const existing = await prisma.workspaceMember.findFirst({ where: { userId: user.id, workspaceId } })
        if (!existing) {
            await prisma.workspaceMember.create({
                data: {
                    userId: user.id,
                    workspaceId,
                    harvestId: hu.id,
                    weeklyCapacityHours: hu.weekly_capacity ? hu.weekly_capacity / 3600 : 40,
                    disabledAt: new Date(), // stub — can't login until invited
                },
            })
            result.users++
        } else if (!existing.harvestId) {
            await prisma.workspaceMember.update({ where: { id: existing.id }, data: { harvestId: hu.id } })
        }
    }

    // 5. Upsert tasks per project
    const taskIdMap = new Map<string, string>() // `${projectHarvestId}:${taskHarvestId}` → teifi cuid
    for (const ht of hTasks) {
        // Tasks in Harvest are global — they get linked via project_tasks
        // We create them lazily per project when we process time entries
        taskIdMap.set(`global:${ht.id}`, ht.name)
    }

    // 6. Upsert time entries
    for (const entry of hEntries) {
        const teifiProjectId = entry.project?.id ? projectIdMap.get(entry.project.id) : null
        if (!teifiProjectId) continue

        const userId = entry.user?.id ? userIdMap.get(entry.user.id) : null
        if (!userId) continue

        // Lazy-create task within project
        let taskId: string | null = null
        if (entry.task?.id) {
            const taskKey = `${entry.project?.id}:${entry.task.id}`
            const existing = await prisma.teifiTask.findFirst({
                where: { projectId: teifiProjectId, harvestId: entry.task.id },
            })
            if (existing) {
                taskId = existing.id
            } else {
                const taskName = taskIdMap.get(`global:${entry.task.id}`) ?? entry.task.name ?? "Task"
                const created = await prisma.teifiTask.create({
                    data: { name: taskName, projectId: teifiProjectId, harvestId: entry.task.id },
                })
                taskId = created.id
                taskIdMap.set(taskKey, created.id)
                result.tasks++
            }
        }

        // Upsert time entry by harvestId + projectId
        const existing = await prisma.timeEntry.findFirst({
            where: { projectId: teifiProjectId, harvestId: entry.id },
        })
        if (!existing) {
            await prisma.timeEntry.create({
                data: {
                    userId,
                    projectId: teifiProjectId,
                    taskId,
                    harvestId: entry.id,
                    date: entry.spent_date,
                    durationSeconds: Math.round((entry.hours ?? 0) * 3600),
                    isBillable: entry.billable ?? true,
                    billableRateCents: entry.billable_rate ? Math.round(entry.billable_rate * 100) : 0,
                    costRateCents: entry.cost_rate ? Math.round(entry.cost_rate * 100) : 0,
                    description: entry.notes ?? null,
                    isLocked: entry.is_locked ?? false,
                    approvalStatus: "APPROVED",
                },
            })
            result.timeEntries++
        }
    }

    revalidatePath("/time")
    revalidatePath("/reports")
    return result
}

// ─── Harvest API types ────────────────────────────────────────────────────────

type HarvestClient = { id: number; name: string }
type HarvestProject = {
    id: number; name: string
    client: { id: number } | null
    bill_by: string
    hourly_rate: number | null
    budget: number | null
}
type HarvestUser = {
    id: number; email: string; first_name: string; last_name: string
    weekly_capacity: number | null
}
type HarvestTask = { id: number; name: string }
type HarvestTimeEntry = {
    id: number
    user: { id: number } | null
    project: { id: number } | null
    task: { id: number; name?: string } | null
    spent_date: string
    hours: number
    billable: boolean
    billable_rate: number | null
    cost_rate: number | null
    notes: string | null
    is_locked: boolean
}

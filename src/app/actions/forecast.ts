"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

// ─── Token encryption (same pattern as Harvest) ──────────────────────────────

const ENCRYPTION_KEY = Buffer.from(
    crypto.hkdfSync(
        "sha256",
        process.env.BETTER_AUTH_SECRET ?? "dev-secret",
        "teifi-forecast",
        "forecast-token-v1",
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

// ─── Forecast API helpers ─────────────────────────────────────────────────────

const FORECAST_BASE = "https://api.forecastapp.com"

type ForecastHeaders = {
    Authorization: string
    "Forecast-Account-Id": string
    "User-Agent": string
}

function forecastHeaders(token: string, accountId: string): ForecastHeaders {
    return {
        Authorization: `Bearer ${token}`,
        "Forecast-Account-Id": accountId,
        "User-Agent": "teifi-pod/1.0",
    }
}

async function forecastGet<T>(path: string, hdrs: ForecastHeaders): Promise<T> {
    const res = await fetch(`${FORECAST_BASE}${path}`, { headers: hdrs })
    if (!res.ok) throw new Error(`Forecast API ${path}: ${res.status} ${res.statusText}`)
    return res.json()
}

// Forecast API returns all records in one response (no pagination)
async function forecastGetAll<T>(path: string, key: string, hdrs: ForecastHeaders): Promise<T[]> {
    const data = await forecastGet<Record<string, T[]>>(path, hdrs)
    return data[key] ?? []
}

// ─── Forecast API types ───────────────────────────────────────────────────────

type ForecastPerson = {
    id: number
    first_name: string
    last_name: string | null
    email: string | null
    roles: string[]
    weekly_capacity: number | null  // seconds per week
    harvest_user_id: number | null
    archived: boolean
    updated_at: string
}

type ForecastProject = {
    id: number
    name: string
    color: string | null
    code: string | null
    start_date: string | null
    end_date: string | null
    harvest_id: number | null
    client_id: number | null
    archived: boolean
    tags: string[]
    updated_at: string
}

type ForecastAssignment = {
    id: number
    start_date: string
    end_date: string
    allocation: number | null  // seconds per day
    person_id: number | null
    placeholder_id: number | null
    project_id: number
    notes: string | null
    updated_at: string
}

type ForecastClient = {
    id: number
    name: string
    harvest_id: number | null
    archived: boolean
    updated_at: string
}

type ForecastPlaceholder = {
    id: number
    name: string
    roles: string[]
    archived: boolean
    updated_at: string
}

// ─── Session guard ────────────────────────────────────────────────────────────

async function getSessionAndMember() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new Error("Not authenticated")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) throw new Error("No workspace membership found")

    const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(member.role)
    if (!canManage) throw new Error("Insufficient permissions")

    return { userId: session.user.id, workspaceId: member.workspaceId }
}

async function getDecryptedToken(userId: string, workspaceId: string) {
    const record = await prisma.forecastToken.findFirst({ where: { userId, workspaceId } })
    if (!record) throw new Error("Forecast not connected")
    return { token: decryptToken(record.token), accountId: record.accountId }
}

// ─── Connect / disconnect ─────────────────────────────────────────────────────

export async function saveForecastToken(
    token: string,
    accountId: string
): Promise<{ accountName: string | null; email: string | null }> {
    const { userId, workspaceId } = await getSessionAndMember()

    // Validate token by fetching current user
    const hdrs = forecastHeaders(token, accountId)
    let accountName: string | null = null
    let email: string | null = null
    try {
        const me = await forecastGet<{ current_user: { account_id: number; account_name?: string; email?: string } }>(
            "/whoami",
            hdrs
        )
        accountName = me.current_user?.account_name ?? null
        email = me.current_user?.email ?? null
    } catch {
        throw new Error("Invalid Forecast token or Account ID — please check your credentials")
    }

    await prisma.forecastToken.upsert({
        where: { userId_workspaceId: { userId, workspaceId } },
        create: { userId, workspaceId, token: encryptToken(token), accountId, accountName },
        update: { token: encryptToken(token), accountId, accountName },
    })

    revalidatePath("/settings/integrations")
    return { accountName, email }
}

export async function deleteForecastToken(): Promise<void> {
    const { userId, workspaceId } = await getSessionAndMember()
    await prisma.forecastToken.deleteMany({ where: { userId, workspaceId } })
    revalidatePath("/settings/integrations")
}

// ─── Types returned to client ─────────────────────────────────────────────────

export type ForecastPreview = {
    clients: { total: number; new: number }
    projects: { total: number; new: number }
    people: { total: number; matched: number; unmatched: number }
    placeholders: { total: number; new: number }
    assignments: { total: number }
}

export type ForecastImportResult = {
    clients: number
    projects: number
    people: number
    placeholders: number
    assignments: number
    stubUsersCreated: number
}

// ─── Preview ──────────────────────────────────────────────────────────────────

export async function previewForecastImport(): Promise<ForecastPreview> {
    const { userId, workspaceId } = await getSessionAndMember()
    const { token, accountId } = await getDecryptedToken(userId, workspaceId)
    const hdrs = forecastHeaders(token, accountId)

    const [clients, projects, people, placeholders, assignments] = await Promise.all([
        forecastGetAll<ForecastClient>("/clients", "clients", hdrs),
        forecastGetAll<ForecastProject>("/projects", "projects", hdrs),
        forecastGetAll<ForecastPerson>("/people", "people", hdrs),
        forecastGetAll<ForecastPlaceholder>("/placeholders", "placeholders", hdrs),
        forecastGetAll<ForecastAssignment>("/assignments", "assignments", hdrs),
    ])

    // Existing by forecastId
    const existingClients = await prisma.client.findMany({
        where: { workspaceId, forecastId: { not: null } },
        select: { forecastId: true },
    })
    const existingProjects = await prisma.teifiProject.findMany({
        where: { workspaceId, forecastId: { not: null } },
        select: { forecastId: true },
    })
    const existingPlaceholders = await prisma.placeholder.findMany({
        where: { workspaceId, forecastId: { not: null } },
        select: { forecastId: true },
    })

    const existingClientIds = new Set(existingClients.map(c => c.forecastId))
    const existingProjectIds = new Set(existingProjects.map(p => p.forecastId))
    const existingPlaceholderIds = new Set(existingPlaceholders.map(p => p.forecastId))

    // Email match check for people
    const emails = people
        .filter(p => p.email && !p.archived)
        .map(p => p.email as string)
    const matchedUsers = await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { email: true },
    })
    const matchedEmails = new Set(matchedUsers.map(u => u.email))

    const activePeople = people.filter(p => !p.archived)
    const matched = activePeople.filter(p => p.email && matchedEmails.has(p.email)).length
    const unmatched = activePeople.length - matched

    return {
        clients: {
            total: clients.filter(c => !c.archived).length,
            new: clients.filter(c => !c.archived && !existingClientIds.has(c.id)).length,
        },
        projects: {
            total: projects.filter(p => !p.archived).length,
            new: projects.filter(p => !p.archived && !existingProjectIds.has(p.id)).length,
        },
        people: { total: activePeople.length, matched, unmatched },
        placeholders: {
            total: placeholders.filter(p => !p.archived).length,
            new: placeholders.filter(p => !p.archived && !existingPlaceholderIds.has(p.id)).length,
        },
        assignments: { total: assignments.length },
    }
}

// ─── Run import ───────────────────────────────────────────────────────────────

export async function runForecastImport(): Promise<ForecastImportResult> {
    const { userId, workspaceId } = await getSessionAndMember()
    const { token, accountId } = await getDecryptedToken(userId, workspaceId)
    const hdrs = forecastHeaders(token, accountId)

    const [fcClients, fcProjects, fcPeople, fcPlaceholders, fcAssignments] = await Promise.all([
        forecastGetAll<ForecastClient>("/clients", "clients", hdrs),
        forecastGetAll<ForecastProject>("/projects", "projects", hdrs),
        forecastGetAll<ForecastPerson>("/people", "people", hdrs),
        forecastGetAll<ForecastPlaceholder>("/placeholders", "placeholders", hdrs),
        forecastGetAll<ForecastAssignment>("/assignments", "assignments", hdrs),
    ])

    let clientsUpserted = 0
    let projectsUpserted = 0
    let peopleUpserted = 0
    let placeholdersUpserted = 0
    let assignmentsUpserted = 0
    let stubUsersCreated = 0

    // Maps: forecastId → internal id
    const clientMap = new Map<number, string>()
    const projectMap = new Map<number, string>()
    const personMemberMap = new Map<number, string>()   // forecastId → WorkspaceMember.id
    const placeholderMap = new Map<number, string>()

    // ── 1. Clients ────────────────────────────────────────────────────────────
    for (const fc of fcClients.filter(c => !c.archived)) {
        // Try cross-link with Harvest import via harvest_id
        let existing = fc.harvest_id
            ? await prisma.client.findFirst({ where: { workspaceId, harvestId: fc.harvest_id } })
            : null

        if (existing) {
            // Already imported via Harvest — just stamp forecastId
            await prisma.client.update({
                where: { id: existing.id },
                data: { forecastId: fc.id },
            })
            clientMap.set(fc.id, existing.id)
        } else {
            const upserted = await prisma.client.upsert({
                where: { workspaceId_forecastId: { workspaceId, forecastId: fc.id } },
                create: {
                    workspaceId,
                    name: fc.name,
                    forecastId: fc.id,
                },
                update: { name: fc.name },
            })
            clientMap.set(fc.id, upserted.id)
        }
        clientsUpserted++
    }

    // ── 2. People ─────────────────────────────────────────────────────────────
    for (const fc of fcPeople.filter(p => !p.archived)) {
        // Cross-link: if this person has a harvest_user_id, find existing member by harvestId
        let member = fc.harvest_user_id
            ? await prisma.workspaceMember.findFirst({
                where: { workspaceId, harvestId: fc.harvest_user_id },
            })
            : null

        if (!member && fc.email) {
            // Email match
            const user = await prisma.user.findFirst({ where: { email: fc.email } })
            if (user) {
                member = await prisma.workspaceMember.findFirst({
                    where: { userId: user.id, workspaceId },
                })
            }
        }

        if (member) {
            // Update forecastId + capacity
            const weeklyCapacityHours = fc.weekly_capacity
                ? fc.weekly_capacity / 3600
                : member.weeklyCapacityHours
            await prisma.workspaceMember.update({
                where: { id: member.id },
                data: {
                    forecastId: fc.id,
                    weeklyCapacityHours,
                },
            })
            personMemberMap.set(fc.id, member.id)
        } else if (fc.email) {
            // Create stub user
            const name = [fc.first_name, fc.last_name].filter(Boolean).join(" ")
            const stubUser = await prisma.user.upsert({
                where: { email: fc.email },
                create: { email: fc.email, name, emailVerified: false },
                update: {},
            })
            const weeklyCapacityHours = fc.weekly_capacity ? fc.weekly_capacity / 3600 : 40
            const stubMember = await prisma.workspaceMember.upsert({
                where: { userId_workspaceId: { userId: stubUser.id, workspaceId } },
                create: {
                    userId: stubUser.id,
                    workspaceId,
                    forecastId: fc.id,
                    weeklyCapacityHours,
                    disabledAt: new Date(),
                },
                update: { forecastId: fc.id, weeklyCapacityHours },
            })
            personMemberMap.set(fc.id, stubMember.id)
            stubUsersCreated++
        }
        peopleUpserted++
    }

    // ── 3. Placeholders ───────────────────────────────────────────────────────
    for (const fc of fcPlaceholders.filter(p => !p.archived)) {
        const upserted = await prisma.placeholder.upsert({
            where: { workspaceId_forecastId: { workspaceId, forecastId: fc.id } },
            create: {
                workspaceId,
                name: fc.name,
                roles: fc.roles ?? [],
                forecastId: fc.id,
            },
            update: { name: fc.name, roles: fc.roles ?? [] },
        })
        placeholderMap.set(fc.id, upserted.id)
        placeholdersUpserted++
    }

    // ── 4. Projects ───────────────────────────────────────────────────────────
    for (const fc of fcProjects.filter(p => !p.archived)) {
        // Cross-link with Harvest import
        let existing = fc.harvest_id
            ? await prisma.teifiProject.findFirst({ where: { workspaceId, harvestId: fc.harvest_id } })
            : null

        const clientId = fc.client_id ? clientMap.get(fc.client_id) ?? null : null
        const startsOn = fc.start_date ? new Date(fc.start_date) : null
        const endsOn = fc.end_date ? new Date(fc.end_date) : null

        if (existing) {
            await prisma.teifiProject.update({
                where: { id: existing.id },
                data: { forecastId: fc.id, color: fc.color ?? existing.color, startsOn, endsOn },
            })
            projectMap.set(fc.id, existing.id)
        } else {
            const upserted = await prisma.teifiProject.upsert({
                where: { workspaceId_forecastId: { workspaceId, forecastId: fc.id } },
                create: {
                    workspaceId,
                    name: fc.name,
                    clientId,
                    color: fc.color ?? "orange",
                    code: fc.code ?? null,
                    startsOn,
                    endsOn,
                    forecastId: fc.id,
                },
                update: {
                    name: fc.name,
                    clientId,
                    color: fc.color ?? "orange",
                    code: fc.code ?? null,
                    startsOn,
                    endsOn,
                },
            })
            projectMap.set(fc.id, upserted.id)
        }
        projectsUpserted++
    }

    // ── 5. Assignments → Allocations ──────────────────────────────────────────
    for (const fc of fcAssignments) {
        const projectId = projectMap.get(fc.project_id)
        if (!projectId) continue

        const memberId = fc.person_id ? personMemberMap.get(fc.person_id) ?? null : null
        const placeholderId = fc.placeholder_id ? placeholderMap.get(fc.placeholder_id) ?? null : null

        if (!memberId && !placeholderId) continue

        // allocation = seconds per day → hours per day
        const hoursPerDay = fc.allocation ? fc.allocation / 3600 : 8

        const startDate = new Date(fc.start_date)
        const endDate = new Date(fc.end_date)

        // Idempotent: upsert by (projectId, memberId/placeholderId, startDate, endDate)
        // Forecast has unique assignment IDs — store in notes field as fallback reference
        // Use a composite match: same project + person/placeholder + same date range
        const existing = await prisma.allocation.findFirst({
            where: {
                projectId,
                memberId: memberId ?? undefined,
                placeholderId: placeholderId ?? undefined,
                startDate,
                endDate,
            },
        })

        if (existing) {
            await prisma.allocation.update({
                where: { id: existing.id },
                data: { hoursPerDay, notes: fc.notes ?? existing.notes },
            })
        } else {
            await prisma.allocation.create({
                data: {
                    projectId,
                    memberId,
                    placeholderId,
                    startDate,
                    endDate,
                    hoursPerDay,
                    notes: fc.notes ?? null,
                },
            })
        }
        assignmentsUpserted++
    }

    revalidatePath("/schedule")
    revalidatePath("/settings/integrations")

    return {
        clients: clientsUpserted,
        projects: projectsUpserted,
        people: peopleUpserted,
        placeholders: placeholdersUpserted,
        assignments: assignmentsUpserted,
        stubUsersCreated,
    }
}

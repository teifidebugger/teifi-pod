/**
 * Migration script: copy all portal-related data from old DB to new DB.
 *
 * Usage:
 *   OLD_DATABASE_URL="postgresql://..." NEW_DATABASE_URL="postgresql://..." npx tsx scripts/migrate-from-old-db.ts
 *
 * Order matters — foreign key constraints require parents before children.
 */

import { Pool } from "pg"

const OLD_URL = process.env.OLD_DATABASE_URL
const NEW_URL = process.env.NEW_DATABASE_URL

if (!OLD_URL || !NEW_URL) {
    console.error("❌ Set OLD_DATABASE_URL and NEW_DATABASE_URL env vars")
    process.exit(1)
}

const oldDb = new Pool({ connectionString: OLD_URL, ssl: { rejectUnauthorized: false } })
const newDb = new Pool({ connectionString: NEW_URL, ssl: { rejectUnauthorized: false } })

async function copyTable(table: string, columns?: string) {
    const cols = columns ?? "*"
    const { rows } = await oldDb.query(`SELECT ${cols} FROM "${table}"`)
    if (rows.length === 0) {
        console.log(`  ⏭  ${table}: empty`)
        return
    }
    const keys = Object.keys(rows[0])
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
    const colList = keys.map(k => `"${k}"`).join(", ")
    let inserted = 0
    for (const row of rows) {
        try {
            await newDb.query(
                `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                keys.map(k => row[k]),
            )
            inserted++
        } catch (e: any) {
            console.warn(`  ⚠  ${table} row skip: ${e.message.slice(0, 80)}`)
        }
    }
    console.log(`  ✅ ${table}: ${inserted}/${rows.length} rows`)
}

async function main() {
    console.log("🚀 Starting migration...\n")

    // ── Auth / Users ─────────────────────────────────────────────────────────
    console.log("Auth models:")
    await copyTable("User", `"id", "name", "email", "createdAt", "image", "updatedAt", "emailVerified"`)
    await copyTable("Account")
    await copyTable("Session")
    await copyTable("Verification")

    // ── Workspace ─────────────────────────────────────────────────────────────
    console.log("\nWorkspace models:")
    // Only copy portal-relevant workspace columns
    await copyTable(
        "Workspace",
        `"id", "name", "slug", "createdAt", "updatedAt",
         "portalDefaultTransitions", "portalDefaultStateTypeMapping",
         "portalStaffDefaultTransitions", "portalAcceptanceFields",
         "emailFrom", "smtpHost", "smtpPass", "smtpPort", "smtpUser"`,
    )
    await copyTable(
        "WorkspaceMember",
        `"id", "userId", "workspaceId", "role", "joinedAt"`,
    )

    // ── Linear ────────────────────────────────────────────────────────────────
    console.log("\nLinear models:")
    await copyTable("LinearTeam")
    await copyTable("LinearCycle")

    // ── Client ────────────────────────────────────────────────────────────────
    console.log("\nClient models:")
    await copyTable(
        "Client",
        `"id", "name", "workspaceId", "createdAt", "updatedAt",
         "email", "website", "archivedAt",
         "portalModuleLabelIds", "uatLabelIds", "uatProjectIds"`,
    )
    // Many-to-many join table
    await copyTable(`_ClientLinearTeams` as any)

    await copyTable("WorkspaceAcceptanceTemplate")
    await copyTable("ClientTeamSettings")

    // ── Portal ────────────────────────────────────────────────────────────────
    console.log("\nPortal models:")
    await copyTable("PortalProfile")
    await copyTable("PortalInvite")
    await copyTable("PortalAnnouncement")
    await copyTable("PortalIssueLog")
    await copyTable("UatStateMapping")
    await copyTable("PortalEvent")

    console.log("\n✅ Migration complete!")
    await oldDb.end()
    await newDb.end()
}

main().catch(err => {
    console.error("❌ Migration failed:", err)
    process.exit(1)
})

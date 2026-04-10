/**
 * DB Backup Script — exports all tables to JSON
 * Usage: npx tsx scripts/backup-db.ts
 * Output: backups/backup-YYYY-MM-DD-HHmmss.json
 */
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "@prisma/client"
import ws from "ws"
import { neonConfig } from "@neondatabase/serverless"
import * as fs from "fs"
import * as path from "path"

// Force IPv4 (same fix as prisma.ts)
class ForceV4WebSocket extends ws {
    constructor(a: string, p: string | string[] | undefined, o: object) {
        super(a, p, { ...(o as object), family: 4 })
    }
}
neonConfig.webSocketConstructor = ForceV4WebSocket as unknown as typeof ws

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter } as never)

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const outDir = path.join(process.cwd(), "backups")
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)

    console.log("📦 Starting database backup...")

    const [
        workspaces,
        users,
        clients,
        projects,
        tasks,
        timeEntries,
        workspaceMembers,
        allocations,
        invoices,
        expenses,
    ] = await Promise.all([
        prisma.workspace.findMany(),
        prisma.user.findMany({ select: { id: true, name: true, email: true, createdAt: true } }),
        prisma.client.findMany(),
        prisma.teifiProject.findMany(),
        prisma.teifiTask.findMany(),
        prisma.timeEntry.findMany(),
        prisma.workspaceMember.findMany(),
        prisma.allocation.findMany(),
        prisma.invoice.findMany(),
        prisma.expense.findMany(),
    ])

    const backup = {
        meta: { createdAt: new Date().toISOString(), version: "1.0" },
        workspaces,
        users,
        clients,
        projects,
        tasks,
        timeEntries,
        workspaceMembers,
        allocations,
        invoices,
        expenses,
    }

    const outFile = path.join(outDir, `backup-${timestamp}.json`)
    fs.writeFileSync(outFile, JSON.stringify(backup, null, 2))

    const sizeMb = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2)
    console.log(`✅ Backup complete: ${outFile} (${sizeMb} MB)`)
    console.log(`   workspaces: ${workspaces.length}`)
    console.log(`   users: ${users.length}`)
    console.log(`   projects: ${projects.length}`)
    console.log(`   tasks: ${tasks.length}`)
    console.log(`   timeEntries: ${timeEntries.length}`)

    await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })

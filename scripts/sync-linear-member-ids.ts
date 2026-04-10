/**
 * sync-linear-member-ids.ts
 *
 * Fetches all Linear users via LINEAR_SERVICE_ACCOUNT_API_KEY,
 * matches them to workspace members by email, and upserts a
 * LinearUserToken record (accessToken = "service-account") so that
 * the Linear Allocation report can do a fast DB lookup instead of
 * a live API call on every page load.
 *
 * Run: npx dotenv-cli -e .env -- npx tsx scripts/sync-linear-member-ids.ts
 */

import { createClient } from '../src/lib/linear-genql'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'
import { neonConfig } from '@neondatabase/serverless'

class ForceV4WebSocket extends ws {
    constructor(a: string, p: string | string[] | undefined, o: object) {
        super(a, p, { ...(o as object), family: 4 })
    }
}
neonConfig.webSocketConstructor = ForceV4WebSocket as unknown as typeof ws

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as never)

const SERVICE_ACCOUNT_MARKER = 'service-account'

async function main() {
    const apiKey = process.env.LINEAR_SERVICE_ACCOUNT_API_KEY
    if (!apiKey) {
        console.error('ERROR: LINEAR_SERVICE_ACCOUNT_API_KEY is not set')
        process.exit(1)
    }

    const genql = createClient({ headers: { Authorization: apiKey } })

    // 1. Fetch all Linear users (paginate up to 500)
    console.log('Fetching Linear users...')
    const emailToLinearId = new Map<string, string>()
    let cursor: string | undefined

    do {
        const data = await genql.query({
            users: {
                __args: {
                    first: 250,
                    ...(cursor ? { after: cursor } : {}),
                },
                nodes: { id: true, email: true, name: true },
                pageInfo: { hasNextPage: true, endCursor: true },
            },
        })
        const nodes = data.users?.nodes ?? []
        for (const u of nodes) {
            if (u.id && u.email) emailToLinearId.set(u.email.toLowerCase(), u.id)
        }
        cursor = data.users?.pageInfo?.hasNextPage ? (data.users.pageInfo.endCursor ?? undefined) : undefined
        console.log(`  fetched ${nodes.length} users (total so far: ${emailToLinearId.size})`)
    } while (cursor)

    console.log(`Total Linear users found: ${emailToLinearId.size}`)

    // 2. Fetch all workspace members
    const members = await prisma.workspaceMember.findMany({
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
    })

    console.log(`\nWorkspace members: ${members.length}`)
    console.log('─'.repeat(60))

    let matched = 0
    let noMatch = 0

    for (const m of members) {
        const email = m.user.email.toLowerCase()

        // Skip placeholder accounts imported from Harvest — they have no real email
        if (email.endsWith('@harvest-import.local')) {
            continue
        }

        const linearUserId = emailToLinearId.get(email)

        if (!linearUserId) {
            console.log(`  NO MATCH  ${m.user.name ?? m.user.email} <${m.user.email}>`)
            noMatch++
            continue
        }

        // Upsert LinearUserToken with service-account marker
        await prisma.linearUserToken.upsert({
            where: {
                userId_linearUserId: {
                    userId: m.user.id,
                    linearUserId,
                },
            },
            update: {
                email: m.user.email,
                // Don't overwrite a real OAuth token — only update if it's already a service-account marker
            },
            create: {
                userId: m.user.id,
                accessToken: SERVICE_ACCOUNT_MARKER,
                linearUserId,
                email: m.user.email,
            },
        })

        console.log(`  MATCHED   ${m.user.name ?? m.user.email} <${m.user.email}> → ${linearUserId}`)
        matched++
    }

    console.log('─'.repeat(60))
    console.log(`\nSummary: ${matched} matched, ${noMatch} no Linear account`)
    console.log('Done. LinearUserToken records upserted for all matched members.')
}

main()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())

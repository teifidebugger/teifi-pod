import { PrismaClient } from '@prisma/client'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

// Required for Node.js — provides WebSocket support for Neon's serverless driver
neonConfig.webSocketConstructor = ws

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL is not set')

    const adapter = new PrismaNeon({ connectionString })
    const client = new PrismaClient({ adapter, log: ['warn', 'error'] })

    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ operation, model, args, query }) {
                    const shouldLog = process.env.NODE_ENV !== 'production' || process.env.PRISMA_SLOW_QUERY_LOG === '1'
                    if (!shouldLog) return query(args)
                    const start = performance.now()
                    const result = await query(args)
                    const duration = performance.now() - start
                    if (duration > 500) {
                        console.warn(`[Prisma SLOW] ${model}.${operation} — ${Math.round(duration)}ms`)
                    }
                    return result
                }
            }
        }
    })
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

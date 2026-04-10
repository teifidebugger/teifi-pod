/**
 * AES-256-GCM token encryption helpers for Linear OAuth tokens.
 *
 * Standalone module — no Prisma, no Next.js, no Linear SDK.
 * Imported by LinearClientManager and lib/linear (re-exported for backward compat).
 */
import crypto from 'crypto'

// Current key: HKDF-derived from BETTER_AUTH_SECRET (secure)
const ENCRYPTION_KEY = Buffer.from(crypto.hkdfSync(
    'sha256',
    Buffer.from(process.env.BETTER_AUTH_SECRET ?? ''),
    Buffer.alloc(0),
    Buffer.from('linear-token-encryption'),
    32
))

// Legacy key: used before HKDF migration — needed to decrypt existing DB tokens
const LEGACY_ENCRYPTION_KEY = Buffer.from(
    (process.env.BETTER_AUTH_SECRET ?? '').padEnd(32, '0').slice(0, 32)
)

export function encryptToken(plaintext: string): string {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    return `${iv.toString('hex')}.${encrypted.toString('hex')}.${authTag.toString('hex')}`
}

export function decryptToken(ciphertext: string): string {
    const [ivHex, encHex, tagHex] = ciphertext.split('.')
    const iv = Buffer.from(ivHex, 'hex')
    const enc = Buffer.from(encHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')

    // Try current HKDF key first
    try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv, { authTagLength: 16 })
        decipher.setAuthTag(tag)
        return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
    } catch {
        // Fall back to legacy key for tokens encrypted before HKDF migration
        const decipher = crypto.createDecipheriv('aes-256-gcm', LEGACY_ENCRYPTION_KEY, iv, { authTagLength: 16 })
        decipher.setAuthTag(tag)
        return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
    }
}

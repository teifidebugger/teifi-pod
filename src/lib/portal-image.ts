/**
 * Rewrites Linear private image URLs to go through our server-side proxy.
 * This allows portal users (who have no Linear API token) to view images.
 * The raw URL is preserved in stored markdown for Linear compatibility.
 */

const LINEAR_IMAGE_HOSTS = ["uploads.linear.app", "assets.linear.app", "media.linear.app"]

export function proxyLinearImageUrl(url: string | null | undefined): string {
    if (!url) return ""
    try {
        const parsed = new URL(url)
        if (parsed.protocol === "https:" && LINEAR_IMAGE_HOSTS.some(h => parsed.hostname === h)) {
            return `/api/portal/image?url=${encodeURIComponent(url)}`
        }
    } catch {
        // not a valid URL — return as-is
    }
    return url
}

export function isLinearImageUrl(url: string | null | undefined): boolean {
    if (!url) return false
    try {
        const parsed = new URL(url)
        return parsed.protocol === "https:" && LINEAR_IMAGE_HOSTS.some(h => parsed.hostname === h)
    } catch {
        return false
    }
}

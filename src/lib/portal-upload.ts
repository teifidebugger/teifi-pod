/** Upload a file to Linear via the portal upload API endpoint. */
export async function uploadFileToLinear(file: File): Promise<{ url: string; filename: string }> {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/portal/upload", { method: "POST", body: fd })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Upload failed")
    }
    const data = await res.json()
    if (!data.url) throw new Error("No URL returned")
    return { url: data.url, filename: data.filename ?? file.name }
}

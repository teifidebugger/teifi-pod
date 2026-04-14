"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Link2Off, Loader2, Upload, Eye } from "lucide-react"
import { saveForecastToken, deleteForecastToken, previewForecastImport, runForecastImport } from "@/app/actions/forecast"
import type { ForecastPreview, ForecastImportResult } from "@/app/actions/forecast"
import { toast } from "sonner"

interface Props {
    connected: boolean
    accountName: string | null
}

export function ForecastImport({ connected: initialConnected, accountName: initialAccountName }: Props) {
    const [connected, setConnected] = useState(initialConnected)
    const [accountName, setAccountName] = useState(initialAccountName)

    const [token, setToken] = useState("")
    const [accountId, setAccountId] = useState("")

    const [preview, setPreview] = useState<ForecastPreview | null>(null)
    const [importResult, setImportResult] = useState<ForecastImportResult | null>(null)

    const [isConnecting, startConnect] = useTransition()
    const [isDisconnecting, startDisconnect] = useTransition()
    const [isPreviewing, startPreview] = useTransition()
    const [isImporting, startImport] = useTransition()

    function handleConnect(e: React.FormEvent) {
        e.preventDefault()
        startConnect(async () => {
            try {
                const info = await saveForecastToken(token, accountId)
                setConnected(true)
                setAccountName(info.accountName ?? null)
                setToken("")
                setAccountId("")
                toast.success(`Connected to ${info.accountName ?? "Forecast"}`)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to connect")
            }
        })
    }

    function handleDisconnect() {
        startDisconnect(async () => {
            try {
                await deleteForecastToken()
                setConnected(false)
                setAccountName(null)
                setPreview(null)
                setImportResult(null)
                toast.success("Forecast disconnected")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to disconnect")
            }
        })
    }

    function handlePreview() {
        startPreview(async () => {
            try {
                const p = await previewForecastImport()
                setPreview(p)
                setImportResult(null)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to preview")
            }
        })
    }

    function handleImport() {
        startImport(async () => {
            try {
                const r = await runForecastImport()
                setImportResult(r)
                setPreview(null)
                toast.success("Forecast import complete")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Import failed")
            }
        })
    }

    if (!connected) {
        return (
            <form onSubmit={handleConnect} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="forecast-token">Personal Access Token</Label>
                        <Input
                            id="forecast-token"
                            type="password"
                            placeholder="Paste your Forecast token"
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="forecast-account">Account ID</Label>
                        <Input
                            id="forecast-account"
                            placeholder="e.g. 123456"
                            value={accountId}
                            onChange={e => setAccountId(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Find your token and Account ID at{" "}
                    <span className="font-mono text-foreground">forecastapp.com → Settings → Developers</span>.
                </p>
                <Button type="submit" size="sm" disabled={isConnecting}>
                    {isConnecting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                    {isConnecting ? "Connecting..." : "Connect Forecast"}
                </Button>
            </form>
        )
    }

    return (
        <div className="space-y-4 pt-2">
            {/* Connected state */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Connected to <span className="font-medium text-foreground">{accountName ?? "Forecast"}</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-destructive h-7"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                >
                    <Link2Off className="h-3.5 w-3.5" />
                    Disconnect
                </Button>
            </div>

            {/* Preview */}
            {preview && (
                <div className="rounded-md border border-border/50 bg-muted/30 p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <PreviewStat label="Clients" total={preview.clients.total} newCount={preview.clients.new} />
                        <PreviewStat label="Projects" total={preview.projects.total} newCount={preview.projects.new} />
                        <div>
                            <p className="text-xs text-muted-foreground">People</p>
                            <p className="font-semibold">{preview.people.total}</p>
                            <p className="text-xs text-muted-foreground">
                                {preview.people.matched} matched · {preview.people.unmatched} stub
                            </p>
                        </div>
                        <PreviewStat label="Placeholders" total={preview.placeholders.total} newCount={preview.placeholders.new} />
                        <PreviewStat label="Assignments" total={preview.assignments.total} />
                    </div>
                    {preview.people.unmatched > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            {preview.people.unmatched} Forecast person{preview.people.unmatched !== 1 ? "s" : ""} will be created as stub accounts (no login access until invited).
                        </p>
                    )}
                    {(preview.clients.new > 0 || preview.projects.new > 0) && (
                        <p className="text-xs text-muted-foreground">
                            Records already imported from Harvest will be cross-linked automatically.
                        </p>
                    )}
                </div>
            )}

            {/* Import result */}
            {importResult && (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Import complete
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 text-xs text-muted-foreground pt-1">
                        <span>{importResult.clients} clients</span>
                        <span>{importResult.projects} projects</span>
                        <span>{importResult.people} people</span>
                        <span>{importResult.placeholders} placeholders</span>
                        <span>{importResult.assignments} assignments</span>
                        {importResult.stubUsersCreated > 0 && (
                            <span>{importResult.stubUsersCreated} stub users</span>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePreview} disabled={isPreviewing || isImporting}>
                    {isPreviewing
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Previewing...</>
                        : <><Eye className="h-3.5 w-3.5 mr-1.5" />Preview</>
                    }
                </Button>
                <Button size="sm" onClick={handleImport} disabled={isImporting || isPreviewing}>
                    {isImporting
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Importing...</>
                        : <><Upload className="h-3.5 w-3.5 mr-1.5" />Run Import</>
                    }
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Import is idempotent — re-running will not create duplicates. Records already imported from Harvest will be cross-linked automatically.
            </p>
        </div>
    )
}

function PreviewStat({ label, total, newCount }: { label: string; total: number; newCount?: number }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-semibold">{total}</p>
            {newCount !== undefined && (
                <Badge variant="outline" className="text-xs h-4 px-1 border-amber-400 text-amber-600">
                    +{newCount} new
                </Badge>
            )}
        </div>
    )
}

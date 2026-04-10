"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { createApiToken, revokeApiToken } from "@/app/actions/tokens"
import { Trash2, Copy, Check, Plus, Key } from "lucide-react"
import { toast } from "sonner"

interface Token {
    id: string
    name: string
    createdAt: string
    lastUsedAt: string
    expiresAt: string | null
    isExpired: boolean
}

export function TokensClient({ tokens }: { tokens: Token[] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [expiresInDays, setExpiresInDays] = useState<string>("")
    const [pending, startTransition] = useTransition()
    const [newToken, setNewToken] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [revokeId, setRevokeId] = useState<string | null>(null)

    function handleCreate(e: React.SyntheticEvent) {
        e.preventDefault()
        startTransition(async () => {
            try {
                const days = expiresInDays ? parseInt(expiresInDays) : undefined
                const res = await createApiToken(name, days)
                setNewToken(res.rawToken)
                toast.success("Token generated successfully")
                setName("")
                setExpiresInDays("")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to create token")
            }
        })
    }

    function handleRevoke(id: string) {
        setRevokeId(id)
    }

    function confirmRevoke() {
        if (!revokeId) return
        const id = revokeId
        setRevokeId(null)
        startTransition(async () => {
            try {
                await revokeApiToken(id)
                toast.success("Token revoked")
                router.refresh()
            } catch {
                toast.error("Failed to revoke token")
            }
        })
    }

    function handleCopy() {
        if (newToken) {
            navigator.clipboard.writeText(newToken)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    function handleDone() {
        setOpen(false)
        setNewToken(null)
        router.refresh()
    }

    return (
        <>
            <TokensTable tokens={tokens} onRevoke={handleRevoke} onOpen={() => setOpen(true)} pending={pending} />

            {/* Create token dialog */}
            <Dialog open={open && !newToken} onOpenChange={(val) => { if (!val) setOpen(false) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Generate new token</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">What is this token for?</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Chrome Extension, Raycast script..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expires">Expiry (optional)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="expires"
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={expiresInDays}
                                    onChange={e => setExpiresInDays(e.target.value)}
                                    placeholder="Never"
                                    className="w-28"
                                />
                                <span className="text-sm text-muted-foreground">days (leave blank for no expiry)</span>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!name || pending}>
                                Generate Token
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Token reveal dialog */}
            <Dialog open={!!newToken} onOpenChange={(val) => { if (!val) handleDone() }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Token Created!</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-yellow-600 dark:text-yellow-500 font-medium">
                            Please copy this token now. You will not be able to see it again!
                        </p>
                        <div className="flex items-center space-x-2">
                            <Input value={newToken ?? ""} readOnly className="font-mono text-sm" />
                            <Button size="icon" variant="outline" onClick={handleCopy}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleDone}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke confirm */}
            <AlertDialog open={!!revokeId} onOpenChange={(val) => { if (!val) setRevokeId(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke this token?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Any integrations using this token will immediately stop working. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmRevoke}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Revoke
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function TokensTable({
    tokens,
    onRevoke,
    onOpen,
    pending,
}: {
    tokens: Token[]
    onRevoke: (id: string) => void
    onOpen: () => void
    pending: boolean
}) {
    return (
        <div className="space-y-4">
            <div className="flex justify-end border-b pb-4">
                <Button onClick={onOpen} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Generate new token
                </Button>
            </div>
            {tokens.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg bg-sidebar/30 border-dashed">
                    <Key className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>You have no active API tokens.</p>
                </div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Last used</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead className="w-[60px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tokens.map((token) => (
                                <TableRow key={token.id} className={token.isExpired ? "opacity-50" : undefined}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {token.name}
                                            {token.isExpired && (
                                                <Badge variant="destructive" className="text-xs">Expired</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{token.createdAt}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{token.lastUsedAt}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {token.expiresAt ?? <span className="text-xs">Never</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive h-8 w-8"
                                            onClick={() => onRevoke(token.id)}
                                            disabled={pending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

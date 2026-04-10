"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, AlertCircle } from "lucide-react"
import { signIn } from "@/lib/auth-client"

export function PortalInviteSignInButton({ token, email }: { token: string; email: string }) {
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const callbackURL = `/invite/portal/${token}/accept`

    async function handlePassword(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const result = await signIn.email({ email, password, callbackURL })
            if (result?.error) {
                setError(result.error.message ?? "Invalid password.")
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Invalid password.")
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogle() {
        setError(null)
        setGoogleLoading(true)
        await signIn.social({ provider: "google", callbackURL })
        setGoogleLoading(false)
    }

    return (
        <div className="space-y-3">
            {/* Password sign-in */}
            <form onSubmit={handlePassword} className="space-y-2">
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading || googleLoading}
                />
                {error && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive" />
                        <p className="text-xs text-destructive">{error}</p>
                    </div>
                )}
                <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                    {loading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Signing in…</> : "Sign in with Password"}
                </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Google sign-in */}
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={loading || googleLoading}
            >
                {googleLoading ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                    <svg className="h-4 w-4 mr-2 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                )}
                Continue with Google
            </Button>
        </div>
    )
}

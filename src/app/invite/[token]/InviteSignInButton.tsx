"use client"

import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function InviteSignInButton({ token }: { token: string }) {
    const [loading, setLoading] = useState(false)

    async function handleClick() {
        setLoading(true)
        await signIn.social({
            provider: "google",
            callbackURL: `/invite/${token}/accept`,
        })
        setLoading(false)
    }

    return (
        <Button className="w-full" onClick={handleClick} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Signing in..." : "Accept & Sign in with Google"}
        </Button>
    )
}

"use client"

import { Check, X } from "lucide-react"
import { PASSWORD_RULES } from "./password-validation-shared"

export { PASSWORD_RULES } from "./password-validation-shared"
export { validatePassword } from "./password-validation-shared"

export function PasswordRequirements({ password, confirmPassword }: { password: string; confirmPassword?: string }) {
    if (!password) return null

    return (
        <ul className="space-y-0.5 pt-1">
            {PASSWORD_RULES.map(rule => {
                const pass = rule.test(password)
                return (
                    <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${pass ? "text-emerald-500" : "text-muted-foreground"}`}>
                        {pass ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
                        {rule.label}
                    </li>
                )
            })}
            {confirmPassword !== undefined && password.length > 0 && (
                <li className={`flex items-center gap-1.5 text-xs ${confirmPassword === password ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {confirmPassword === password ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
                    Passwords must match
                </li>
            )}
        </ul>
    )
}

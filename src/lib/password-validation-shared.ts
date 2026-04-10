export const PASSWORD_RULES = [
    { label: "Minimum 12 characters", test: (pw: string) => pw.length >= 12 },
    { label: "At least 1 uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
    { label: "At least 1 lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
    { label: "At least 1 number", test: (pw: string) => /[0-9]/.test(pw) },
    { label: "At least 1 special character (!?@&<>,_)", test: (pw: string) => /[!?@&<>,_]/.test(pw) },
]

export function validatePassword(pw: string): { valid: boolean; errors: string[] } {
    const errors = PASSWORD_RULES.filter(r => !r.test(pw)).map(r => r.label)
    return { valid: errors.length === 0, errors }
}

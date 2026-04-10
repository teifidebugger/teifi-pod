"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Send, Save } from "lucide-react"
import { updateEmailSettings, sendTestEmail } from "@/app/actions/email"

interface Props {
    initial: {
        smtpHost: string
        smtpPort: number
        smtpUser: string
        hasSmtpPass: boolean
        emailFrom: string
    }
}

export function EmailSettingsForm({ initial }: Props) {
    const [smtpHost, setSmtpHost] = useState(initial.smtpHost)
    const [smtpPort, setSmtpPort] = useState(initial.smtpPort)
    const [smtpUser, setSmtpUser] = useState(initial.smtpUser)
    const [smtpPass, setSmtpPass] = useState("")
    const [passChanged, setPassChanged] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [emailFrom, setEmailFrom] = useState(initial.emailFrom)
    const [isSaving, startSave] = useTransition()
    const [isTesting, startTest] = useTransition()

    function handleSave() {
        startSave(async () => {
            try {
                await updateEmailSettings({
                    smtpHost,
                    smtpPort,
                    smtpUser,
                    smtpPass: passChanged ? smtpPass : undefined,
                    emailFrom,
                })
                toast.success("Email settings saved")
                if (passChanged) setPassChanged(false)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to save")
            }
        })
    }

    function handleTest() {
        startTest(async () => {
            try {
                await sendTestEmail()
                toast.success("Test email sent! Check your inbox.")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to send test email")
            }
        })
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>SMTP Configuration</CardTitle>
                    <CardDescription>
                        Connect an SMTP provider to send transactional emails (invites, reminders, approvals).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="smtp-host">SMTP Host</Label>
                            <Input
                                id="smtp-host"
                                value={smtpHost}
                                onChange={(e) => setSmtpHost(e.target.value)}
                                placeholder="in-v3.mailjet.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtp-port">SMTP Port</Label>
                            <Input
                                id="smtp-port"
                                type="number"
                                value={smtpPort}
                                onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                            />
                            <p className="text-xs text-muted-foreground">Use 465 for SSL, 587 for TLS</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="smtp-user">Username / API Key</Label>
                        <Input
                            id="smtp-user"
                            value={smtpUser}
                            onChange={(e) => setSmtpUser(e.target.value)}
                            placeholder="api-key or username"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="smtp-pass">Password / Secret Key</Label>
                        <div className="relative">
                            <Input
                                id="smtp-pass"
                                type={showPass ? "text" : "password"}
                                value={smtpPass}
                                onChange={(e) => {
                                    setSmtpPass(e.target.value)
                                    setPassChanged(true)
                                }}
                                placeholder={initial.hasSmtpPass && !passChanged ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022 (saved)" : "secret key or password"}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPass(!showPass)}
                            >
                                {showPass ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email-from">From Address</Label>
                        <Input
                            id="email-from"
                            value={emailFrom}
                            onChange={(e) => setEmailFrom(e.target.value)}
                            placeholder="Teifi Portal <noreply@yourdomain.com>"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save
                        </Button>
                        <Button variant="outline" onClick={handleTest} disabled={isTesting}>
                            {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                            Send Test Email
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm font-medium mb-2">Works with any SMTP provider:</p>
                    <div className="text-xs text-muted-foreground font-mono space-y-1">
                        <p>Mailjet: in-v3.mailjet.com / port 587 / API key + secret</p>
                        <p>SendGrid: smtp.sendgrid.net / port 587 / &quot;apikey&quot; + API key</p>
                        <p>Postmark: smtp.postmarkapp.com / port 587 / server token</p>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}

import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/app/actions"
import { redirect } from "next/navigation"
import { EmailSettingsForm } from "./EmailSettingsForm"
import { EmailTemplatesGrid } from "./EmailTemplatesGrid"

export default async function EmailSettingsPage() {
    const user = await getSessionUser().catch(() => null)
    if (!user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")
    if (!["OWNER", "ADMIN"].includes(member.role)) redirect("/settings")

    const workspace = await prisma.workspace.findUnique({
        where: { id: member.workspaceId },
        select: { smtpHost: true, smtpPort: true, smtpUser: true, smtpPass: true, emailFrom: true },
    })

    return (
        <div className="w-[calc(100%-120px)] mx-auto max-w-[80ch] space-y-6 py-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">Email Settings</h1>
                <p className="text-muted-foreground mt-1">Configure SMTP and preview email templates.</p>
            </div>
            <EmailSettingsForm
                initial={{
                    smtpHost: workspace?.smtpHost ?? "",
                    smtpPort: workspace?.smtpPort ?? 587,
                    smtpUser: workspace?.smtpUser ?? "",
                    hasSmtpPass: !!workspace?.smtpPass,
                    emailFrom: workspace?.emailFrom ?? "",
                }}
            />
            <EmailTemplatesGrid />
        </div>
    )
}

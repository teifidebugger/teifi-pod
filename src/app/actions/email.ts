"use server"

import { prisma } from "@/lib/prisma"
import { getSessionMember } from "@/app/actions"
import { revalidatePath } from "next/cache"

export async function getWorkspaceEmailSettings() {
    const { member } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Admin access required")

    const ws = await prisma.workspace.findUnique({
        where: { id: member.workspaceId },
        select: { smtpHost: true, smtpPort: true, smtpUser: true, smtpPass: true, emailFrom: true },
    })

    return {
        smtpHost: ws?.smtpHost ?? "",
        smtpPort: ws?.smtpPort ?? 587,
        smtpUser: ws?.smtpUser ?? "",
        hasSmtpPass: !!ws?.smtpPass,
        emailFrom: ws?.emailFrom ?? "",
    }
}

export async function updateEmailSettings(data: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass?: string
    emailFrom: string
}) {
    const { member } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Admin access required")

    await prisma.workspace.update({
        where: { id: member.workspaceId },
        data: {
            smtpHost: data.smtpHost || null,
            smtpPort: data.smtpPort || null,
            smtpUser: data.smtpUser || null,
            ...(data.smtpPass ? { smtpPass: (await import("@/lib/linear")).encryptToken(data.smtpPass) } : {}),
            emailFrom: data.emailFrom || null,
        },
    })

    revalidatePath("/settings/email")
}

export async function sendTestEmail() {
    const { user, member } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Admin access required")

    if (!user.email) throw new Error("No email address on your account")

    const workspace = await prisma.workspace.findUnique({
        where: { id: member.workspaceId },
        select: { name: true },
    })

    const { sendWorkspaceEmail } = await import("@/lib/email")
    await sendWorkspaceEmail(member.workspaceId, {
        type: "time-reminder",
        recipientEmail: user.email,
        recipientName: user.name ?? user.email,
        workspaceName: workspace?.name ?? "Teifi",
        appUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    })
}

export async function getEmailPreviewHtml(type: string): Promise<string> {
    const { member } = await getSessionMember()
    if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Admin access required")
    const { render } = await import("@react-email/components")
    const appUrl = "https://teifi.app"

    switch (type) {
        case "workspace-invite": {
            const { default: Template } = await import("@/emails/workspace-invite")
            return await render(Template({ recipientEmail: "user@example.com", inviterName: "David T.", workspaceName: "Teifi Digital", inviteUrl: `${appUrl}/invite/abc123` }))
        }
        case "portal-invite": {
            const { default: Template } = await import("@/emails/portal-invite")
            return await render(Template({ recipientEmail: "client@example.com", clientName: "Acme Corp", workspaceName: "Teifi Digital", inviteUrl: `${appUrl}/invite/portal/abc123` }))
        }
        case "time-reminder": {
            const { default: Template } = await import("@/emails/time-reminder")
            return await render(Template({ recipientEmail: "user@example.com", recipientName: "Sarah K.", workspaceName: "Teifi Digital", appUrl }))
        }
        case "timesheet-approved": {
            const { default: Template } = await import("@/emails/timesheet-approved")
            return await render(Template({ recipientEmail: "user@example.com", recipientName: "Sarah K.", weekOf: "Mar 10 - Mar 16, 2026", approverName: "David T.", appUrl }))
        }
        case "timesheet-rejected": {
            const { default: Template } = await import("@/emails/timesheet-rejected")
            return await render(Template({ recipientEmail: "user@example.com", recipientName: "Sarah K.", weekOf: "Mar 10 - Mar 16, 2026", approverName: "David T.", reason: "Please add descriptions to all entries.", appUrl }))
        }
        case "budget-alert": {
            const { default: Template } = await import("@/emails/budget-alert")
            return await render(Template({ recipientEmail: "admin@example.com", recipientName: "David T.", projectName: "Website Redesign", projectUrl: `${appUrl}/projects/123`, percentUsed: 87, budgetType: "hours", used: "43.5 hrs", total: "50 hrs" }))
        }
        default:
            throw new Error(`Unknown template type: ${type}`)
    }
}

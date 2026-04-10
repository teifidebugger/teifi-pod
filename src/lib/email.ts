import nodemailer from "nodemailer"
import { render } from "@react-email/components"
import WorkspaceInviteEmail, { subject as workspaceInviteSubject, type WorkspaceInviteEmailProps } from "@/emails/workspace-invite"
import PortalInviteEmail, { subject as portalInviteSubject, type PortalInviteEmailProps } from "@/emails/portal-invite"
import TimeReminderEmail, { subject as timeReminderSubject, type TimeReminderEmailProps } from "@/emails/time-reminder"
import TimesheetApprovedEmail, { subject as timesheetApprovedSubject, type TimesheetApprovedEmailProps } from "@/emails/timesheet-approved"
import TimesheetRejectedEmail, { subject as timesheetRejectedSubject, type TimesheetRejectedEmailProps } from "@/emails/timesheet-rejected"
import BudgetAlertEmail, { subject as budgetAlertSubject, type BudgetAlertEmailProps } from "@/emails/budget-alert"
import { prisma } from "@/lib/prisma"
import { decryptToken } from "@/lib/linear"

export interface SmtpConfig {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
    from: string
}

export type EmailPayload =
    | ({ type: "workspace-invite" } & WorkspaceInviteEmailProps)
    | ({ type: "portal-invite" } & PortalInviteEmailProps)
    | ({ type: "time-reminder" } & TimeReminderEmailProps)
    | ({ type: "timesheet-approved" } & TimesheetApprovedEmailProps)
    | ({ type: "timesheet-rejected" } & TimesheetRejectedEmailProps)
    | ({ type: "budget-alert" } & BudgetAlertEmailProps)

export async function getWorkspaceSmtpConfig(workspaceId: string): Promise<SmtpConfig | null> {
    // First try DB config
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { smtpHost: true, smtpPort: true, smtpUser: true, smtpPass: true, emailFrom: true },
    })
    if (workspace?.smtpHost && workspace.smtpUser && workspace.smtpPass) {
        return {
            host: workspace.smtpHost,
            port: workspace.smtpPort ?? 587,
            secure: (workspace.smtpPort ?? 587) === 465,
            user: workspace.smtpUser,
            pass: decryptToken(workspace.smtpPass),
            from: workspace.emailFrom ?? "Teifi Portal <noreply@teifi.app>",
        }
    }
    // Fallback to env vars
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT ?? "587"),
            secure: process.env.SMTP_PORT === "465",
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
            from: process.env.EMAIL_FROM ?? "Teifi Portal <noreply@teifi.app>",
        }
    }
    return null
}

export async function sendEmail(payload: EmailPayload, config: SmtpConfig): Promise<void> {
    let html: string
    let subjectLine: string

    switch (payload.type) {
        case "workspace-invite":
            html = await render(WorkspaceInviteEmail(payload))
            subjectLine = workspaceInviteSubject(payload)
            break
        case "portal-invite":
            html = await render(PortalInviteEmail(payload))
            subjectLine = portalInviteSubject(payload)
            break
        case "time-reminder":
            html = await render(TimeReminderEmail(payload))
            subjectLine = timeReminderSubject(payload)
            break
        case "timesheet-approved":
            html = await render(TimesheetApprovedEmail(payload))
            subjectLine = timesheetApprovedSubject(payload)
            break
        case "timesheet-rejected":
            html = await render(TimesheetRejectedEmail(payload))
            subjectLine = timesheetRejectedSubject(payload)
            break
        case "budget-alert":
            html = await render(BudgetAlertEmail(payload))
            subjectLine = budgetAlertSubject(payload)
            break
    }

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    })
    await transporter.sendMail({
        from: config.from,
        to: payload.recipientEmail,
        subject: subjectLine,
        html,
    })
}

export async function sendWorkspaceEmail(workspaceId: string, payload: EmailPayload): Promise<void> {
    const config = await getWorkspaceSmtpConfig(workspaceId)
    if (!config) {
        console.warn("[email] No SMTP config found for workspace", workspaceId)
        return
    }
    await sendEmail(payload, config)
}

import { Text, Section } from "@react-email/components"
import { EmailLayout } from "./_components/EmailLayout"
import { EmailButton } from "./_components/EmailButton"

export interface TimesheetRejectedEmailProps {
    recipientEmail: string
    recipientName: string
    weekOf: string
    approverName: string
    reason?: string
    appUrl: string
}

export const subject = (p: TimesheetRejectedEmailProps) =>
    `Your timesheet for ${p.weekOf} needs attention`

export default function TimesheetRejectedEmail({ recipientName, weekOf, approverName, reason, appUrl }: TimesheetRejectedEmailProps) {
    return (
        <EmailLayout previewText={`Timesheet for ${weekOf} returned for revision`}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: "#18181b", margin: "0 0 8px" }}>
                Timesheet needs revision
            </Text>
            <Text style={{ fontSize: 14, color: "#52525b", lineHeight: 1.6 }}>
                Hi <strong>{recipientName}</strong>, <strong>{approverName}</strong> returned your timesheet for the week of <strong>{weekOf}</strong> for revision.
            </Text>
            {reason && (
                <Section style={{ backgroundColor: "#fef9c3", borderLeft: "3px solid #eab308", padding: "8px 12px", borderRadius: 4, marginTop: 12 }}>
                    <Text style={{ margin: 0, fontSize: 13, color: "#713f12" }}>{reason}</Text>
                </Section>
            )}
            <EmailButton href={`${appUrl}/time`}>Review &amp; Update</EmailButton>
        </EmailLayout>
    )
}

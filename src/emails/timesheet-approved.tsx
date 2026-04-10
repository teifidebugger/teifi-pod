import { Text } from "@react-email/components"
import { EmailLayout } from "./_components/EmailLayout"
import { EmailButton } from "./_components/EmailButton"

export interface TimesheetApprovedEmailProps {
    recipientEmail: string
    recipientName: string
    weekOf: string
    approverName: string
    appUrl: string
}

export const subject = (p: TimesheetApprovedEmailProps) =>
    `Your timesheet for ${p.weekOf} was approved`

export default function TimesheetApprovedEmail({ recipientName, weekOf, approverName, appUrl }: TimesheetApprovedEmailProps) {
    return (
        <EmailLayout previewText={`Timesheet for ${weekOf} approved`}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: "#18181b", margin: "0 0 8px" }}>
                Timesheet approved
            </Text>
            <Text style={{ fontSize: 14, color: "#52525b", lineHeight: 1.6 }}>
                Hi <strong>{recipientName}</strong>, <strong>{approverName}</strong> approved your timesheet for the week of <strong>{weekOf}</strong>.
            </Text>
            <EmailButton href={`${appUrl}/time`}>View Timesheet</EmailButton>
        </EmailLayout>
    )
}

import { Text } from "@react-email/components"
import { EmailLayout } from "./_components/EmailLayout"
import { EmailButton } from "./_components/EmailButton"

export interface TimeReminderEmailProps {
    recipientEmail: string
    recipientName: string
    workspaceName: string
    appUrl: string
}

export const subject = (_p: TimeReminderEmailProps) => "Don't forget to log your time today"

export default function TimeReminderEmail({ recipientName, workspaceName, appUrl }: TimeReminderEmailProps) {
    return (
        <EmailLayout previewText="You haven't logged any time today">
            <Text style={{ fontSize: 20, fontWeight: 700, color: "#18181b", margin: "0 0 8px" }}>
                Time log reminder
            </Text>
            <Text style={{ fontSize: 14, color: "#52525b", lineHeight: 1.6 }}>
                Hi <strong>{recipientName}</strong>, you haven&apos;t logged any time today in <strong>{workspaceName}</strong>. It only takes a minute!
            </Text>
            <EmailButton href={`${appUrl}/time`}>Log Time Now</EmailButton>
            <Text style={{ fontSize: 12, color: "#a1a1aa", marginTop: 24 }}>
                You&apos;re receiving this because your workspace has automated reminders enabled.
            </Text>
        </EmailLayout>
    )
}

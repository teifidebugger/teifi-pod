import { Text } from "@react-email/components"
import { EmailLayout } from "./_components/EmailLayout"
import { EmailButton } from "./_components/EmailButton"

export interface PortalInviteEmailProps {
    recipientEmail: string
    clientName: string
    workspaceName: string
    inviteUrl: string
}

export const subject = (p: PortalInviteEmailProps) =>
    `You've been invited to the ${p.clientName} client portal`

export default function PortalInviteEmail({ clientName, workspaceName, inviteUrl }: PortalInviteEmailProps) {
    return (
        <EmailLayout previewText={`Access the ${clientName} UAT portal`}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: "#18181b", margin: "0 0 8px" }}>
                Portal access invitation
            </Text>
            <Text style={{ fontSize: 14, color: "#52525b", lineHeight: 1.6, margin: "0 0 8px" }}>
                You&apos;ve been invited to access the <strong>{clientName}</strong> UAT portal managed by <strong>{workspaceName}</strong>.
            </Text>
            <EmailButton href={inviteUrl}>Accept Invitation</EmailButton>
            <Text style={{ fontSize: 12, color: "#a1a1aa", marginTop: 24 }}>
                You&apos;ll sign in with your Google account. This link expires in 7 days.
            </Text>
        </EmailLayout>
    )
}

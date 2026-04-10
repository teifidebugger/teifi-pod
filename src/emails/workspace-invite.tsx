import { Text } from "@react-email/components"
import { EmailLayout } from "./_components/EmailLayout"
import { EmailButton } from "./_components/EmailButton"

export interface WorkspaceInviteEmailProps {
    recipientEmail: string
    inviterName: string
    workspaceName: string
    inviteUrl: string
}

export const subject = (p: WorkspaceInviteEmailProps) =>
    `${p.inviterName} invited you to ${p.workspaceName}`

export default function WorkspaceInviteEmail({ inviterName, workspaceName, inviteUrl }: WorkspaceInviteEmailProps) {
    return (
        <EmailLayout previewText={`Join ${workspaceName} on Teifi Portal`}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: "#18181b", margin: "0 0 8px" }}>
                You&apos;ve been invited
            </Text>
            <Text style={{ fontSize: 14, color: "#52525b", lineHeight: 1.6, margin: "0 0 8px" }}>
                <strong>{inviterName}</strong> has invited you to join <strong>{workspaceName}</strong> on Teifi Portal.
            </Text>
            <EmailButton href={inviteUrl}>Accept Invitation</EmailButton>
            <Text style={{ fontSize: 12, color: "#a1a1aa", marginTop: 24 }}>
                This invite expires in 7 days. You&apos;ll sign in with your Google account.
            </Text>
        </EmailLayout>
    )
}

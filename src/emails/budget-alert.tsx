import { Text, Section } from "@react-email/components"
import { EmailLayout } from "./_components/EmailLayout"
import { EmailButton } from "./_components/EmailButton"

export interface BudgetAlertEmailProps {
    recipientEmail: string
    recipientName: string
    projectName: string
    projectUrl: string
    percentUsed: number
    budgetType: "hours" | "fees"
    used: string
    total: string
}

export const subject = (p: BudgetAlertEmailProps) =>
    `Project "${p.projectName}" is at ${p.percentUsed}% budget`

export default function BudgetAlertEmail({ recipientName, projectName, projectUrl, percentUsed, budgetType, used, total }: BudgetAlertEmailProps) {
    const isOver = percentUsed >= 100
    return (
        <EmailLayout previewText={`${projectName} is at ${percentUsed}% of its budget`}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: "#18181b", margin: "0 0 8px" }}>
                Budget alert
            </Text>
            <Text style={{ fontSize: 14, color: "#52525b", lineHeight: 1.6 }}>
                Hi <strong>{recipientName}</strong>, project <strong>{projectName}</strong> has used <strong>{percentUsed}%</strong> of its {budgetType === "hours" ? "hour" : "fee"} budget.
            </Text>
            <Section style={{ backgroundColor: isOver ? "#fef2f2" : "#fffbeb", border: `1px solid ${isOver ? "#fca5a5" : "#fde68a"}`, borderRadius: 6, padding: "12px 16px", marginTop: 12 }}>
                <Text style={{ margin: 0, fontSize: 14, color: isOver ? "#b91c1c" : "#92400e", fontWeight: 600 }}>
                    {used} of {total} used
                </Text>
                {isOver && (
                    <Text style={{ margin: "4px 0 0", fontSize: 13, color: "#b91c1c" }}>
                        This project is over budget.
                    </Text>
                )}
            </Section>
            <EmailButton href={projectUrl}>View Project</EmailButton>
        </EmailLayout>
    )
}

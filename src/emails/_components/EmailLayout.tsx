import { Html, Head, Preview, Body, Container, Section, Text } from "@react-email/components"

interface Props {
    children: React.ReactNode
    previewText?: string
}

export function EmailLayout({ children, previewText }: Props) {
    return (
        <Html lang="en">
            <Head />
            {previewText && <Preview>{previewText}</Preview>}
            <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", margin: 0 }}>
                <Container style={{ maxWidth: "560px", margin: "32px auto" }}>
                    {/* Logo */}
                    <Text style={{ fontSize: 20, fontWeight: 700, color: "#18181b", letterSpacing: "-0.5px", margin: "0 0 24px" }}>
                        Teifi Portal
                    </Text>
                    {/* Card */}
                    <Section style={{ backgroundColor: "#ffffff", borderRadius: 8, padding: "32px", border: "1px solid #e4e4e7" }}>
                        {children}
                    </Section>
                    {/* Footer */}
                    <Text style={{ color: "#a1a1aa", fontSize: 12, textAlign: "center" as const, margin: "16px 0" }}>
                        Teifi Portal
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

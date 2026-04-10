import { Button } from "@react-email/components"

interface Props {
    href: string
    children: React.ReactNode
}

export function EmailButton({ href, children }: Props) {
    return (
        <Button
            href={href}
            style={{
                backgroundColor: "#6366f1",
                color: "#fff",
                borderRadius: 6,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                display: "inline-block",
                textDecoration: "none",
                marginTop: 16,
            }}
        >
            {children}
        </Button>
    )
}

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { auth } from "@/lib/auth"
import { headers, cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { RootLayoutShell } from "@/components/root-layout-shell"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Teifi Pod Management",
    description: "Project, client, and time management for Teifi.",
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
    const user = session?.user ?? null

    const [memberRole, hiddenNavItems] = user
        ? await prisma.workspaceMember
              .findFirst({
                  where: { userId: user.id },
                  select: { role: true, workspace: { select: { hiddenNavItems: true } } },
              })
              .then((m) => [m?.role ?? null, m?.workspace.hiddenNavItems ?? []] as [string | null, string[]])
              .catch(() => [null, []] as [string | null, string[]])
        : [null, [] as string[]] as [string | null, string[]]

    const cookieStore = await cookies()
    const sidebarDefaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <TooltipProvider>
                        <RootLayoutShell user={user} memberRole={memberRole} hiddenNavItems={hiddenNavItems} sidebarDefaultOpen={sidebarDefaultOpen}>
                            {children}
                        </RootLayoutShell>
                    </TooltipProvider>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    )
}

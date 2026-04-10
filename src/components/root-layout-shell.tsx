"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

interface RootLayoutShellProps {
    children: React.ReactNode
    user: { id: string; name?: string | null; email?: string | null; image?: string | null } | null
    memberRole: string | null
    hiddenNavItems?: string[]
    sidebarDefaultOpen?: boolean
}

export function RootLayoutShell({ children, user, memberRole, hiddenNavItems = [], sidebarDefaultOpen = true }: RootLayoutShellProps) {
    const pathname = usePathname()
    const isPortalRoute = pathname.startsWith("/uat")
    const isEstimationRoom = /^\/estimation\/[^/]+$/.test(pathname)

    if (user && memberRole && !isPortalRoute) {
        return (
            <SidebarProvider defaultOpen={sidebarDefaultOpen}>
                <AppSidebar user={user} memberRole={memberRole} hiddenNavItems={hiddenNavItems} />
                <main className="flex flex-1 flex-col w-full h-screen overflow-hidden">
                    <div className="h-10 shrink-0 flex items-center justify-between px-2 border-b border-sidebar-border/40">
                        <SidebarTrigger />
                        <ThemeToggle />
                    </div>
                    <div className={isEstimationRoom ? "flex flex-1 flex-col overflow-hidden" : "flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8"}>
                        {children}
                    </div>
                </main>
            </SidebarProvider>
        )
    }

    return <div className="flex min-h-screen flex-col">{children}</div>
}

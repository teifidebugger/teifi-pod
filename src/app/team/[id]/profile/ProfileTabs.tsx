"use client"

import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { User, DollarSign, Shield, Briefcase } from "lucide-react"

const TABS = [
    { id: "basic", label: "Basic info", icon: User },
    { id: "rates", label: "Rates", icon: DollarSign },
    { id: "projects", label: "Assigned projects", icon: Briefcase },
    { id: "permissions", label: "Permissions", icon: Shield },
] as const

interface ProfileTabsProps {
    activeTab: string
    children: React.ReactNode
}

export function ProfileTabs({ activeTab, children }: ProfileTabsProps) {
    const router = useRouter()
    const pathname = usePathname()

    function navigate(tabId: string) {
        router.push(`${pathname}?tab=${tabId}`)
    }

    return (
        <div className="flex gap-0 flex-1 min-h-0">
            {/* Left nav */}
            <nav className="w-48 shrink-0 pr-6 space-y-0.5">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => navigate(id)}
                        className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left",
                            activeTab === id
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                    </button>
                ))}
            </nav>

            {/* Right content */}
            <div className="flex-1 min-w-0">
                {children}
            </div>
        </div>
    )
}

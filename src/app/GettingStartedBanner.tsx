"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Clock, Briefcase, Users, Plug, Shield, Building2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const DISMISS_KEY = "tt_gs_dismissed"

const steps = [
  { num: 1, label: "Connect Linear", icon: Plug, href: "/settings/integrations" },
  { num: 2, label: "Create a client", icon: Building2, href: "/clients" },
  { num: 3, label: "Create a project", icon: Briefcase, href: "/projects" },
  { num: 4, label: "Invite your team", icon: Users, href: "/team" },
  { num: 5, label: "Log time", icon: Clock, href: "/time" },
] as const

export function GettingStartedBanner() {
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) setVisible(true)
    } catch {
      // SSR / storage blocked — stay hidden
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="relative flex items-center gap-6 rounded-lg border border-sidebar-border bg-sidebar shadow-sm overflow-hidden px-5 py-4">
      {/* Gradient tint layer */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, #00FFF3 8%, transparent), color-mix(in srgb, #1492FF 8%, transparent))",
        }}
      />
      {/* Left accent bar */}
      <div
        className="absolute left-0 inset-y-0 w-[3px]"
        style={{ background: "linear-gradient(to bottom, #00FFF3, #1492FF)" }}
      />

      {/* Headline */}
      <div className="relative shrink-0 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">Get started with Teifi Portal</p>
        <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">Follow these steps to get up and running</p>
      </div>

      {/* Divider */}
      <div className="relative hidden sm:block h-8 w-px bg-border shrink-0" />

      {/* Step chips */}
      <div className="relative flex flex-wrap gap-2 flex-1 min-w-0">
        {steps.map(({ num, label, icon: Icon, href }) => (
          <button
            key={num}
            onClick={() => router.push(href)}
            className="group flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground/80 transition-colors hover:border-[#1492FF]/60 hover:bg-[#1492FF]/5 hover:text-foreground"
          >
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-bold text-muted-foreground group-hover:border-[#1492FF]/50 group-hover:text-[#1492FF] transition-colors">
              {num}
            </span>
            <Icon className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-[#1492FF] transition-colors" />
            <span>{label}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/50 group-hover:text-[#1492FF]/70 transition-colors" />
          </button>
        ))}
      </div>

      {/* Dismiss */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={dismiss}
        aria-label="Dismiss getting started guide"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

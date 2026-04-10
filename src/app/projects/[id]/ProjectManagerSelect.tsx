"use client"

import { useTransition } from "react"
import { assignProjectManager } from "@/app/actions/projects"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"
import { toast } from "sonner"

type MemberOption = {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
}

function initials(name: string | null, email: string) {
    if (name) return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()
    return email.slice(0, 2).toUpperCase()
}

export function ProjectManagerSelect({
    projectId,
    currentManagerId,
    members,
}: {
    projectId: string
    currentManagerId: string | null
    members: MemberOption[]
}) {
    const [isPending, startTransition] = useTransition()

    function handleChange(value: string) {
        const memberId = value === "__none__" ? null : value
        startTransition(async () => {
            try {
                await assignProjectManager(projectId, memberId)
                toast.success(memberId ? "Project manager assigned" : "Project manager removed")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to update manager")
            }
        })
    }

    const current = members.find(m => m.id === currentManagerId)

    return (
        <div className="flex items-center gap-3">
            {current && (
                <Avatar className="h-6 w-6">
                    <AvatarFallback className={`text-[10px] text-white ${avatarBg(current.name ?? current.email)}`}>
                        {initials(current.name, current.email)}
                    </AvatarFallback>
                </Avatar>
            )}
            <Select
                value={currentManagerId ?? "__none__"}
                onValueChange={handleChange}
                disabled={isPending}
            >
                <SelectTrigger className="h-8 text-sm w-52">
                    <SelectValue placeholder="Assign project manager…" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__none__">No project manager</SelectItem>
                    {members.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                            {m.name ?? m.email}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

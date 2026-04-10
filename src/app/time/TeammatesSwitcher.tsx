"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Users, Check, ChevronDown } from "lucide-react"

export interface TeamMember {
    memberId: string
    name: string
}

interface Props {
    members: TeamMember[]
    /** The memberId currently being viewed — null means "viewing yourself" */
    currentMemberId: string | null
}

export function TeammatesSwitcher({ members, currentMemberId }: Props) {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    function navigate(memberId: string | null) {
        const params = new URLSearchParams(searchParams.toString())
        if (memberId) {
            params.set("memberId", memberId)
        } else {
            params.delete("memberId")
        }
        router.push(`${pathname}?${params.toString()}`)
        setOpen(false)
    }

    const selected = currentMemberId
        ? members.find(m => m.memberId === currentMemberId)
        : null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                    <Users className="h-3.5 w-3.5" />
                    <span>{selected ? selected.name : "Teammates"}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end" sideOffset={4}>
                <Command>
                    <CommandInput placeholder="Search..." autoFocus />
                    <CommandList className="max-h-72">
                        <CommandEmpty>No members found.</CommandEmpty>
                        <CommandGroup heading="View timesheet">
                            <CommandItem
                                key="__self__"
                                value="My timesheet"
                                onSelect={() => navigate(null)}
                            >
                                <Check
                                    className={`mr-2 h-4 w-4 shrink-0 ${
                                        !currentMemberId ? "opacity-100" : "opacity-0"
                                    }`}
                                />
                                My timesheet
                            </CommandItem>
                        </CommandGroup>
                        <CommandGroup heading="Teammates">
                            {members.map(m => (
                                <CommandItem
                                    key={m.memberId}
                                    value={m.name}
                                    onSelect={() => navigate(m.memberId)}
                                >
                                    <Check
                                        className={`mr-2 h-4 w-4 shrink-0 ${
                                            currentMemberId === m.memberId ? "opacity-100" : "opacity-0"
                                        }`}
                                    />
                                    {m.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

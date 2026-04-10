"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { UserPlus } from "lucide-react"
import { GanttProject, Member, getAvatarColors } from "./GanttTypes"

export function GanttAssignPersonPopover({
    project,
    members,
    onNewAlloc,
}: {
    project: GanttProject
    members: Member[]
    onNewAlloc: (projectId: string, startDate?: string, endDate?: string, rowId?: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const lcSearch = search.toLowerCase()
    const filtered = lcSearch ? members.filter((m) => m.name.toLowerCase().includes(lcSearch)) : members

    return (
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch("") }}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground gap-1 px-2 ml-7">
                    <UserPlus className="h-3 w-3" />
                    Assign person...
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Search people..." value={search} onValueChange={setSearch} />
                    <CommandList className="max-h-64">
                        <CommandEmpty>No people found.</CommandEmpty>
                        <CommandGroup heading="Team Members">
                            {filtered.map((m) => (
                                <CommandItem
                                    key={m.id}
                                    onSelect={() => {
                                        setOpen(false)
                                        setSearch("")
                                        onNewAlloc(project.id, undefined, undefined, m.id)
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5 flex-shrink-0">
                                            <AvatarFallback className={`text-[8px] font-semibold ${getAvatarColors(m.name)}`}>
                                                {m.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{m.name}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

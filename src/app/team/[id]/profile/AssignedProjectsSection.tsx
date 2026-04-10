"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X, Search, Info } from "lucide-react"
import { toast } from "sonner"
import {
    assignProjectToMember,
    unassignProjectFromMember,
    setProjectManager,
    setProjectManagerBatch,
    removeFromAllProjects,
    setAutoAssignAllProjects,
} from "@/app/actions/team"

type AssignedProject = {
    projectId: string
    name: string
    code: string | null
    clientName: string | null
    status: string
    billableRateCents: number | null
    isProjectManager: boolean
}

type Project = {
    id: string
    name: string
    code: string | null
    clientName: string | null
    status: string
}

interface AssignedProjectsSectionProps {
    memberId: string
    isAdmin: boolean
    isSelf: boolean
    autoAssignAllProjects: boolean
    assignedProjects: AssignedProject[]
    allProjects?: Project[]
}

export function AssignedProjectsSection({
    memberId,
    isAdmin,
    isSelf,
    autoAssignAllProjects: initialAutoAssign,
    assignedProjects: initial,
    allProjects,
}: AssignedProjectsSectionProps) {
    const router = useRouter()
    const [assigned, setAssigned] = useState(initial)
    const [search, setSearch] = useState("")
    const [showDropdown, setShowDropdown] = useState(false)
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
    const [isPending, startTransition] = useTransition()
    const [autoAssign, setAutoAssign] = useState(initialAutoAssign)
    const searchRef = useRef<HTMLDivElement>(null)

    const canEdit = isAdmin

    const unassigned = (allProjects ?? []).filter(
        (p) => !assigned.some((a) => a.projectId === p.id)
    )

    const filtered = unassigned.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    const pendingProjects = (allProjects ?? []).filter((p) => pendingIds.has(p.id))

    // Close dropdown on outside click
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handle)
        return () => document.removeEventListener("mousedown", handle)
    }, [])

    function togglePending(project: Project) {
        setPendingIds((prev) => {
            const next = new Set(prev)
            if (next.has(project.id)) next.delete(project.id)
            else next.add(project.id)
            return next
        })
    }

    function handleAssignSelected() {
        if (pendingIds.size === 0) return
        const toAssign = (allProjects ?? []).filter((p) => pendingIds.has(p.id))
        setPendingIds(new Set())
        setSearch("")
        setShowDropdown(false)
        startTransition(async () => {
            try {
                await Promise.all(toAssign.map((p) => assignProjectToMember(memberId, p.id)))
                setAssigned((prev) => [
                    ...prev,
                    ...toAssign.map((p) => ({
                        projectId: p.id,
                        name: p.name,
                        code: p.code,
                        clientName: p.clientName,
                        status: p.status,
                        billableRateCents: null,
                        isProjectManager: false,
                    })),
                ])
                toast.success(
                    toAssign.length === 1
                        ? `Added to ${toAssign[0].name}`
                        : `Added to ${toAssign.length} projects`
                )
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to assign projects")
            }
        })
    }

    function handleRemove(projectId: string, name: string) {
        startTransition(async () => {
            try {
                await unassignProjectFromMember(memberId, projectId)
                setAssigned((prev) => prev.filter((a) => a.projectId !== projectId))
                toast.success(`Removed from ${name}`)
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to remove")
            }
        })
    }

    function handleToggleManager(projectId: string, current: boolean) {
        startTransition(async () => {
            try {
                await setProjectManager(memberId, projectId, !current)
                setAssigned((prev) =>
                    prev.map((a) =>
                        a.projectId === projectId ? { ...a, isProjectManager: !current } : a
                    )
                )
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to update")
            }
        })
    }

    function handleRemoveAll() {
        startTransition(async () => {
            try {
                await removeFromAllProjects(memberId)
                setAssigned([])
                toast.success("Removed from all projects")
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to remove from all projects")
            }
        })
    }

    function handleSelectAllManages() {
        const toUpdate = assigned.filter((a) => !a.isProjectManager).map((a) => a.projectId)
        if (toUpdate.length === 0) return
        startTransition(async () => {
            try {
                await setProjectManagerBatch(memberId, toUpdate, true)
                setAssigned((prev) => prev.map((a) => ({ ...a, isProjectManager: true })))
            } catch {
                toast.error("Failed to set project managers")
            }
        })
    }

    function handleSelectNoneManages() {
        const toUpdate = assigned.filter((a) => a.isProjectManager).map((a) => a.projectId)
        if (toUpdate.length === 0) return
        startTransition(async () => {
            try {
                await setProjectManagerBatch(memberId, toUpdate, false)
                setAssigned((prev) => prev.map((a) => ({ ...a, isProjectManager: false })))
            } catch {
                toast.error("Failed to remove project managers")
            }
        })
    }

    function handleToggleAutoAssign() {
        const next = !autoAssign
        startTransition(async () => {
            try {
                await setAutoAssignAllProjects(memberId, next)
                setAutoAssign(next)
                toast.success(
                    next
                        ? (isSelf ? "You are" : "Member is") + " now assigned to all projects"
                        : "Auto-assign disabled"
                )
                // Refresh server data so assigned list reflects retroactive assignments
                router.refresh()
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to update")
            }
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold">Assigned projects</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {canEdit
                        ? "Manage which projects this member is assigned to."
                        : "Projects assigned by a workspace admin."}
                </p>
            </div>

            {/* Auto-assign banner — shown when enabled */}
            {canEdit && autoAssign && (
                <div className="flex items-start gap-3 rounded-lg border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 px-4 py-2.5 text-sm">
                    <Info className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-foreground/80">
                        {isSelf ? "You are" : "This member is"} set to be assigned to all new projects.{" "}
                        <button
                            type="button"
                            className="underline font-medium hover:no-underline disabled:opacity-50"
                            onClick={handleToggleAutoAssign}
                            disabled={isPending}
                        >
                            Disable
                        </button>
                    </span>
                </div>
            )}

            {/* Search + assign */}
            {canEdit && (
                <div className="space-y-3">
                    <div ref={searchRef} className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                className="pl-9"
                                placeholder="Find and select projects to assign..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setShowDropdown(true)
                                }}
                                onFocus={() => setShowDropdown(true)}
                                disabled={isPending}
                            />
                        </div>

                        {/* Dropdown */}
                        {showDropdown && search.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
                                {filtered.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-muted-foreground">No projects found.</div>
                                ) : (
                                    filtered.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            className="w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                togglePending(p)
                                            }}
                                        >
                                            <Checkbox
                                                checked={pendingIds.has(p.id)}
                                                className="pointer-events-none"
                                            />
                                            <span className="flex items-center gap-1.5">
                                                {p.code && <span className="text-[10px] font-mono text-muted-foreground">{p.code}</span>}
                                                {p.name}
                                                {p.clientName && <span className="text-xs text-muted-foreground">· {p.clientName}</span>}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Selected pills + assign button */}
                    {pendingIds.size > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex flex-wrap gap-1.5 flex-1">
                                {pendingProjects.map((p) => (
                                    <span
                                        key={p.id}
                                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-0.5"
                                    >
                                        {p.name}
                                        <button
                                            type="button"
                                            onClick={() => togglePending(p)}
                                            className="hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <Button
                                size="sm"
                                onClick={handleAssignSelected}
                                disabled={isPending}
                            >
                                Assign {pendingIds.size === 1 ? "project" : `${pendingIds.size} projects`}
                            </Button>
                        </div>
                    )}

                    {/* Enable auto-assign link */}
                    {!autoAssign && (
                        <p className="text-xs text-muted-foreground">
                            Or{" "}
                            <button
                                type="button"
                                className="underline hover:no-underline disabled:opacity-50"
                                onClick={handleToggleAutoAssign}
                                disabled={isPending}
                            >
                                enable auto-assign to all new projects
                            </button>
                            .
                        </p>
                    )}
                </div>
            )}

            {/* Assigned table */}
            {assigned.length === 0 ? (
                <div className="rounded-lg border border-dashed border-sidebar-border py-10 text-center text-sm text-muted-foreground">
                    Not assigned to any projects yet.
                </div>
            ) : (
                <div className="rounded-md border border-sidebar-border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="w-8"></TableHead>
                                <TableHead>
                                    <div className="flex items-center justify-between">
                                        <span>Assigned projects</span>
                                        {canEdit && (
                                            <button
                                                type="button"
                                                className="text-xs text-destructive hover:underline font-normal"
                                                onClick={handleRemoveAll}
                                                disabled={isPending}
                                            >
                                                Remove from all projects
                                            </button>
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead className="w-48 text-right">
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-xs font-medium">Manages this project?</span>
                                        {canEdit && assigned.length > 0 && (
                                            <span className="text-xs text-muted-foreground font-normal">
                                                Select{" "}
                                                <button
                                                    type="button"
                                                    className="underline hover:no-underline disabled:opacity-50"
                                                    onClick={handleSelectAllManages}
                                                    disabled={isPending}
                                                >
                                                    All
                                                </button>
                                                {" / "}
                                                <button
                                                    type="button"
                                                    className="underline hover:no-underline disabled:opacity-50"
                                                    onClick={handleSelectNoneManages}
                                                    disabled={isPending}
                                                >
                                                    None
                                                </button>
                                            </span>
                                        )}
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...assigned].sort((a, b) => (a.clientName ?? "").localeCompare(b.clientName ?? "") || a.name.localeCompare(b.name)).map((a, idx) => (
                                <TableRow
                                    key={a.projectId}
                                    className={idx % 2 === 1 ? "bg-muted/20" : ""}
                                >
                                    <TableCell className="pr-0">
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(a.projectId, a.name)}
                                                disabled={isPending}
                                                className="flex items-center justify-center w-5 h-5 rounded border border-sidebar-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors disabled:opacity-40"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {a.code && <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{a.code}</span>}
                                            <a
                                                href={`/projects/${a.projectId}`}
                                                className="text-sm font-medium text-primary hover:underline"
                                            >
                                                {a.name}
                                            </a>
                                            {a.clientName && <span className="text-xs text-muted-foreground">· {a.clientName}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end">
                                            <Checkbox
                                                checked={a.isProjectManager}
                                                onCheckedChange={() => handleToggleManager(a.projectId, a.isProjectManager)}
                                                disabled={!canEdit || isPending}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

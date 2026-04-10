"use client"

import { useState, useTransition } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createWorkspaceRole, deleteWorkspaceRole } from "@/app/actions/roles"
import { toast } from "sonner"
import { Plus, Trash2, Tags } from "lucide-react"

type RoleWithUsage = {
    id: string
    name: string
    memberCount: number
    placeholderCount: number
}

export function RolesManager({ roles }: { roles: RoleWithUsage[] }) {
    const [newRoleName, setNewRoleName] = useState("")
    const [isCreating, startCreateTransition] = useTransition()
    const [deletingRole, setDeletingRole] = useState<RoleWithUsage | null>(null)
    const [isDeleting, startDeleteTransition] = useTransition()

    function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!newRoleName.trim()) {
            toast.error("Role name is required")
            return
        }
        startCreateTransition(async () => {
            try {
                await createWorkspaceRole(newRoleName.trim())
                toast.success(`Role "${newRoleName.trim()}" created`)
                setNewRoleName("")
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to create role")
            }
        })
    }

    function handleDelete() {
        if (!deletingRole) return
        startDeleteTransition(async () => {
            try {
                await deleteWorkspaceRole(deletingRole.id)
                toast.success(`Role "${deletingRole.name}" deleted`)
                setDeletingRole(null)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to delete role")
            }
        })
    }

    const totalAffected = deletingRole
        ? deletingRole.memberCount + deletingRole.placeholderCount
        : 0

    return (
        <>
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: Role catalog */}
                <Card className="border-sidebar-border">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Tags className="h-4 w-4" />
                            Role Catalog
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {roles.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                No roles defined yet. Add one to get started.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {roles.map((role) => (
                                    <div
                                        key={role.id}
                                        className="flex items-center justify-between py-2 px-3 rounded-md border border-sidebar-border/50 hover:bg-sidebar/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant="outline"
                                                className="border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                            >
                                                {role.name}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {role.memberCount} member{role.memberCount !== 1 ? "s" : ""}, {role.placeholderCount} placeholder{role.placeholderCount !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                            onClick={() => setDeletingRole(role)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Add role form */}
                <Card className="border-sidebar-border">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Role
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="role-name">Role Name</Label>
                                <Input
                                    id="role-name"
                                    placeholder='e.g. "Backend", "Designer", "QA"'
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground">
                                    Roles are shared across team members and placeholders for skill-based resourcing.
                                </p>
                            </div>
                            <Button type="submit" disabled={isCreating}>
                                <Plus className="h-4 w-4 mr-1" />
                                {isCreating ? "Adding..." : "Add Role"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Delete confirmation */}
            <AlertDialog open={!!deletingRole} onOpenChange={(open) => { if (!open) setDeletingRole(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete role?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove &ldquo;{deletingRole?.name}&rdquo; from all members and placeholders &mdash; {totalAffected} {totalAffected === 1 ? "person" : "people"} affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

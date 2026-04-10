"use server"

import { getSessionMember } from "@/app/actions"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const ADMIN_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const
const OWNER_ADMIN_ROLES = ["OWNER", "ADMIN"] as const

async function getCallerMember() {
    return getSessionMember()
}

// ─── Expense Category Actions ─────────────────────────────────────────────────

export async function createExpenseCategory(
    name: string,
    unitPriceCents?: number | null,
    unitName?: string | null,
): Promise<void> {
    const { member } = await getCallerMember()
    if (!OWNER_ADMIN_ROLES.includes(member.role as (typeof OWNER_ADMIN_ROLES)[number])) {
        throw new Error("Only Owners and Admins can manage expense categories")
    }
    if (!name?.trim()) throw new Error("Category name is required")
    if (unitPriceCents !== undefined && unitPriceCents !== null && unitPriceCents < 0) {
        throw new Error("Unit price cannot be negative")
    }

    await prisma.expenseCategory.create({
        data: {
            workspaceId: member.workspaceId,
            name: name.trim(),
            unitPriceCents: unitPriceCents ?? null,
            unitName: unitName?.trim() || null,
        },
    })

    revalidatePath("/expenses")
    revalidatePath("/expenses/categories")
}

export async function updateExpenseCategory(
    id: string,
    data: { name?: string; isActive?: boolean; unitPriceCents?: number | null; unitName?: string | null },
): Promise<void> {
    const { member } = await getCallerMember()
    if (!OWNER_ADMIN_ROLES.includes(member.role as (typeof OWNER_ADMIN_ROLES)[number])) {
        throw new Error("Only Owners and Admins can manage expense categories")
    }

    if (data.unitPriceCents !== undefined && data.unitPriceCents !== null && data.unitPriceCents < 0) {
        throw new Error("Unit price cannot be negative")
    }

    const category = await prisma.expenseCategory.findFirst({
        where: { id, workspaceId: member.workspaceId },
    })
    if (!category) throw new Error("Category not found")

    await prisma.expenseCategory.update({
        where: { id },
        data: {
            ...(data.name !== undefined ? { name: data.name.trim() } : {}),
            ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
            ...("unitPriceCents" in data ? { unitPriceCents: data.unitPriceCents ?? null } : {}),
            ...("unitName" in data ? { unitName: data.unitName?.trim() || null } : {}),
        },
    })

    revalidatePath("/expenses")
    revalidatePath("/expenses/categories")
}

export async function deleteExpenseCategory(id: string): Promise<void> {
    const { member } = await getCallerMember()
    if (!OWNER_ADMIN_ROLES.includes(member.role as (typeof OWNER_ADMIN_ROLES)[number])) {
        throw new Error("Only Owners and Admins can manage expense categories")
    }

    const category = await prisma.expenseCategory.findFirst({
        where: { id, workspaceId: member.workspaceId },
        include: { _count: { select: { expenses: true } } },
    })
    if (!category) throw new Error("Category not found")
    if (category._count.expenses > 0) {
        throw new Error("Cannot delete a category that has expenses. Deactivate it instead.")
    }

    await prisma.expenseCategory.delete({ where: { id } })

    revalidatePath("/expenses")
    revalidatePath("/expenses/categories")
}

export async function getExpenseCategories() {
    const { member } = await getCallerMember()
    return prisma.expenseCategory.findMany({
        where: { workspaceId: member.workspaceId, isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    })
}

// ─── Expense Actions ──────────────────────────────────────────────────────────

export async function logExpense(formData: FormData): Promise<void> {
    const { user, member } = await getCallerMember()

    const projectId = formData.get("projectId") as string
    const description = formData.get("description") as string
    const amountStr = formData.get("amount") as string
    const dateStr = formData.get("date") as string
    const expenseCategoryId = (formData.get("expenseCategoryId") as string) || null
    const isBillable = formData.get("isBillable") === "true"
    const notes = (formData.get("notes") as string) || null
    const quantityStr = (formData.get("quantity") as string) || null
    const quantity = quantityStr ? parseFloat(quantityStr) : null
    const receiptUrl = (formData.get("receiptUrl") as string) || null

    // Determine who the expense is for
    const forUserId = formData.get("forUserId") as string | null
    // Only admins can log for others
    const isAdmin = ADMIN_ROLES.includes(member.role as (typeof ADMIN_ROLES)[number])
    const targetUserId = forUserId && isAdmin ? forUserId : user.id

    // Validate that the target user belongs to this workspace (prevents IDOR)
    if (targetUserId !== user.id) {
        const targetMember = await prisma.workspaceMember.findFirst({
            where: { userId: targetUserId, workspaceId: member.workspaceId },
        })
        if (!targetMember) throw new Error("Target user not found in workspace")
    }

    if (!projectId) throw new Error("Project is required")
    if (!description?.trim()) throw new Error("Description is required")
    if (!dateStr) throw new Error("Date is required")

    const amount = parseFloat(amountStr || "0")
    if (isNaN(amount) || amount <= 0) throw new Error("Amount must be greater than 0")
    const amountCents = Math.round(amount * 100)

    // Verify project belongs to workspace
    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: member.workspaceId },
    })
    if (!project) throw new Error("Project not found")

    // Resolve category sentinel
    const resolvedCategoryId = expenseCategoryId === "__none__" ? null : expenseCategoryId

    await prisma.expense.create({
        data: {
            userId: targetUserId,
            projectId,
            date: new Date(dateStr + "T00:00:00"),
            amountCents,
            quantity: quantity && quantity > 0 ? quantity : null,
            description: description.trim(),
            expenseCategoryId: resolvedCategoryId,
            isBillable,
            notes: notes?.trim() || null,
            receiptUrl: receiptUrl || null,
        },
    })

    revalidatePath("/expenses")
}

export async function updateExpense(id: string, formData: FormData): Promise<void> {
    const { user, member } = await getCallerMember()

    const projectId = formData.get("projectId") as string
    const description = formData.get("description") as string
    const amountStr = formData.get("amount") as string
    const dateStr = formData.get("date") as string
    const expenseCategoryId = (formData.get("expenseCategoryId") as string) || null
    const isBillable = formData.get("isBillable") === "true"
    const notes = (formData.get("notes") as string) || null
    const quantityStr = (formData.get("quantity") as string) || null
    const quantity = quantityStr ? parseFloat(quantityStr) : null
    const receiptUrl = (formData.get("receiptUrl") as string) || null

    if (!projectId) throw new Error("Project is required")
    if (!description?.trim()) throw new Error("Description is required")
    if (!dateStr) throw new Error("Date is required")

    const amount = parseFloat(amountStr || "0")
    if (isNaN(amount) || amount <= 0) throw new Error("Amount must be greater than 0")
    const amountCents = Math.round(amount * 100)

    // Find expense — owner can edit own, admins can edit any in workspace
    const isAdmin = ADMIN_ROLES.includes(member.role as (typeof ADMIN_ROLES)[number])
    const expense = await prisma.expense.findFirst({
        where: {
            id,
            project: { workspaceId: member.workspaceId },
            ...(isAdmin ? {} : { userId: user.id }),
        },
    })
    if (!expense) throw new Error("Expense not found or unauthorized")

    // Verify project belongs to workspace
    const project = await prisma.teifiProject.findFirst({
        where: { id: projectId, workspaceId: member.workspaceId },
    })
    if (!project) throw new Error("Project not found")

    // Resolve category sentinel
    const resolvedCategoryId = expenseCategoryId === "__none__" ? null : expenseCategoryId

    await prisma.expense.update({
        where: { id },
        data: {
            projectId,
            date: new Date(dateStr + "T00:00:00"),
            amountCents,
            quantity: quantity && quantity > 0 ? quantity : null,
            description: description.trim(),
            expenseCategoryId: resolvedCategoryId,
            isBillable,
            notes: notes?.trim() || null,
            receiptUrl: receiptUrl || null,
        },
    })

    revalidatePath("/expenses")
}

export async function deleteExpense(id: string): Promise<void> {
    const { user, member } = await getCallerMember()

    const isAdmin = ADMIN_ROLES.includes(member.role as (typeof ADMIN_ROLES)[number])
    const expense = await prisma.expense.findFirst({
        where: {
            id,
            project: { workspaceId: member.workspaceId },
            ...(isAdmin ? {} : { userId: user.id }),
        },
    })
    if (!expense) throw new Error("Expense not found or unauthorized")

    await prisma.expense.delete({ where: { id } })

    revalidatePath("/expenses")
}

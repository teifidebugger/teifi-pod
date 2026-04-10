"use server"

import { getSessionMember } from "@/app/actions"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const OWNER_ADMIN = ["OWNER", "ADMIN"] as const

async function getCallerMember() {
    return getSessionMember()
}

function requireInvoiceAccess(role: string) {
    if (!OWNER_ADMIN.includes(role as (typeof OWNER_ADMIN)[number])) {
        throw new Error("Only Owners and Admins can manage invoices")
    }
}

function computeTotals(
    lineItems: { quantity: number; unitPrice: number }[],
    taxRatePercent: number,
) {
    const subtotalCents = lineItems.reduce((sum, li) => sum + Math.round(li.quantity * li.unitPrice), 0)
    const taxCents = Math.round(subtotalCents * (taxRatePercent / 100))
    const totalCents = subtotalCents + taxCents
    return { subtotalCents, taxCents, totalCents }
}

export async function createInvoice(formData: FormData): Promise<string> {
    const { member } = await getCallerMember()
    requireInvoiceAccess(member.role)

    const clientId = (formData.get("clientId") as string) || null
    const resolvedClientId = clientId === "__none__" ? null : clientId
    const noteToClient = (formData.get("noteToClient") as string) || null
    const issuedAtStr = formData.get("issuedAt") as string
    const dueAtStr = formData.get("dueAt") as string
    const taxRatePercent = parseFloat((formData.get("taxRatePercent") as string) || "0")

    // Auto-generate invoice number with retry on unique constraint race condition
    let invoiceId: string
    for (let attempt = 0; attempt < 5; attempt++) {
        const count = await prisma.invoice.count({ where: { workspaceId: member.workspaceId } })
        const invoiceNum = `INV-${String(count + 1).padStart(4, "0")}`
        try {
            const invoice = await prisma.invoice.create({
                data: {
                    invoiceNum,
                    workspaceId: member.workspaceId,
                    clientId: resolvedClientId,
                    noteToClient: noteToClient?.trim() || null,
                    issuedAt: issuedAtStr ? new Date(issuedAtStr) : null,
                    dueAt: dueAtStr ? new Date(dueAtStr) : null,
                    taxRatePercent,
                },
            })
            invoiceId = invoice.id
            break
        } catch (err: unknown) {
            const isUniqueViolation =
                err instanceof Error && err.message.includes("Unique constraint") && err.message.includes("invoiceNum")
            if (!isUniqueViolation || attempt === 4) throw err
        }
    }

    revalidatePath("/invoices")
    return invoiceId!
}

export async function updateInvoice(id: string, formData: FormData): Promise<void> {
    const { member } = await getCallerMember()
    requireInvoiceAccess(member.role)

    const invoice = await prisma.invoice.findFirst({ where: { id, workspaceId: member.workspaceId } })
    if (!invoice) throw new Error("Invoice not found")
    if (invoice.status === "VOID") throw new Error("Cannot edit a voided invoice")

    const clientId = (formData.get("clientId") as string) || null
    const resolvedClientId = clientId === "__none__" ? null : clientId
    const noteToClient = (formData.get("noteToClient") as string) || null
    const issuedAtStr = formData.get("issuedAt") as string
    const dueAtStr = formData.get("dueAt") as string
    const taxRatePercent = parseFloat((formData.get("taxRatePercent") as string) || "0")

    await prisma.invoice.update({
        where: { id },
        data: {
            clientId: resolvedClientId,
            noteToClient: noteToClient?.trim() || null,
            issuedAt: issuedAtStr ? new Date(issuedAtStr) : null,
            dueAt: dueAtStr ? new Date(dueAtStr) : null,
            taxRatePercent,
        },
    })

    revalidatePath("/invoices")
    revalidatePath(`/invoices/${id}`)
}

export async function deleteInvoice(id: string): Promise<void> {
    const { member } = await getCallerMember()
    requireInvoiceAccess(member.role)

    const invoice = await prisma.invoice.findFirst({ where: { id, workspaceId: member.workspaceId } })
    if (!invoice) throw new Error("Invoice not found")
    if (invoice.status === "SENT" || invoice.status === "PAID") {
        throw new Error("Cannot delete a sent or paid invoice. Void it instead.")
    }

    await prisma.invoice.delete({ where: { id } })

    revalidatePath("/invoices")
}

export async function markInvoiceSent(id: string): Promise<void> {
    const { member } = await getCallerMember()
    requireInvoiceAccess(member.role)

    const invoice = await prisma.invoice.findFirst({ where: { id, workspaceId: member.workspaceId } })
    if (!invoice) throw new Error("Invoice not found")
    if (invoice.status !== "DRAFT") throw new Error("Only DRAFT invoices can be marked as sent")

    await prisma.invoice.update({
        where: { id },
        data: { status: "SENT", issuedAt: invoice.issuedAt ?? new Date() },
    })

    revalidatePath("/invoices")
    revalidatePath(`/invoices/${id}`)
}

export async function markInvoicePaid(id: string): Promise<void> {
    const { member } = await getCallerMember()
    requireInvoiceAccess(member.role)

    const invoice = await prisma.invoice.findFirst({ where: { id, workspaceId: member.workspaceId } })
    if (!invoice) throw new Error("Invoice not found")
    if (invoice.status !== "SENT") throw new Error("Only SENT invoices can be marked as paid")

    await prisma.invoice.update({
        where: { id },
        data: { status: "PAID", paidAt: new Date() },
    })

    revalidatePath("/invoices")
    revalidatePath(`/invoices/${id}`)
}

export async function voidInvoice(id: string): Promise<void> {
    const { member } = await getCallerMember()
    requireInvoiceAccess(member.role)

    const invoice = await prisma.invoice.findFirst({ where: { id, workspaceId: member.workspaceId } })
    if (!invoice) throw new Error("Invoice not found")
    if (invoice.status === "PAID") throw new Error("Cannot void a paid invoice")
    if (invoice.status === "VOID") throw new Error("Invoice is already voided")

    // Unlink time entries
    await prisma.timeEntry.updateMany({ where: { invoiceId: id }, data: { invoiceId: null } })
    await prisma.invoice.update({ where: { id }, data: { status: "VOID" } })

    revalidatePath("/invoices")
    revalidatePath(`/invoices/${id}`)
}

export async function addLineItem(
    invoiceId: string,
    data: { description: string; quantity: number; unitPrice: number; kind?: string },
): Promise<void> {
    const { member } = await getCallerMember()
    requireInvoiceAccess(member.role)

    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, workspaceId: member.workspaceId } })
    if (!invoice) throw new Error("Invoice not found")
    if (invoice.status === "VOID") throw new Error("Cannot modify a voided invoice")

    const totalCents = Math.round(data.quantity * data.unitPrice)
    await prisma.invoiceLineItem.create({
        data: {
            invoiceId,
            description: data.description.trim(),
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            totalCents,
            kind: data.kind ?? "custom",
        },
    })

    // Recompute totals
    await recomputeInvoiceTotals(invoiceId, invoice.taxRatePercent)
    revalidatePath(`/invoices/${invoiceId}`)
}

export async function removeLineItem(lineItemId: string): Promise<void> {
    const { member } = await getCallerMember()
    requireInvoiceAccess(member.role)

    const lineItem = await prisma.invoiceLineItem.findFirst({
        where: { id: lineItemId },
        include: { invoice: { select: { workspaceId: true, taxRatePercent: true } } },
    })
    if (!lineItem) throw new Error("Line item not found")
    if (lineItem.invoice.workspaceId !== member.workspaceId) throw new Error("Unauthorized")

    await prisma.invoiceLineItem.delete({ where: { id: lineItemId } })
    await recomputeInvoiceTotals(lineItem.invoiceId, lineItem.invoice.taxRatePercent)

    revalidatePath(`/invoices/${lineItem.invoiceId}`)
}

export async function addTimeEntriesToInvoice(invoiceId: string, timeEntryIds: string[]): Promise<void> {
    const { member } = await getCallerMember()
    requireInvoiceAccess(member.role)

    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, workspaceId: member.workspaceId } })
    if (!invoice) throw new Error("Invoice not found")
    if (invoice.status === "VOID") throw new Error("Cannot modify a voided invoice")

    // Verify time entries belong to workspace
    const entries = await prisma.timeEntry.findMany({
        where: { id: { in: timeEntryIds }, project: { workspaceId: member.workspaceId } },
        include: { user: { select: { name: true } } },
    })

    // Create line items for each entry
    for (const entry of entries) {
        const hours = entry.durationSeconds / 3600
        const roundedHours = parseFloat(hours.toFixed(2))
        const description = entry.description ?? `Time entry — ${entry.user.name ?? "Unknown"}`
        const unitPrice = entry.billableRateCents
        const totalCents = Math.round(roundedHours * unitPrice)
        await prisma.invoiceLineItem.create({
            data: {
                invoiceId,
                description,
                quantity: roundedHours,
                unitPrice,
                totalCents,
                kind: "time",
            },
        })
    }

    // Link entries to invoice
    await prisma.timeEntry.updateMany({
        where: { id: { in: entries.map((e) => e.id) } },
        data: { invoiceId },
    })

    await recomputeInvoiceTotals(invoiceId, invoice.taxRatePercent)
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath("/invoices")
}

async function recomputeInvoiceTotals(invoiceId: string, taxRatePercent: number) {
    const lineItems = await prisma.invoiceLineItem.findMany({
        where: { invoiceId },
        select: { quantity: true, unitPrice: true },
    })
    const { subtotalCents, taxCents, totalCents } = computeTotals(lineItems, taxRatePercent)
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: { subtotalCents, taxCents, totalCents },
    })
}

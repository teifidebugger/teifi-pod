"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { PodType } from "@prisma/client"
import { getSessionMember } from "@/app/actions"
import type { PodData } from "@/app/planning/types"

// ── Create Pod ────────────────────────────────────────────────────────────────
export async function createPod(formData: FormData) {
  const { member } = await getSessionMember()
  if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) throw new Error("Unauthorized")

  const name = (formData.get("name") as string)?.trim()
  const type = (formData.get("type") as string) || "DELIVERY"
  if (!name) throw new Error("Name required")

  const pod = await prisma.pod.create({
    data: { name, type: type as PodType, workspaceId: member.workspaceId },
  })
  revalidatePath("/planning")
  return { id: pod.id, name: pod.name, type: pod.type as PodData["type"], slots: [], projects: [] } satisfies PodData
}

// ── Update Pod ────────────────────────────────────────────────────────────────
export async function updatePod(podId: string, formData: FormData) {
  const { member } = await getSessionMember()
  if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) throw new Error("Unauthorized")

  const name = (formData.get("name") as string)?.trim()
  const type = formData.get("type") as string
  if (!name) throw new Error("Name required")

  await prisma.pod.update({
    where: { id: podId, workspaceId: member.workspaceId },
    data: { name, ...(type ? { type: type as PodType } : {}) },
  })
  revalidatePath("/planning")
}

// ── Delete Pod ────────────────────────────────────────────────────────────────
export async function deletePod(podId: string) {
  const { member } = await getSessionMember()
  if (!["OWNER", "ADMIN"].includes(member.role)) throw new Error("Unauthorized")

  await prisma.pod.delete({ where: { id: podId, workspaceId: member.workspaceId } })
  revalidatePath("/planning")
}

// ── Upsert PodSlot ────────────────────────────────────────────────────────────
export async function upsertPodSlot(podId: string, slotId: string | null, roleName: string, memberId: string | null, allocationPercent = 100) {
  const { member } = await getSessionMember()
  if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) throw new Error("Unauthorized")

  // Verify pod belongs to workspace
  const pod = await prisma.pod.findFirst({ where: { id: podId, workspaceId: member.workspaceId } })
  if (!pod) throw new Error("Pod not found")

  const pct = Math.min(100, Math.max(1, allocationPercent))
  let resultId: string
  if (slotId) {
    const updated = await prisma.podSlot.update({
      where: { id: slotId },
      data: { roleName, memberId: memberId || null, allocationPercent: pct },
    })
    resultId = updated.id
  } else {
    const created = await prisma.podSlot.create({
      data: { podId, roleName, memberId: memberId || null, allocationPercent: pct },
    })
    resultId = created.id
  }
  revalidatePath("/planning")
  return { id: resultId }
}

// ── Delete PodSlot ────────────────────────────────────────────────────────────
export async function deletePodSlot(slotId: string) {
  const { member } = await getSessionMember()
  if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) throw new Error("Unauthorized")

  const slot = await prisma.podSlot.findUnique({ where: { id: slotId }, select: { pod: { select: { workspaceId: true } } } })
  if (!slot || slot.pod.workspaceId !== member.workspaceId) throw new Error("Not found")
  await prisma.podSlot.delete({ where: { id: slotId } })
  revalidatePath("/planning")
}

// ── Assign Project to Pod ─────────────────────────────────────────────────────
export async function assignProjectToPod(projectId: string, podId: string | null) {
  const { member } = await getSessionMember()
  if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) throw new Error("Unauthorized")

  await prisma.teifiProject.update({
    where: { id: projectId, workspaceId: member.workspaceId },
    data: { podId: podId || null },
  })
  revalidatePath("/planning")
  revalidatePath("/projects")
}

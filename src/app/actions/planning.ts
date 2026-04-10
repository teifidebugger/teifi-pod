"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { AllocationType } from "@prisma/client"
import { getSessionMember } from "@/app/actions"
import { addWeeks, parseISO, addDays, format } from "date-fns"
import type { PlanProject, ScenarioSummary, SimulationBlock, CommitSelection } from "@/app/planning/types"

export async function createPipelineProject(formData: FormData): Promise<{ project: PlanProject | null; error?: string }> {
  const { member } = await getSessionMember()

  const name = formData.get("name") as string
  const clientId = formData.get("clientId") as string | null
  const budgetHoursRaw = formData.get("budgetHours") as string | null
  const startsOn = formData.get("startsOn") as string | null

  if (!name?.trim()) return { project: null, error: "Name required" }

  const project = await prisma.teifiProject.create({
    data: {
      name: name.trim(),
      workspaceId: member.workspaceId,
      status: "TENTATIVE",
      billingType: "NON_BILLABLE",
      billBy: "none",
      ...(clientId ? { clientId } : {}),
      ...(budgetHoursRaw ? { budgetHours: parseInt(budgetHoursRaw) } : {}),
      ...(startsOn ? { startsOn: new Date(startsOn) } : {}),
    },
    select: {
      id: true, name: true, color: true, budgetHours: true,
      startsOn: true, endsOn: true, status: true,
      client: { select: { name: true } },
    },
  })

  revalidatePath("/planning")

  return {
    project: {
      id: project.id,
      name: project.name,
      color: project.color,
      clientName: project.client?.name ?? null,
      budgetHours: project.budgetHours,
      startsOn: project.startsOn ? format(project.startsOn, "yyyy-MM-dd") : null,
      endsOn: project.endsOn ? format(project.endsOn, "yyyy-MM-dd") : null,
      status: project.status,
      existingDemand: {},
    },
  }
}

export async function commitPipelineProjects(
  selections: CommitSelection[],
  blocks: SimulationBlock[]
): Promise<void> {
  const { member } = await getSessionMember()
  if (!["OWNER", "ADMIN", "MANAGER"].includes(member.role)) throw new Error("Unauthorized")

  const toActivate = selections.filter(s => s.projectId)
  await prisma.teifiProject.updateMany({
    where: { id: { in: toActivate.map(s => s.projectId) }, workspaceId: member.workspaceId },
    data: { status: "ACTIVE" },
  })

  // Create placeholder allocations for selected projects — batch to avoid O(n³) round-trips
  const selectionsWithAllocs = toActivate.filter(s => s.createAllocations)
  if (selectionsWithAllocs.length > 0) {
    // Collect every skill needed across all blocks
    const allSkills = new Set<string>()
    for (const sel of selectionsWithAllocs) {
      for (const block of blocks.filter(b => b.projectId === sel.projectId)) {
        for (const [skill, hrs] of Object.entries(block.skillDemandPerWeek)) {
          if (hrs > 0) allSkills.add(skill)
        }
      }
    }

    // Batch-fetch existing placeholders
    const existingPlaceholders = await prisma.placeholder.findMany({
      where: { workspaceId: member.workspaceId, name: { in: [...allSkills] }, archivedAt: null },
    })
    const placeholderMap = new Map(existingPlaceholders.map(p => [p.name, p]))

    // Create any missing placeholders
    for (const skill of allSkills) {
      if (!placeholderMap.has(skill)) {
        const created = await prisma.placeholder.create({
          data: { name: skill, workspaceId: member.workspaceId, roles: [skill], weeklyCapacityHours: 40 },
        })
        placeholderMap.set(skill, created)
      }
    }

    // Batch-create all allocations
    const allocationData: Array<{ projectId: string; placeholderId: string; startDate: Date; endDate: Date; hoursPerDay: number; type: AllocationType }> = []
    for (const sel of selectionsWithAllocs) {
      for (const block of blocks.filter(b => b.projectId === sel.projectId)) {
        for (const [skill, hoursPerWeek] of Object.entries(block.skillDemandPerWeek)) {
          if (hoursPerWeek <= 0) continue
          const placeholder = placeholderMap.get(skill)!
          const startDate = parseISO(block.startWeek)
          const endDate = addDays(addWeeks(startDate, block.durationWeeks), -1)
          allocationData.push({ projectId: sel.projectId, placeholderId: placeholder.id, startDate, endDate, hoursPerDay: hoursPerWeek / 5, type: AllocationType.SOFT })
        }
      }
    }
    if (allocationData.length > 0) {
      await prisma.allocation.createMany({ data: allocationData })
    }
  }

  revalidatePath("/planning")
  revalidatePath("/schedule")
  revalidatePath("/projects")
}

export async function saveScenario(
  _formData: FormData,
  data: {
    id?: string
    name: string
    podName: string | null
    weekRange: number
    stateJson: object
  }
): Promise<{ scenario: ScenarioSummary | null }> {
  const { member } = await getSessionMember()

  let scenario
  if (data.id) {
    scenario = await prisma.planScenario.update({
      where: { id: data.id, workspaceId: member.workspaceId },
      data: { name: data.name, podName: data.podName, weekRange: data.weekRange, stateJson: data.stateJson },
      select: {
        id: true, name: true, podName: true, weekRange: true, updatedAt: true,
        createdBy: { select: { user: { select: { name: true } } } },
      },
    })
  } else {
    scenario = await prisma.planScenario.create({
      data: {
        name: data.name,
        workspaceId: member.workspaceId,
        createdById: member.id,
        podName: data.podName,
        weekRange: data.weekRange,
        stateJson: data.stateJson,
      },
      select: {
        id: true, name: true, podName: true, weekRange: true, updatedAt: true,
        createdBy: { select: { user: { select: { name: true } } } },
      },
    })
  }

  revalidatePath("/planning")
  return {
    scenario: {
      id: scenario.id,
      name: scenario.name,
      podName: scenario.podName,
      weekRange: scenario.weekRange,
      updatedAt: scenario.updatedAt.toISOString(),
      createdByName: scenario.createdBy.user?.name ?? null,
    },
  }
}

export async function deleteScenario(scenarioId: string): Promise<void> {
  const { member } = await getSessionMember()

  const scenario = await prisma.planScenario.findUnique({ where: { id: scenarioId }, select: { createdById: true } })
  if (!scenario) return
  if (scenario.createdById !== member.id && !["OWNER", "ADMIN"].includes(member.role)) throw new Error("Unauthorized")

  await prisma.planScenario.delete({ where: { id: scenarioId } })
  revalidatePath("/planning")
}

export async function loadScenario(scenarioId: string): Promise<{ blocks: SimulationBlock[] }> {
  const { member } = await getSessionMember()

  const scenario = await prisma.planScenario.findFirst({
    where: { id: scenarioId, workspaceId: member.workspaceId },
    select: { stateJson: true },
  })
  if (!scenario) return { blocks: [] }

  const parsed = scenario.stateJson as { blocks?: SimulationBlock[] }
  return { blocks: parsed.blocks ?? [] }
}

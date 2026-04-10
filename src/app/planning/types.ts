export type PodMember = {
  id: string
  name: string | null
  image: string | null
  teamName: string | null
  weeklyCapacityHours: number
  roles: string[]
  timeOffDates: string[] // "yyyy-MM-dd"
}

export type PodDefinition = {
  name: string | null // null = "All workspace"
  members: PodMember[]
  skillNames: string[]
}

export type PlanProject = {
  id: string
  name: string
  color: string | null
  clientName: string | null
  budgetHours: number | null
  startsOn: string | null  // "yyyy-MM-dd"
  endsOn: string | null    // "yyyy-MM-dd"
  status: string           // "ACTIVE" | "PAUSED" | "TENTATIVE"
  existingDemand: Record<string, number> // skill -> hoursPerWeek
}

export type SimulationBlock = {
  id: string
  projectId: string
  skillDemandPerWeek: Record<string, number> // skill -> hoursPerWeek
  startWeek: string   // "yyyy-MM-dd" Monday
  durationWeeks: number
}

export type HeatmapCell = {
  skill: string
  weekStart: string  // "yyyy-MM-dd"
  ceiling: number    // hours
  liveLoad: number   // hours from real HARD allocations
  pipelineLoad: number // hours from SimulationBlocks
  remaining: number  // ceiling - liveLoad - pipelineLoad
}

export type LiveAllocation = {
  id: string
  memberId: string
  projectId: string
  startDate: string  // "yyyy-MM-dd"
  endDate: string    // "yyyy-MM-dd"
  hoursPerDay: number
  type: string
}

export type ScenarioSummary = {
  id: string
  name: string
  podName: string | null
  weekRange: number
  updatedAt: string
  createdByName: string | null
}

export type ServerPageData = {
  pods: string[]
  members: PodMember[]
  liveAllocations: LiveAllocation[]
  activeProjects: PlanProject[]
  pipelineProjects: PlanProject[]
  holidays: string[]          // "yyyy-MM-dd"
  clients: { id: string; name: string }[]
  workspaceId: string
}

export type CommitSelection = {
  projectId: string
  createAllocations: boolean
}

export type SimulationState = {
  podFilter: string | null
  weekRange: 4 | 8 | 12 | 26
  showPipeline: boolean
  blocks: SimulationBlock[]
  scenarioId: string | null
  scenarioName: string | null
  isDirty: boolean
  pendingDrop: {
    projectId: string
    skill: string
    weekStart: string
    anchorRect: { top: number; left: number; bottom: number; right: number; width: number; height: number } | null
  } | null
}

// ─── POD PLANNING TYPES ─────────────────────────────────────────────────────

export type PodSlotData = {
  id: string
  roleName: string
  memberId: string | null
  memberName: string | null
  memberImage: string | null
  allocationPercent: number       // 1-100
  memberWeeklyCapacityHours: number | null  // null for unfilled slots
}

export type PodData = {
  id: string
  name: string
  type: "DELIVERY" | "SUPPORT" | "SHARED_SERVICES"
  slots: PodSlotData[]
  projects: PodProjectData[]
}

export type PodProjectData = {
  id: string
  name: string
  color: string | null
  clientName: string | null
  status: string
  startsOn: string | null
  endsOn: string | null
  budgetHours: number | null
}

export type UnassignedProject = {
  id: string
  name: string
  color: string | null
  clientName: string | null
  status: string
  startsOn: string | null
  endsOn: string | null
  budgetHours: number | null
}

export type WorkspaceMemberOption = {
  id: string
  name: string | null
  email: string
  image: string | null
  roles: string[]
}

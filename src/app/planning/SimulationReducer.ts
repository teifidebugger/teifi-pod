import type { SimulationState, SimulationBlock } from "./types"

export type SimulationAction =
  | { type: "SET_POD"; pod: string | null }
  | { type: "SET_WEEK_RANGE"; range: 4 | 8 | 12 | 26 }
  | { type: "TOGGLE_PIPELINE" }
  | { type: "DROP_PROJECT"; projectId: string; skill: string; weekStart: string; anchorRect: NonNullable<SimulationState["pendingDrop"]>["anchorRect"] }
  | { type: "CONFIRM_BLOCK"; projectId: string; demand: Record<string, number>; durationWeeks: number; startWeek: string }
  | { type: "CANCEL_DROP" }
  | { type: "REMOVE_BLOCK"; blockId: string }
  | { type: "MOVE_BLOCK"; blockId: string; newStartWeek: string }
  | { type: "LOAD_SCENARIO"; scenarioId: string; scenarioName: string; blocks: SimulationBlock[]; pod: string | null; weekRange: 4 | 8 | 12 | 26 }
  | { type: "MARK_SAVED"; scenarioId: string; scenarioName: string }
  | { type: "RESET" }

export const initialState: SimulationState = {
  podFilter: null,
  weekRange: 12,
  showPipeline: true,
  blocks: [],
  scenarioId: null,
  scenarioName: null,
  isDirty: false,
  pendingDrop: null,
}

export function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case "SET_POD":
      return { ...state, podFilter: action.pod, blocks: [], isDirty: false, pendingDrop: null }
    case "SET_WEEK_RANGE":
      return { ...state, weekRange: action.range, isDirty: state.blocks.length > 0 }
    case "TOGGLE_PIPELINE":
      return { ...state, showPipeline: !state.showPipeline }
    case "DROP_PROJECT":
      return {
        ...state,
        pendingDrop: {
          projectId: action.projectId,
          skill: action.skill,
          weekStart: action.weekStart,
          anchorRect: action.anchorRect,
        },
      }
    case "CONFIRM_BLOCK": {
      const newBlock: SimulationBlock = {
        id: crypto.randomUUID(),
        projectId: action.projectId,
        skillDemandPerWeek: action.demand,
        startWeek: action.startWeek,
        durationWeeks: action.durationWeeks,
      }
      return { ...state, blocks: [...state.blocks, newBlock], pendingDrop: null, isDirty: true }
    }
    case "CANCEL_DROP":
      return { ...state, pendingDrop: null }
    case "REMOVE_BLOCK":
      return { ...state, blocks: state.blocks.filter(b => b.id !== action.blockId), isDirty: true }
    case "MOVE_BLOCK":
      return {
        ...state,
        blocks: state.blocks.map(b => b.id === action.blockId ? { ...b, startWeek: action.newStartWeek } : b),
        isDirty: true,
      }
    case "LOAD_SCENARIO":
      return {
        ...state,
        scenarioId: action.scenarioId,
        scenarioName: action.scenarioName,
        blocks: action.blocks,
        podFilter: action.pod,
        weekRange: action.weekRange,
        isDirty: false,
        pendingDrop: null,
      }
    case "MARK_SAVED":
      return { ...state, scenarioId: action.scenarioId, scenarioName: action.scenarioName, isDirty: false }
    case "RESET":
      return { ...initialState }
    default:
      return state
  }
}

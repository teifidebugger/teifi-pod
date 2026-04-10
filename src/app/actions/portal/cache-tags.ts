// Cache tag helpers for portal server actions — NOT a "use server" file so constants can be exported freely
export const TRANSITIONS_CACHE_TAG = (teamId: string) => `portal-transitions:${teamId}`
export const ACTION_STATES_CACHE_TAG = (teamId: string) => `portal-action-states:${teamId}`
export const WORKSPACE_TRANSITIONS_CACHE_TAG = (workspaceId: string) => `portal-workspace-transitions:${workspaceId}`
export const WORKSPACE_STATE_MAPPING_CACHE_TAG = (workspaceId: string) => `portal-workspace-state-mapping:${workspaceId}`

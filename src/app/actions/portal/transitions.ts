"use server"

import { cacheTag, cacheLife } from "next/cache"
import { type AllowedTransitions, type UATColumn } from "@/lib/uat-mapping"
import { TRANSITIONS_CACHE_TAG, ACTION_STATES_CACHE_TAG, WORKSPACE_STATE_MAPPING_CACHE_TAG } from "./cache-tags"
import {
    getTeamAllowedTransitions as fetchTeamAllowedTransitions,
    getTeamStaffTransitions as fetchTeamStaffTransitions,
    getWorkspaceStateTypeMapping as fetchWorkspaceStateTypeMapping,
    getTeamActionStates as fetchTeamActionStates,
} from "@/services/portal/PortalWorkflowService"

export async function getTeamAllowedTransitions(workspaceId: string, teamId: string): Promise<AllowedTransitions> {
    "use cache"
    cacheTag(TRANSITIONS_CACHE_TAG(teamId))
    cacheLife("hours")
    return fetchTeamAllowedTransitions(workspaceId, teamId)
}

export async function getTeamStaffTransitions(workspaceId: string, teamId: string): Promise<AllowedTransitions> {
    "use cache"
    cacheTag(TRANSITIONS_CACHE_TAG(teamId))
    cacheLife("hours")
    return fetchTeamStaffTransitions(workspaceId, teamId)
}

export async function getWorkspaceStateTypeMapping(workspaceId: string): Promise<Partial<Record<string, UATColumn | null>>> {
    "use cache"
    cacheTag(WORKSPACE_STATE_MAPPING_CACHE_TAG(workspaceId))
    cacheLife("hours")
    return fetchWorkspaceStateTypeMapping(workspaceId)
}

export async function getTeamActionStates(workspaceId: string, teamId: string): Promise<import("@/services/portal/PortalWorkflowService").TeamActionStates> {
    "use cache"
    cacheTag(ACTION_STATES_CACHE_TAG(teamId))
    cacheLife("hours")
    return fetchTeamActionStates(workspaceId, teamId)
}

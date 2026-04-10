/**
 * UAT column resolution helpers.
 *
 * Single source of truth for: Linear state → UAT column.
 * Priority order (highest → lowest):
 *   1. Custom DB mapping (prisma.uatStateMapping) — admin-configured per state ID
 *   2. Workspace type mapping (portalDefaultStateTypeMapping) — admin-configured per state.type
 *   3. Name/type heuristic (mapStateToUATColumn) — built-in fallback
 *
 * All server actions that need to resolve or validate UAT columns MUST use
 * loadUATMappingContext + resolveColumnFromState rather than calling
 * mapStateToUATColumn directly.
 */

import { prisma } from "@/lib/prisma"
import { mapStateToUATColumn, type UATColumn } from "@/lib/uat-mapping"
import { getWorkspaceStateTypeMapping } from "./transitions"

export interface UATMappingContext {
    /** Custom per-state-ID mappings from DB. */
    customMappings: Map<string, UATColumn | null>
    /** Workspace-level state.type overrides. */
    wsTypeMapping: Partial<Record<string, UATColumn | null>>
}

/**
 * Load the resolution context needed to map Linear states → UAT columns.
 * Fetches custom DB mappings and workspace type mapping in parallel.
 */
export async function loadUATMappingContext(
    workspaceId: string | null | undefined,
    teamId: string,
): Promise<UATMappingContext> {
    const [customMappingsRaw, wsTypeMapping] = await Promise.all([
        workspaceId
            ? prisma.uatStateMapping.findMany({ where: { workspaceId, linearTeamId: teamId } })
            : Promise.resolve([]),
        workspaceId
            ? getWorkspaceStateTypeMapping(workspaceId)
            : Promise.resolve({} as Partial<Record<string, UATColumn | null>>),
    ])
    return {
        customMappings: new Map(customMappingsRaw.map(m => [m.linearStateId, m.uatColumn as UATColumn | null])),
        wsTypeMapping,
    }
}

/**
 * Resolve a Linear workflow state → UAT column.
 *
 * Checks custom DB mapping by state ID first; falls back to heuristic.
 * Returns null when the state has no mapping (issue should be hidden / column unknown).
 */
export function resolveColumnFromState(
    state: { id?: string | null; name?: string | null; type?: string | null } | null | undefined,
    { customMappings, wsTypeMapping }: UATMappingContext,
): UATColumn | null {
    if (!state) return null
    const id = state.id
    if (id && customMappings.has(id)) return customMappings.get(id) ?? null
    return mapStateToUATColumn({ name: state.name ?? "", type: state.type ?? "" }, wsTypeMapping)
}

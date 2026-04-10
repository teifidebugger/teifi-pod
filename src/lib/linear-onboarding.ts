/**
 * Linear onboarding helpers.
 * Client creation delegated to LinearClientManager.
 */
import { LinearClientManager } from '@/services/linear'

export async function validateLinearServiceAccount(): Promise<boolean> {
    return LinearClientManager.validateServiceAccount()
}

export async function getSUPTeams(): Promise<Array<{ id: string; key: string; name: string; projectCount: number }>> {
    const client = LinearClientManager.getServiceAccountClient()
    const teamsResult = await client.teams()
    const supTeams = teamsResult.nodes.filter((t) => t.key.startsWith('SUP'))
    return Promise.all(
        supTeams.map(async (team) => {
            const projects = await team.projects()
            return { id: team.id, key: team.key, name: team.name, projectCount: projects.nodes.length }
        }),
    )
}

export async function getSupportTeamsFromLinearTeamIds(
    teamIds: string[],
): Promise<Array<{ id: string; key: string; name: string; projectCount: number }>> {
    if (teamIds.length === 0) return []
    const client = LinearClientManager.getServiceAccountClient()
    const teamsResult = await client.teams()
    const filtered = teamsResult.nodes.filter((t) => teamIds.includes(t.id))
    return Promise.all(
        filtered.map(async (team) => {
            const projects = await team.projects()
            return { id: team.id, key: team.key, name: team.name, projectCount: projects.nodes.length }
        }),
    )
}

export async function createLinearTeam(name: string, key: string): Promise<{ id: string; key: string }> {
    const client = LinearClientManager.getServiceAccountClient()
    const result = await client.createTeam({ name, key })
    const team = await result.team
    if (!team) throw new Error('Failed to create Linear team')
    return { id: team.id, key: team.key }
}

export async function createLinearProject(teamId: string, name: string): Promise<{ id: string; url: string }> {
    const client = LinearClientManager.getServiceAccountClient()
    const result = await client.createProject({ name, teamIds: [teamId] })
    const project = await result.project
    if (!project) throw new Error('Failed to create Linear project')
    return { id: project.id, url: project.url }
}

export async function addMembersToLinearTeam(teamId: string, memberIds: string[]): Promise<void> {
    const client = LinearClientManager.getServiceAccountClient()
    await Promise.all(memberIds.map((userId) => client.createTeamMembership({ teamId, userId })))
}

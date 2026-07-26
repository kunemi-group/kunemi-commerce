import { apiClient, toApiError } from "../client"
import type { ApiTeamMember } from "../types"

export async function listTeam() {
  try {
    const { data } = await apiClient.get<{ members: ApiTeamMember[] }>("/team")
    return data.members ?? []
  } catch (e) {
    throw toApiError(e)
  }
}

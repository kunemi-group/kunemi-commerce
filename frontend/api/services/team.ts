import { apiClient, toApiError } from "../client"
import type { ApiTeamMember, UserRole } from "../types"

export type TeamListResponse = {
  members: ApiTeamMember[]
  seats?: number
  used?: number
  tier?: string
}

export async function listTeam() {
  try {
    const { data } = await apiClient.get<TeamListResponse>("/team")
    return {
      members: data.members ?? [],
      seats: data.seats ?? 2,
      used: data.used ?? data.members?.length ?? 0,
      tier: data.tier ?? "starter",
    }
  } catch (e) {
    throw toApiError(e)
  }
}

export async function inviteMember(payload: {
  email: string
  fullName: string
  role: "manager" | "sales" | "ops"
  password?: string
}) {
  try {
    const { data } = await apiClient.post<{
      member: ApiTeamMember
      temporaryPassword: string
      message: string
    }>("/team/invite", payload)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function updateMemberRole(id: string, role: UserRole) {
  try {
    const { data } = await apiClient.patch<ApiTeamMember>(`/team/${id}/role`, {
      role,
    })
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function removeMember(id: string) {
  try {
    const { data } = await apiClient.delete<{ ok: boolean; id: string }>(
      `/team/${id}`,
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

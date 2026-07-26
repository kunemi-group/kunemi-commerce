"use client"

import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "../keys"
import * as teamApi from "../services/team"

export function useTeam(enabled = true) {
  return useQuery({
    queryKey: queryKeys.team.list(),
    queryFn: teamApi.listTeam,
    enabled,
  })
}

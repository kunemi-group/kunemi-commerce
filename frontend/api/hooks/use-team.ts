"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../keys"
import * as teamApi from "../services/team"
import type { UserRole } from "../types"

export function useTeam(enabled = true) {
  return useQuery({
    queryKey: queryKeys.team.list(),
    queryFn: teamApi.listTeam,
    enabled,
  })
}

export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: teamApi.inviteMember,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.team.all })
    },
  })
}

export function useUpdateMemberRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      teamApi.updateMemberRole(id, role),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.team.all })
    },
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => teamApi.removeMember(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.team.all })
    },
  })
}

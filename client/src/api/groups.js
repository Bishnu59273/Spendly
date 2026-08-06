import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: () => api.get("/groups").then((r) => r.data),
  });
}

export function useGroup(groupId) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: () => api.get(`/groups/${groupId}`).then((r) => r.data),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/groups", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useUpdateGroup(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`/groups/${groupId}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });
}

export function useInvitePreview(code) {
  return useQuery({
    queryKey: ["invite-preview", code],
    queryFn: () => api.get(`/groups/invite/${code}`).then((r) => r.data),
    enabled: !!code,
    retry: false,
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code) => api.post("/groups/join", { code }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useRegenerateInviteCode(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/groups/${groupId}/regenerate-code`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });
}

export function useGroupMembers(groupId) {
  return useQuery({
    queryKey: ["group-members", groupId],
    queryFn: () => api.get(`/groups/${groupId}/members`).then((r) => r.data),
    enabled: !!groupId,
  });
}

export function useRemoveMember(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => api.delete(`/groups/${groupId}/members/${userId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      qc.invalidateQueries({ queryKey: ["group-members", groupId] });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId) => api.delete(`/groups/${groupId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useGroupExpenses(groupId) {
  return useQuery({
    queryKey: ["group-expenses", groupId],
    queryFn: () => api.get(`/groups/${groupId}/expenses`).then((r) => r.data),
    enabled: !!groupId,
  });
}

function invalidateGroupData(qc, groupId) {
  qc.invalidateQueries({ queryKey: ["groups"] });
  qc.invalidateQueries({ queryKey: ["group", groupId] });
  qc.invalidateQueries({ queryKey: ["group-expenses", groupId] });
  qc.invalidateQueries({ queryKey: ["group-balances", groupId] });
}

export function useCreateGroupExpense(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/groups/${groupId}/expenses`, data).then((r) => r.data),
    onSuccess: () => invalidateGroupData(qc, groupId),
  });
}

export function useUpdateGroupExpense(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/groups/${groupId}/expenses/${id}`, data).then((r) => r.data),
    onSuccess: () => invalidateGroupData(qc, groupId),
  });
}

export function useDeleteGroupExpense(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/groups/${groupId}/expenses/${id}`).then((r) => r.data),
    onSuccess: () => invalidateGroupData(qc, groupId),
  });
}

export function useGroupBalances(groupId) {
  return useQuery({
    queryKey: ["group-balances", groupId],
    queryFn: () => api.get(`/groups/${groupId}/balances`).then((r) => r.data),
    enabled: !!groupId,
  });
}

export function useSettlements(groupId, status) {
  return useQuery({
    queryKey: ["group-settlements", groupId, status],
    queryFn: () =>
      api.get(`/groups/${groupId}/settlements`, { params: status ? { status } : {} }).then((r) => r.data),
    enabled: !!groupId,
  });
}

export function useCreateSettlement(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/groups/${groupId}/settlements`, data).then((r) => r.data),
    onSuccess: () => {
      invalidateGroupData(qc, groupId);
      qc.invalidateQueries({ queryKey: ["group-settlements", groupId] });
    },
  });
}

export function useResolveSettlement(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) => api.patch(`/groups/${groupId}/settlements/${id}`, { action }).then((r) => r.data),
    onSuccess: () => {
      invalidateGroupData(qc, groupId);
      qc.invalidateQueries({ queryKey: ["group-settlements", groupId] });
    },
  });
}

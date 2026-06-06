import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get("/goals").then((r) => r.data),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/goals", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/goals/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/goals/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useRecentExpenses(limit = 5) {
  return useQuery({
    queryKey: ["expenses", "recent", limit],
    queryFn: () => api.get(`/expenses/recent?limit=${limit}`).then((r) => r.data),
    staleTime: 10_000,
  });
}

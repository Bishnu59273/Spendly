import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";

export function useExpenses(params = {}) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: () => api.get("/expenses", { params }).then((r) => r.data),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/expenses", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      api.patch(`/expenses/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/expenses/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goal-snapshots"] });
    },
  });
}

export function useHasAnyExpense() {
  return useQuery({
    queryKey: ["expenses", "recent", 5],
    queryFn: () =>
      api.get("/expenses/recent", { params: { limit: 5 } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";

export function useIncomeSources() {
  return useQuery({
    queryKey: ["income-sources"],
    queryFn: () => api.get("/income-sources").then((r) => r.data),
  });
}

export function useCreateIncomeSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/income-sources", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income-sources"] }),
  });
}

export function useDeleteIncomeSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/income-sources/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income-sources"] }),
  });
}

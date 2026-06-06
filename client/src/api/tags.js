import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get("/tags").then((r) => r.data),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/tags", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/tags/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/tags/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

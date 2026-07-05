import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get("/announcements").then((r) => r.data),
  });
}

export function useMarkAnnouncementsSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/announcements/seen").then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

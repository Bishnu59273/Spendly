import { useMutation, useQuery } from "@tanstack/react-query";
import api from "./client.js";

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (data) => api.post("/feedback", data).then((r) => r.data),
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: () => api.get("/feedback/testimonials").then((r) => r.data),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: false,
  });
}

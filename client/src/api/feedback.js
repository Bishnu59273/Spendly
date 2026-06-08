import { useMutation } from "@tanstack/react-query";
import api from "./client.js";

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (data) => api.post("/feedback", data).then((r) => r.data),
  });
}

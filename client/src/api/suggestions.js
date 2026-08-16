import { useQuery } from "@tanstack/react-query";
import api from "./client.js";

export function useHabitSuggestions({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["expenses", "suggestions"],
    queryFn: () => api.get("/expenses/suggestions").then((r) => r.data),
    enabled,
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";

export function useSetMonthlyBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put("/budgets/monthly", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

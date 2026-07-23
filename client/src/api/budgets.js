import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";
import { enqueueMutation, registerEntitySync } from "../lib/syncEngine.js";
import { isNetworkFailure } from "../lib/offlineMutations.js";

registerEntitySync("monthlyBudget", { invalidateKeys: [["summary"], ["me"]] });

export function useSetMonthlyBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      if (navigator.onLine) {
        try {
          return await api.put("/budgets/monthly", data).then((r) => r.data);
        } catch (err) {
          if (!isNetworkFailure(err)) throw err;
        }
      }

      await enqueueMutation({ entity: "monthlyBudget", op: "upsert", payload: data });
      const prevUser = qc.getQueryData(["me"]);
      const optimistic = prevUser
        ? { ...prevUser, monthlyBudget: data.amount, useDefaultBudget: data.isDefault, _pending: true }
        : { _pending: true };
      qc.setQueryData(["me"], optimistic);
      return optimistic;
    },
    onSuccess: (record) => {
      if (record._pending) return;
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

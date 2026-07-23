import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";
import { registerEntitySync } from "../lib/syncEngine.js";
import { useOfflineCreate, useOfflineUpdate, useOfflineDelete } from "../lib/offlineMutations.js";

registerEntitySync("goal", {
  invalidateKeys: [["goals"], ["goal-snapshots"], ["expenses"], ["summary"]],
});

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get("/goals").then((r) => r.data),
  });
}

export function useCreateGoal() {
  return useOfflineCreate({
    entity: "goal",
    endpoint: "/goals",
    queryKeyRoot: ["goals"],
    tempPrefix: "goal",
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useOfflineUpdate({
    entity: "goal",
    endpoint: "/goals",
    queryKeyRoot: ["goals"],
    onSynced: () => {
      qc.invalidateQueries({ queryKey: ["goal-snapshots"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useGoalSnapshots(goalId) {
  return useQuery({
    queryKey: ["goal-snapshots", goalId],
    queryFn: () => api.get(`/goals/${goalId}/snapshots`).then((r) => r.data),
    enabled: !!goalId,
  });
}

export function useDeleteGoal() {
  return useOfflineDelete({ entity: "goal", endpoint: "/goals", queryKeyRoot: ["goals"] });
}

export function useRecentExpenses(limit = 5) {
  return useQuery({
    queryKey: ["expenses", "recent", limit],
    queryFn: () => api.get(`/expenses/recent?limit=${limit}`).then((r) => r.data),
    staleTime: 10_000,
  });
}

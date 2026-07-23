import { useQuery } from "@tanstack/react-query";
import api from "./client.js";
import { registerEntitySync } from "../lib/syncEngine.js";
import { useOfflineCreate, useOfflineDelete } from "../lib/offlineMutations.js";

registerEntitySync("incomeSource", { invalidateKeys: [["income-sources"]] });

export function useIncomeSources() {
  return useQuery({
    queryKey: ["income-sources"],
    queryFn: () => api.get("/income-sources").then((r) => r.data),
  });
}

export function useCreateIncomeSource() {
  return useOfflineCreate({
    entity: "incomeSource",
    endpoint: "/income-sources",
    queryKeyRoot: ["income-sources"],
    tempPrefix: "src",
  });
}

export function useDeleteIncomeSource() {
  return useOfflineDelete({ entity: "incomeSource", endpoint: "/income-sources", queryKeyRoot: ["income-sources"] });
}

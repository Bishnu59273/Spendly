import { useQuery } from "@tanstack/react-query";
import api from "./client.js";
import { registerEntitySync } from "../lib/syncEngine.js";
import { useOfflineCreate, useOfflineUpdate, useOfflineDelete } from "../lib/offlineMutations.js";

registerEntitySync("category", { invalidateKeys: [["categories"]] });

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });
}

export function useCreateCategory() {
  return useOfflineCreate({
    entity: "category",
    endpoint: "/categories",
    queryKeyRoot: ["categories"],
    tempPrefix: "cat",
  });
}

export function useUpdateCategory() {
  return useOfflineUpdate({ entity: "category", endpoint: "/categories", queryKeyRoot: ["categories"] });
}

export function useDeleteCategory() {
  return useOfflineDelete({ entity: "category", endpoint: "/categories", queryKeyRoot: ["categories"] });
}

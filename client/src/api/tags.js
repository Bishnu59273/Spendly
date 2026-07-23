import { useQuery } from "@tanstack/react-query";
import api from "./client.js";
import { registerEntitySync } from "../lib/syncEngine.js";
import { useOfflineCreate, useOfflineUpdate, useOfflineDelete } from "../lib/offlineMutations.js";

registerEntitySync("tag", { invalidateKeys: [["tags"]] });

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get("/tags").then((r) => r.data),
  });
}

export function useCreateTag() {
  return useOfflineCreate({
    entity: "tag",
    endpoint: "/tags",
    queryKeyRoot: ["tags"],
    tempPrefix: "tag",
  });
}

export function useUpdateTag() {
  return useOfflineUpdate({ entity: "tag", endpoint: "/tags", queryKeyRoot: ["tags"] });
}

export function useDeleteTag() {
  return useOfflineDelete({ entity: "tag", endpoint: "/tags", queryKeyRoot: ["tags"] });
}

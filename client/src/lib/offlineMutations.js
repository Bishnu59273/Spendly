import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client.js";
import { enqueueMutation, foldEditIntoQueuedCreate, dropQueuedCreate } from "./syncEngine.js";

export function isNetworkFailure(err) {
  return !err.response;
}

export function makeTempId(prefix) {
  return `tmp_${prefix}_${crypto.randomUUID()}`;
}

export function patchListCache(qc, queryKeyRoot, updater) {
  qc.setQueriesData({ queryKey: queryKeyRoot }, (old) => (Array.isArray(old) ? updater(old) : old));
}

export function findInListCache(qc, queryKeyRoot, id) {
  for (const [, data] of qc.getQueriesData({ queryKey: queryKeyRoot })) {
    if (Array.isArray(data)) {
      const found = data.find((x) => x.id === id);
      if (found) return found;
    }
  }
  return null;
}

// Shared create/update/delete mutation hooks for simple CRUD entity lists
// (categories, tags, income sources, goals) — same offline-queue pattern as
// expenses.js: try the network first, fall back to the offline queue only on
// a real connectivity failure, and patch the list cache instantly either way
// so the UI never waits on a round-trip.

export function useOfflineCreate({ entity, endpoint, queryKeyRoot, tempPrefix, onSynced }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      // Generated up front (not just on the offline path): if this exact
      // create reaches the server but the response is lost to a dropped
      // connection, the offline queue's later retry reuses the same id and
      // the server dedupes it instead of creating a duplicate record.
      const clientMutationId = crypto.randomUUID();
      const dataWithId = { ...data, clientMutationId };

      if (navigator.onLine) {
        try {
          return await api.post(endpoint, dataWithId).then((r) => r.data);
        } catch (err) {
          if (!isNetworkFailure(err)) throw err;
        }
      }

      const tempId = makeTempId(tempPrefix);
      await enqueueMutation({ entity, op: "create", tempId, payload: dataWithId, clientOpId: clientMutationId });
      const optimistic = { ...data, id: tempId, _pending: true };
      patchListCache(qc, queryKeyRoot, (list) => [...list, optimistic]);
      return optimistic;
    },
    onSuccess: (record) => {
      if (record._pending) return;
      qc.invalidateQueries({ queryKey: queryKeyRoot });
      onSynced?.(qc, record);
    },
  });
}

export function useOfflineUpdate({ entity, endpoint, queryKeyRoot, onSynced }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      if (id.startsWith("tmp_")) {
        await foldEditIntoQueuedCreate(entity, id, data);
        const merged = { ...findInListCache(qc, queryKeyRoot, id), ...data, id };
        patchListCache(qc, queryKeyRoot, (list) => list.map((x) => (x.id === id ? merged : x)));
        return merged;
      }

      if (navigator.onLine) {
        try {
          return await api.patch(`${endpoint}/${id}`, data).then((r) => r.data);
        } catch (err) {
          if (!isNetworkFailure(err)) throw err;
        }
      }

      const cached = findInListCache(qc, queryKeyRoot, id);
      await enqueueMutation({
        entity,
        op: "update",
        targetId: id,
        payload: data,
        expectedUpdatedAt: cached?.updatedAt,
      });
      const merged = { ...cached, ...data, id, _pending: true };
      patchListCache(qc, queryKeyRoot, (list) => list.map((x) => (x.id === id ? merged : x)));
      return merged;
    },
    onSuccess: (record) => {
      if (record._pending) return;
      qc.invalidateQueries({ queryKey: queryKeyRoot });
      onSynced?.(qc, record);
    },
  });
}

export function useOfflineDelete({ entity, endpoint, queryKeyRoot, onSynced }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (id.startsWith("tmp_")) {
        await dropQueuedCreate(entity, id);
        patchListCache(qc, queryKeyRoot, (list) => list.filter((x) => x.id !== id));
        return { ok: true, _wasLocalOnly: true };
      }

      if (navigator.onLine) {
        try {
          const result = await api.delete(`${endpoint}/${id}`).then((r) => r.data);
          patchListCache(qc, queryKeyRoot, (list) => list.filter((x) => x.id !== id));
          return result;
        } catch (err) {
          if (!isNetworkFailure(err)) throw err;
        }
      }

      await enqueueMutation({ entity, op: "delete", targetId: id, payload: {} });
      patchListCache(qc, queryKeyRoot, (list) => list.filter((x) => x.id !== id));
      return { ok: true, _pending: true };
    },
    onSuccess: (result) => {
      if (result._pending || result._wasLocalOnly) return;
      qc.invalidateQueries({ queryKey: queryKeyRoot });
      onSynced?.(qc, result);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";
import {
  enqueueMutation,
  foldEditIntoQueuedCreate,
  dropQueuedCreate,
  registerEntitySync,
} from "../lib/syncEngine.js";

registerEntitySync("expense", {
  invalidateKeys: [["expenses"], ["summary"], ["goals"], ["goal-snapshots"]],
});

function isNetworkFailure(err) {
  return !err.response;
}

function makeTempId() {
  return `tmp_exp_${crypto.randomUUID()}`;
}

// Patches every cached expense list (["expenses", params] and
// ["expenses","recent",5] share the same array-of-expense shape) so the UI
// reflects offline changes instantly, without waiting for a server round-trip.
function patchExpenseCaches(qc, updater) {
  qc.setQueriesData({ queryKey: ["expenses"] }, (old) => (Array.isArray(old) ? updater(old) : old));
}

function findCachedExpense(qc, id) {
  for (const [, data] of qc.getQueriesData({ queryKey: ["expenses"] })) {
    if (Array.isArray(data)) {
      const found = data.find((e) => e.id === id);
      if (found) return found;
    }
  }
  return null;
}

function buildOptimisticExpense(qc, data, tempId) {
  const categories = qc.getQueryData(["categories"]) || [];
  const sources = qc.getQueryData(["incomeSources"]) || [];
  const tags = qc.getQueryData(["tags"]) || [];
  const now = new Date().toISOString();

  return {
    ...data,
    id: tempId,
    createdAt: now,
    updatedAt: now,
    category: data.categoryId ? categories.find((c) => c.id === data.categoryId) || null : null,
    source: data.sourceId ? sources.find((s) => s.id === data.sourceId) || null : null,
    tags: (data.tagIds || []).map((tagId) => ({ tagId, tag: tags.find((t) => t.id === tagId) || null })),
    _pending: true,
  };
}

export function useExpenses(params = {}) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: () => api.get("/expenses", { params }).then((r) => r.data),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      // Generated up front (not just on the offline path) and carried through
      // to the request body so that if this exact create round-trips to the
      // server but its response is lost to a dropped connection, the offline
      // queue's later retry reuses the same id and the server dedupes it
      // instead of creating a duplicate expense.
      const clientMutationId = crypto.randomUUID();
      const dataWithId = { ...data, clientMutationId };

      if (navigator.onLine) {
        try {
          return await api.post("/expenses", dataWithId).then((r) => r.data);
        } catch (err) {
          if (!isNetworkFailure(err)) throw err;
        }
      }

      const tempId = makeTempId();
      await enqueueMutation({ entity: "expense", op: "create", tempId, payload: dataWithId, clientOpId: clientMutationId });
      const optimistic = buildOptimisticExpense(qc, data, tempId);
      patchExpenseCaches(qc, (list) => [optimistic, ...list]);
      return optimistic;
    },
    onSuccess: (record) => {
      if (record._pending) return;
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      if (id.startsWith("tmp_")) {
        await foldEditIntoQueuedCreate("expense", id, data);
        const merged = buildOptimisticExpense(qc, { ...findCachedExpense(qc, id), ...data }, id);
        patchExpenseCaches(qc, (list) => list.map((e) => (e.id === id ? merged : e)));
        return merged;
      }

      if (navigator.onLine) {
        try {
          return await api.patch(`/expenses/${id}`, data).then((r) => r.data);
        } catch (err) {
          if (!isNetworkFailure(err)) throw err;
        }
      }

      const cached = findCachedExpense(qc, id);
      await enqueueMutation({
        entity: "expense",
        op: "update",
        targetId: id,
        payload: data,
        expectedUpdatedAt: cached?.updatedAt,
      });
      const merged = buildOptimisticExpense(qc, { ...cached, ...data }, id);
      patchExpenseCaches(qc, (list) => list.map((e) => (e.id === id ? merged : e)));
      return merged;
    },
    onSuccess: (record) => {
      if (record._pending) return;
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (id.startsWith("tmp_")) {
        await dropQueuedCreate("expense", id);
        patchExpenseCaches(qc, (list) => list.filter((e) => e.id !== id));
        return { ok: true, _wasLocalOnly: true };
      }

      if (navigator.onLine) {
        try {
          const result = await api.delete(`/expenses/${id}`).then((r) => r.data);
          patchExpenseCaches(qc, (list) => list.filter((e) => e.id !== id));
          return result;
        } catch (err) {
          if (!isNetworkFailure(err)) throw err;
        }
      }

      await enqueueMutation({ entity: "expense", op: "delete", targetId: id, payload: {} });
      patchExpenseCaches(qc, (list) => list.filter((e) => e.id !== id));
      return { ok: true, _pending: true };
    },
    onSuccess: (result) => {
      if (result._pending || result._wasLocalOnly) return;
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goal-snapshots"] });
    },
  });
}

export function useHasAnyExpense() {
  return useQuery({
    queryKey: ["expenses", "recent", 5],
    queryFn: () =>
      api.get("/expenses/recent", { params: { limit: 5 } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

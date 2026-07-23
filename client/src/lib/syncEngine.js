import api from "../api/client.js";
import {
  addToOutbox,
  getAllOutbox,
  getOutboxEntryById,
  updateOutboxEntry,
  removeFromOutbox,
  mergeIntoCreateOp,
  removeCreateOpAndDependents,
  resolveTempIdInOutbox,
} from "./offlineDb.js";

const MAX_ATTEMPTS = 8;

// Each offline-syncable entity registers the React Query keys to invalidate
// once one of its queued ops resolves — populated by that entity's api/*.js
// module so query-key shape stays owned by the file that defines it.
const entityRegistry = {};

export function registerEntitySync(entity, { invalidateKeys }) {
  entityRegistry[entity] = { invalidateKeys };
}

let queryClientRef = null;
let isSyncing = false;
let flushRequested = false;
const listeners = new Set();
let latestSnapshot = { pendingCount: 0, failedCount: 0, status: "idle" };

function computeAndNotify() {
  getAllOutbox().then((all) => {
    const failed = all.filter(
      (e) => e.status === "error" && e.attempts >= MAX_ATTEMPTS,
    );
    const status = isSyncing
      ? "syncing"
      : failed.length > 0
        ? "error"
        : all.length > 0
          ? navigator.onLine
            ? "syncing"
            : "offline-queued"
          : "idle";
    latestSnapshot = {
      pendingCount: all.length,
      failedCount: failed.length,
      status,
    };
    listeners.forEach((cb) => cb());
  });
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot() {
  return latestSnapshot;
}

export function init(queryClient) {
  queryClientRef = queryClient;
  window.addEventListener("online", () => processQueue());
  window.addEventListener("offline", () => computeAndNotify());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine)
      processQueue();
  });
  computeAndNotify();
  processQueue();
}

export async function enqueueMutation(entry) {
  const clientOpId = entry.clientOpId || crypto.randomUUID();
  await addToOutbox({ ...entry, id: clientOpId, clientOpId });
  computeAndNotify();
  processQueue(); // fire-and-forget — don't block the caller on network
  return clientOpId;
}

export async function foldEditIntoQueuedCreate(entity, tempId, patch) {
  const merged = await mergeIntoCreateOp(entity, tempId, patch);
  computeAndNotify();
  return merged;
}

export async function dropQueuedCreate(entity, tempId) {
  const removed = await removeCreateOpAndDependents(entity, tempId);
  computeAndNotify();
  return removed;
}

// Manual retry for ops that hit MAX_ATTEMPTS and stopped auto-retrying —
// resets their attempt count and lets the next processQueue pass pick them
// back up.
export async function retryFailedOps() {
  const all = await getAllOutbox();
  for (const entry of all) {
    if (entry.status === "error") {
      await updateOutboxEntry(entry.id, { status: "pending", attempts: 0, lastError: null });
    }
  }
  computeAndNotify();
  processQueue();
}

function invalidate(entity) {
  const cfg = entityRegistry[entity];
  if (!queryClientRef || !cfg) return;
  cfg.invalidateKeys.forEach((key) =>
    queryClientRef.invalidateQueries({ queryKey: key }),
  );
}

export async function processQueue() {
  if (isSyncing) {
    flushRequested = true;
    return;
  }
  if (!navigator.onLine) return;

  isSyncing = true;
  computeAndNotify();
  try {
    do {
      flushRequested = false;
      const all = (await getAllOutbox()).filter(
        (e) => e.attempts < MAX_ATTEMPTS,
      );
      for (const staleEntry of all) {
        if (!navigator.onLine) break;
        // Re-read from IndexedDB: an earlier op in this same pass may have
        // just rewritten this entry's payload (resolveTempIdInOutbox), and
        // the stale snapshot copy would still carry an unresolved temp id.
        const entry = await getOutboxEntryById(staleEntry.id);
        if (!entry) continue; // already synced/removed
        await syncOne(entry);
      }
    } while (flushRequested && navigator.onLine);
  } finally {
    isSyncing = false;
    computeAndNotify();
  }
}

async function syncOne(entry) {
  const body = {
    ops: [
      {
        clientOpId: entry.clientOpId,
        entity: entry.entity,
        op: entry.op,
        tempId: entry.tempId,
        id: entry.targetId,
        payload: entry.payload,
        expectedUpdatedAt: entry.expectedUpdatedAt,
      },
    ],
  };

  let result;
  try {
    const res = await api.post("/sync/batch", body);
    result = res.data.results[0];
  } catch {
    // Real network failure mid-sync — leave it queued, retry on the next pass.
    return;
  }

  if (result.status === "ok") {
    if (entry.op === "create" && result.tempId) {
      await resolveTempIdInOutbox(entry.tempId, result.record.id);
    }
    await removeFromOutbox(entry.id);
    invalidate(entry.entity);
  } else if (result.status === "not_found" || result.status === "conflict") {
    // not_found: already gone server-side. conflict: server wins, stale
    // queued edit is discarded (no merge UI) — either way, drop it.
    await removeFromOutbox(entry.id);
    invalidate(entry.entity);
  } else {
    // Genuine validation/server error — keep queued but cap retries.
    await updateOutboxEntry(entry.id, {
      status: "error",
      attempts: (entry.attempts || 0) + 1,
      lastError: result.error || "Sync failed",
    });
  }
  computeAndNotify();
}

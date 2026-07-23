import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot } from "../lib/syncEngine.js";

export function useOfflineQueue() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

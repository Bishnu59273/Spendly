import { useEffect, useRef, useState } from "react";
import { CloudOff, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { useOfflineQueue } from "../hooks/useOfflineQueue.js";
import { retryFailedOps } from "../lib/syncEngine.js";

const VARIANTS = {
  queued: { icon: CloudOff, bg: "var(--warn-soft)", fg: "var(--warn)" },
  syncing: { icon: RefreshCw, bg: "var(--brand-soft)", fg: "var(--brand)" },
  synced: { icon: CheckCircle2, bg: "var(--pos-soft)", fg: "var(--pos)" },
  error: { icon: AlertTriangle, bg: "var(--neg-soft)", fg: "var(--neg)" },
};

// Lives in the topbar (both desktop and mobile - same header, responsive
// CSS) instead of a full-width banner. Renders nothing when there's no
// pending change and nothing was just synced, so it stays out of the way.
export default function SyncStatusPill() {
  const { pendingCount, failedCount, status } = useOfflineQueue();
  const [showSynced, setShowSynced] = useState(false);
  const wasSyncing = useRef(false);

  useEffect(() => {
    if (wasSyncing.current && status === "idle") {
      setShowSynced(true);
      const t = setTimeout(() => setShowSynced(false), 2200);
      return () => clearTimeout(t);
    }
    wasSyncing.current = status === "syncing";
  }, [status]);

  let variant;
  let label;
  if (status === "error" && failedCount > 0) {
    variant = "error";
    label = `${failedCount} failed`;
  } else if (status === "syncing") {
    variant = "syncing";
    label = "Syncing…";
  } else if (status === "offline-queued" && pendingCount > 0) {
    variant = "queued";
    label = `${pendingCount} change${pendingCount === 1 ? "" : "s"}`;
  } else if (showSynced) {
    variant = "synced";
    label = "Synced";
  } else {
    return null;
  }

  const { icon: Icon, bg, fg } = VARIANTS[variant];
  const isError = variant === "error";

  return (
    <button
      key={variant}
      className="sp-sync-pill"
      data-variant={variant}
      onClick={isError ? () => retryFailedOps() : undefined}
      title={isError ? `${label} - tap to retry` : label}
      style={{
        background: bg,
        color: fg,
        cursor: isError ? "pointer" : "default",
      }}
    >
      <Icon
        className={
          variant === "syncing"
            ? "sp-spin"
            : variant === "synced"
              ? "sp-pop"
              : ""
        }
        style={{ width: 14, height: 14, flex: "none" }}
      />
      <span className="sp-sync-pill-label">{label}</span>
    </button>
  );
}

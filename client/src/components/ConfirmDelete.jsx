import { Trash2 } from "lucide-react";

export default function ConfirmDelete({ open, onConfirm, onCancel, label = "this item", loading = false }) {
  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      />

      {/* Dialog */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 380, margin: "0 16px",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}>
        {/* Icon strip */}
        <div style={{
          background: "color-mix(in srgb, var(--neg) 10%, transparent)",
          padding: "24px 24px 20px",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: "color-mix(in srgb, var(--neg) 15%, transparent)",
            display: "grid", placeItems: "center",
            color: "var(--neg)",
          }}>
            <Trash2 style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>
              Delete {label}?
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 3 }}>
              This action cannot be undone.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "16px 24px", display: "flex", gap: 10 }}>
          <button
            className="sp-btn sp-btn-ghost"
            style={{ flex: 1 }}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            style={{
              flex: 1.2, height: 42, borderRadius: "var(--r-sm)",
              background: "var(--neg)", color: "#fff",
              fontWeight: 600, fontSize: 14, border: "none", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
            onClick={onConfirm}
            disabled={loading}
          >
            <Trash2 style={{ width: 15, height: 15 }} />
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

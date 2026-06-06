import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      <div className="sp-scrim open" onClick={onClose} />
      <div className="sp-modal-sheet sp-modal-open" style={{
        position: "fixed", zIndex: 91, left: "50%", top: "50%",
        transform: "translate(-50%,-50%)",
        width: "100%", maxWidth: 480,
        background: "var(--surface)", borderRadius: "var(--r-xl)",
        boxShadow: "var(--sh-lg)", border: "1px solid var(--line)",
        overflow: "hidden",
      }}>
        {/* Drag handle — mobile only */}
        <div className="sp-sheet-handle" style={{ display: "none", justifyContent: "center", padding: "10px 0 2px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--line-strong)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <div className="sp-display" style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>{title}</div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 99, display: "grid", placeItems: "center",
              background: "var(--surface-sunken)", border: "none", color: "var(--ink-2)" }}
          >
            <X style={{ width: 17, height: 17 }} />
          </button>
        </div>
        <div className="sp-modal-fields" style={{ padding: "20px 24px 24px", maxHeight: "80vh", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </>
  );
}

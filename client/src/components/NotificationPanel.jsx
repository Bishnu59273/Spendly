import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { useRecentExpenses } from "../api/goals.js";
import { formatCurrency } from "../utils/format.js";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SEEN_KEY = "sp_notif_seen_at";

export default function NotificationPanel({ currency }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const { data: expenses = [] } = useRecentExpenses(5);

  const seenAt = parseInt(localStorage.getItem(SEEN_KEY) || "0");
  const unread = expenses.filter(
    (e) => new Date(e.createdAt).getTime() > seenAt,
  ).length;

  const handleOpen = () => {
    setOpen((v) => {
      if (!v) localStorage.setItem(SEEN_KEY, Date.now().toString());
      return !v;
    });
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        className="sp-icon-btn"
        onClick={handleOpen}
        aria-label="Notifications"
        style={{ position: "relative" }}
      >
        <Bell style={{ width: 18, height: 18 }} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 8,
              height: 8,
              borderRadius: 99,
              background: "var(--neg)",
              border: "2px solid var(--surface)",
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 340,
            zIndex: 200,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-md)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 12px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontWeight: 700,
                  fontSize: 14.5,
                  color: "var(--ink)",
                }}
              >
                Notifications
              </div>
              <div
                style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}
              >
                Last 5 added
              </div>
            </div>
            <button
              className="sp-icon-btn"
              style={{ width: 26, height: 26 }}
              onClick={() => setOpen(false)}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* List */}
          {expenses.length === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 13,
              }}
            >
              No expenses yet
            </div>
          ) : (
            <div>
              {expenses.map((e, i) => {
                const isNew = new Date(e.createdAt).getTime() > seenAt;
                return (
                  <div
                    key={e.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "11px 16px",
                      borderTop: i === 0 ? "none" : "1px solid var(--line)",
                      background: isNew
                        ? "color-mix(in srgb, var(--brand) 5%, transparent)"
                        : "transparent",
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 17,
                        background: (e.category?.color || "#888") + "22",
                      }}
                    >
                      {e.category?.icon || "💸"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "var(--ink)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {e.note || e.category?.name || "Expense"}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--ink-3)",
                          marginTop: 1,
                        }}
                      >
                        {e.category?.name} · {timeAgo(e.createdAt)}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 3,
                      }}
                    >
                      <span
                        className="sp-num"
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: "var(--ink)",
                        }}
                      >
                        −{formatCurrency(e.amount, currency)}
                      </span>
                      {isNew && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--brand)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          New
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

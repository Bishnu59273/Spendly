import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { useAnnouncements, useMarkAnnouncementsSeen } from "../api/announcements.js";
import Spinner from "../components/Spinner.jsx";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Updates() {
  const navigate = useNavigate();
  const { data, isLoading } = useAnnouncements();
  const markSeen = useMarkAnnouncementsSeen();

  useEffect(() => {
    markSeen.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const announcements = data?.announcements || [];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 14,
          background: "none", border: "none", cursor: "pointer", padding: 0,
          color: "var(--ink-3)", fontSize: 13.5, fontWeight: 600,
        }}
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <div className="sp-card sp-card-pad">
        <div className="sp-card-head" style={{ padding: 0, marginBottom: 18 }}>
          <div>
            <div className="sp-card-title">What's new</div>
            <div className="sp-card-sub">Recent changes and updates to Spendly</div>
          </div>
        </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
          <Spinner />
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-3)" }}>
          <Bell style={{ width: 28, height: 28, marginBottom: 8, opacity: 0.5 }} />
          <div style={{ fontSize: 13.5 }}>No updates yet — check back soon.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {announcements.map((a) => (
            <div
              key={a.id}
              style={{ display: "flex", gap: 14, paddingBottom: 20, borderBottom: "1px solid var(--line)" }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 19,
                  background: "var(--surface-sunken)",
                }}
              >
                {a.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", flexShrink: 0 }}>{formatDate(a.createdAt)}</div>
                </div>
                <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7, marginTop: 6, whiteSpace: "pre-line" }}>
                  {a.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

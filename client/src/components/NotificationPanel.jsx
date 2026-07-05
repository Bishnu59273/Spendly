import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAnnouncements } from "../api/announcements.js";

export default function NotificationPanel() {
  const navigate = useNavigate();
  const { data } = useAnnouncements();

  const announcements = data?.announcements || [];
  const seenAt = data?.lastSeenAt ? new Date(data.lastSeenAt).getTime() : 0;
  const unread = announcements.filter(
    (a) => new Date(a.createdAt).getTime() > seenAt,
  ).length;

  return (
    <button
      className="sp-icon-btn"
      onClick={() => navigate("/updates")}
      aria-label="What's new"
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
  );
}

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
      aria-label={unread > 0 ? `What's new (${unread} unread)` : "What's new"}
    >
      <Bell style={{ width: 18, height: 18 }} />
      {unread > 0 && (
        <span key={unread} className="sp-notif-badge" aria-hidden="true">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}

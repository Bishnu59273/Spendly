import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { isPushSupported, getPushStatus } from "../utils/push.js";

const STORAGE_REMIND = "sp_push_prompt_remind";
const REMIND_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function shouldShow() {
  const remind = localStorage.getItem(STORAGE_REMIND);
  if (remind) return Date.now() > Number(remind);
  return true;
}

export default function PushNotificationPrompt() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPushSupported() || !shouldShow()) return;
    let cancelled = false;
    const t = setTimeout(() => {
      getPushStatus().then((status) => {
        if (!cancelled && status === "unsubscribed") setOpen(true);
      });
    }, 4000);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_REMIND, String(Date.now() + REMIND_MS));
    setOpen(false);
  };

  const handleEnable = () => {
    setOpen(false);
    navigate("/settings?highlight=push");
  };

  if (!open) return null;

  const isMobile = window.innerWidth < 600;

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
        onClick={dismiss}
      />
      <div style={{
        position: "fixed", zIndex: 201,
        left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        width: "100%", maxWidth: 400,
        background: "var(--surface)", borderRadius: "var(--r-xl)",
        border: "1px solid var(--line)", boxShadow: "var(--sh-lg)",
        padding: isMobile ? "20px 18px 18px" : "32px 28px 28px",
        display: "flex", flexDirection: "column", gap: isMobile ? 14 : 18,
        textAlign: "center",
      }}>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{ position: "absolute", top: 14, right: 14, background: "var(--surface-sunken)", border: "none", borderRadius: 99, width: 30, height: 30, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--ink-3)" }}
        >
          <X style={{ width: 15, height: 15 }} />
        </button>

        <div
          style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto",
            background: "var(--brand-soft)", color: "var(--brand)",
            display: "grid", placeItems: "center",
          }}
        >
          <Bell size={26} />
        </div>

        <div>
          <div className="sp-display" style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Never miss an update
          </div>
          <div style={{ fontSize: isMobile ? 13 : 14, color: "var(--ink-3)", lineHeight: 1.6 }}>
            Turn on push notifications to hear about new features and announcements as soon as they ship.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={handleEnable}
            className="sp-btn sp-btn-primary"
            style={{ width: "100%", height: isMobile ? 40 : 46, justifyContent: "center", fontSize: isMobile ? 14 : 15, gap: 8 }}
          >
            <Bell size={15} />
            Enable notifications
          </button>
          <button
            onClick={dismiss}
            style={{ width: "100%", height: 38, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--ink-3)", fontWeight: 500 }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </>
  );
}

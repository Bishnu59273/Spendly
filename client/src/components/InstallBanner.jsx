import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";

const DISMISSED_KEY = "sp_pwa_install_dismissed";
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

export default function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED_KEY)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    if (isIOS) {
      setVisible(true);
      return;
    }

    // Event may have fired before React mounted — check the global capture
    if (window.__pwaPrompt) {
      setPrompt(window.__pwaPrompt);
      setVisible(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      window.__pwaPrompt = e;
      setPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    window.__pwaPrompt = null;
    setVisible(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 300,
        background: "var(--brand)",
        color: "var(--on-brand, #fff)",
        padding: "14px 16px",
        paddingBottom: "calc(14px + env(safe-area-inset-bottom))",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "var(--sh-lg, 0 -4px 24px rgba(0,0,0,0.18))",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "rgba(255,255,255,0.18)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {isIOS ? <Share2 size={20} /> : <Download size={20} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
          Add Spendly to your home screen
        </div>
        {isIOS ? (
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
            Tap the Share button below, then "Add to Home Screen"
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
            Instant access from your home screen
          </div>
        )}
      </div>

      {!isIOS && (
        <button
          onClick={handleInstall}
          style={{
            height: 36,
            padding: "0 16px",
            borderRadius: "var(--r-sm, 8px)",
            background: "rgba(255,255,255,0.22)",
            border: "1px solid rgba(255,255,255,0.35)",
            color: "var(--on-brand, #fff)",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Install
        </button>
      )}

      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        style={{
          background: "none",
          border: "none",
          color: "var(--on-brand, #fff)",
          opacity: 0.75,
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          padding: 4,
          flexShrink: 0,
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}

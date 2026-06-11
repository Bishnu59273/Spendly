import { useState, useEffect } from "react";
import ReinstallModal from "./ReinstallModal.jsx";

const OLD_DOMAIN = "spendly-bice.vercel.app";

export default function DomainMigrationBanner() {
  const [visible, setVisible] = useState(false);
  const [slid, setSlid] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (window.location.hostname !== OLD_DOMAIN) return;
    setVisible(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSlid(true)));
  }, []);

  if (!visible) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 600,
          background: "#7C6FF7",
          color: "#fff",
          fontSize: 14,
          fontWeight: 500,
          transform: slid ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            flexWrap: "wrap",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <span style={{ flex: 1, minWidth: 220, lineHeight: 1.5 }}>
            🎉 Spendly has moved to{" "}
            <a
              href="https://spendly.it.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#fff",
                textDecoration: "underline",
                fontWeight: 700,
              }}
            >
              spendly.it.com
            </a>{" "}
            — reinstall the app for the best experience
          </span>

          <button
            onClick={() => setModalOpen(true)}
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255,255,255,0.75)",
              color: "#fff",
              borderRadius: 6,
              padding: "4px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Reinstall
          </button>
        </div>
      </div>

      <ReinstallModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

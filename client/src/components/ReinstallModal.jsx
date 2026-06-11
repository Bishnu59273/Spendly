import { useEffect } from "react";
import { X, Smartphone, TabletSmartphone } from "lucide-react";

export default function ReinstallModal({ open, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      <div className="sp-scrim open" onClick={onClose} />
      <div
        className="sp-modal-sheet sp-modal-open"
        style={{
          position: "fixed",
          zIndex: 610,
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: "calc(100% - 32px)",
          maxWidth: 620,
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--sh-lg)",
          border: "1px solid var(--line)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "24px 24px 0",
            gap: 12,
          }}
        >
          <div>
            <div
              className="sp-display"
              style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}
            >
              Install Spendly on your device
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>
              Your data is 100% safe — only the address changed
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 99,
              display: "grid",
              placeItems: "center",
              background: "var(--surface-sunken)",
              border: "none",
              color: "var(--ink-2)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X style={{ width: 17, height: 17 }} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "20px 24px 24px",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          {/* Two-column grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
            className="reinstall-cols"
          >
            {/* Android */}
            <Section icon={<Smartphone size={16} />} title="Android">
              <Steps
                items={[
                  "Delete the old Spendly icon from your home screen",
                  "Open spendly.it.com in Chrome",
                  "Login to your account",
                  "Tap the ⋮ menu → Settings → scroll down",
                  'Tap "Install" on the prompt',
                ]}
              />
            </Section>

            {/* iOS */}
            <Section icon={<TabletSmartphone size={16} />} title="iOS / iPhone">
              <Steps
                items={[
                  "Open spendly.it.com in Safari (must be Safari)",
                  "Tap the Share button at the bottom",
                  'Scroll down and tap "Add to Home Screen"',
                  "Delete the old Spendly icon from your home screen",
                ]}
              />
            </Section>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 20 }}>
            <a
              href="https://spendly.it.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "#7C6FF7",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "var(--r-md)",
                padding: "13px 24px",
                fontWeight: 700,
                fontSize: 15,
                textAlign: "center",
              }}
            >
              Go to spendly.it.com →
            </a>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Old bookmarks will automatically redirect
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 520px) {
          .reinstall-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function Section({ icon, title, children }) {
  return (
    <div
      style={{
        background: "var(--surface-sunken)",
        borderRadius: "var(--r-md)",
        padding: 16,
        border: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 12,
          color: "var(--ink)",
        }}
      >
        {icon}
        <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Steps({ items }) {
  return (
    <ol
      style={{
        margin: 0,
        padding: "0 0 0 18px",
        fontSize: 13,
        color: "var(--ink-2)",
        lineHeight: 1.7,
      }}
    >
      {items.map((step, i) => (
        <li key={i} style={{ marginBottom: i < items.length - 1 ? 4 : 0 }}>
          {step}
        </li>
      ))}
    </ol>
  );
}

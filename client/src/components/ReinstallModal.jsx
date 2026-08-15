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
              style={{
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.02em",
              }}
            >
              Install Spendly on your device
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>
              Your data is 100% safe - only the address changed
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
                  {
                    title: "Uninstall the old app",
                    sub: "Remove the current Spendly icon from your home screen",
                  },
                  {
                    title: "Open the link & log in",
                    sub: "Open spendly.it.com in Chrome and sign in to your account",
                  },
                  {
                    title: "Tap the install banner",
                    sub: "A banner appears at the bottom of the screen - tap it to add Spendly to your home screen",
                  },
                  {
                    title: "Banner not showing?",
                    sub: "Tap the ⋮ menu → Settings → scroll down → tap Install app",
                    warn: true,
                  },
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((step, i) => {
        if (typeof step === "string") {
          return (
            <div
              key={i}
              style={{ display: "flex", gap: 9, alignItems: "flex-start" }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background:
                    "color-mix(in srgb, var(--brand) 15%, transparent)",
                  color: "var(--brand)",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--ink-2)",
                  lineHeight: 1.55,
                }}
              >
                {step}
              </span>
            </div>
          );
        }
        const { title, sub, warn } = step;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
              ...(warn && {
                background: "color-mix(in srgb, #f59e0b 10%, transparent)",
                border:
                  "1px solid color-mix(in srgb, #f59e0b 35%, transparent)",
                borderRadius: "var(--r-sm)",
                padding: "8px 10px",
                marginTop: 2,
              }),
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: warn
                  ? "color-mix(in srgb, #f59e0b 25%, transparent)"
                  : "color-mix(in srgb, var(--brand) 15%, transparent)",
                color: warn ? "#d97706" : "var(--brand)",
                fontSize: warn ? 13 : 11,
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
                marginTop: 1,
              }}
            >
              {warn ? "!" : i + 1}
            </span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: warn ? "#92400e" : "var(--ink)",
                  marginBottom: 2,
                }}
              >
                {title}
              </div>
              {sub && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-3)",
                    lineHeight: 1.55,
                  }}
                >
                  {sub}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

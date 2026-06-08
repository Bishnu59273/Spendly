import { useState } from "react";
import { Mail, User, Send, CheckCircle } from "lucide-react";

const ACCESS_KEY = "1a8ca5b3-dea1-4785-b6f6-f470ec56a606";

export default function Support({ user }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: "Spendly — Feature suggestion / feedback",
          from_name: user.name,
          email: user.email,
          message: message.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSent(true);
        setMessage("");
      } else {
        setError("Failed to send. Please try again.");
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div>
        <div
          className="sp-display"
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            marginBottom: 4,
          }}
        >
          Help & Support
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-3)" }}>
          Have a question or idea? Reach out — we read everything.
        </div>
      </div>

      {/* Contact card */}
      <div
        className="sp-card sp-card-pad"
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}
        >
          Contact
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "var(--brand)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              boxShadow:
                "0 4px 12px color-mix(in srgb, var(--brand) 30%, transparent)",
            }}
          >
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#f4efe6",
                lineHeight: 1,
              }}
            >
              S
            </span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
              Bishnu
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>
              Maker of Spendly
            </div>
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid var(--line)",
            paddingTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--r-sm)",
                background: "var(--surface-sunken)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <User style={{ width: 15, height: 15, color: "var(--ink-3)" }} />
            </div>
            <span style={{ fontSize: 14, color: "var(--ink)" }}>Bishnu</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--r-sm)",
                background: "var(--surface-sunken)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Mail style={{ width: 15, height: 15, color: "var(--ink-3)" }} />
            </div>
            <a
              href="mailto:bishnusaha59273@gmail.com"
              style={{
                fontSize: 14,
                color: "var(--brand)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              bishnusaha59273@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* Suggestion form */}
      <div className="sp-card sp-card-pad">
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            marginBottom: 14,
          }}
        >
          Something missing?
        </div>
        {sent ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              padding: "20px 0",
              textAlign: "center",
            }}
          >
            <CheckCircle
              style={{ width: 40, height: 40, color: "var(--pos)" }}
            />
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
              Message sent!
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
              Thanks for the feedback — I'll look into it.
            </div>
            <button
              onClick={() => setSent(false)}
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "var(--brand)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Send another
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSend}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                  marginBottom: 7,
                }}
              >
                Your suggestion or report
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's missing, broken, or could be better…"
                rows={5}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "var(--r-sm)",
                  border: "1px solid var(--line)",
                  background: "var(--surface-2)",
                  color: "var(--ink)",
                  fontSize: 14,
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "var(--body)",
                  boxSizing: "border-box",
                  transition: "border-color var(--d1) var(--e)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
              />
            </div>

            {/* Sender info (readonly) */}
            <div style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  height: 42,
                  padding: "0 12px",
                  borderRadius: "var(--r-sm)",
                  border: "1px solid var(--line)",
                  background: "var(--surface-sunken)",
                  display: "flex",
                  alignItems: "center",
                  fontSize: 13.5,
                  color: "var(--ink-3)",
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 42,
                  padding: "0 12px",
                  borderRadius: "var(--r-sm)",
                  border: "1px solid var(--line)",
                  background: "var(--surface-sunken)",
                  display: "flex",
                  alignItems: "center",
                  fontSize: 13.5,
                  color: "var(--ink-3)",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {user.email}
              </div>
            </div>

            {error && (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--neg)",
                  background: "color-mix(in srgb, var(--neg) 10%, transparent)",
                  borderRadius: "var(--r-sm)",
                  padding: "9px 12px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="sp-btn sp-btn-primary"
              style={{
                height: 46,
                justifyContent: "center",
                fontSize: 15,
                opacity: !message.trim() ? 0.5 : 1,
                gap: 8,
              }}
            >
              <Send style={{ width: 16, height: 16 }} />
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

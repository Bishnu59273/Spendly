import { useState } from "react";
import { Mail, User, Send, CheckCircle } from "lucide-react";

const ACCESS_KEY = "1a8ca5b3-dea1-4785-b6f6-f470ec56a606";

const lbl = {
  display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
  textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 7,
};

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
    <div className="sp-grid-halves">
      {/* Left — Suggestion form */}
      <div className="sp-card sp-card-pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="sp-card-head" style={{ padding: 0 }}>
          <div>
            <div className="sp-card-title">Something missing?</div>
            <div className="sp-card-sub">Have a question or idea? Reach out — we read everything</div>
          </div>
        </div>

        {sent ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 0", textAlign: "center" }}>
            <CheckCircle style={{ width: 40, height: 40, color: "var(--pos)" }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>Message sent!</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Thanks for the feedback — I'll look into it.</div>
            <button
              onClick={() => setSent(false)}
              style={{ marginTop: 4, fontSize: 13, color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <div style={{ fontSize: 13, color: "var(--neg)", background: "color-mix(in srgb, var(--neg) 10%, transparent)", borderRadius: "var(--r-sm)", padding: "10px 14px" }}>
                {error}
              </div>
            )}

            <div>
              <label style={lbl}>Your suggestion or report</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's missing, broken, or could be better…"
                rows={6}
                required
                style={{
                  width: "100%", padding: "10px 12px",
                  borderRadius: "var(--r-sm)", border: "1px solid var(--line)",
                  background: "var(--surface-2)", color: "var(--ink)", fontSize: 14,
                  resize: "vertical", outline: "none", fontFamily: "var(--body)",
                  boxSizing: "border-box", transition: "border-color var(--d1) var(--e)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="sp-btn sp-btn-primary"
                style={{ gap: 8, opacity: !message.trim() ? 0.5 : 1 }}
              >
                <Send size={15} />
                {sending ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Contact */}
        <div className="sp-card sp-card-pad">
          <div className="sp-card-head" style={{ padding: 0, marginBottom: 18 }}>
            <div className="sp-card-title">Contact</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: 14, background: "var(--brand)",
                display: "grid", placeItems: "center", flexShrink: 0,
                boxShadow: "0 4px 12px color-mix(in srgb, var(--brand) 30%, transparent)",
              }}
            >
              <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#f4efe6", lineHeight: 1 }}>S</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Spendly Support Team</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>
                We're here to help with any questions or issues you have.
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", background: "var(--surface-sunken)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <User style={{ width: 15, height: 15, color: "var(--ink-3)" }} />
              </div>
              <span style={{ fontSize: 14, color: "var(--ink)" }}>Bishnu</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", background: "var(--surface-sunken)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Mail style={{ width: 15, height: 15, color: "var(--ink-3)" }} />
              </div>
              <a
                href="mailto:bishnusaha59273@gmail.com"
                style={{ fontSize: 14, color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}
              >
                bishnusaha59273@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

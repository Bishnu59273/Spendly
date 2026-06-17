import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { useForgotPassword } from "../api/auth.js";

const inp = {
  width: "100%", height: 46, padding: "0 14px",
  borderRadius: "var(--r-sm)", border: "1px solid var(--line)",
  background: "var(--surface-2)", color: "var(--ink)", fontSize: 14.5, outline: "none",
  fontFamily: "var(--body)",
};
const lbl = {
  display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
  textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 7,
};

export default function ForgotPassword() {
  const forgot = useForgotPassword();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await forgot.mutateAsync({ email });
      setSent(true);
    } catch (err) {
      if (!navigator.onLine) {
        setError("You're offline. Check your connection and try again.");
      } else if (err.response?.status === 404) {
        setError("No Spendly account exists with this email. Double-check for typos, or create a new account.");
      } else if (err.response?.status === 429) {
        setError("Too many reset requests. Please wait a few hours before trying again.");
      } else if (err.response?.status === 502) {
        setError("We couldn't send the email right now. Please try again in a moment.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Brand mark */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: "var(--brand)",
            display: "grid", placeItems: "center", margin: "0 auto 16px",
            boxShadow: "0 4px 16px color-mix(in srgb, var(--brand) 30%, transparent)",
          }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#f4efe6", lineHeight: 1 }}>S</span>
          </div>
          <div className="sp-display" style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Forgot password?
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-3)" }}>
            Enter your email and we'll send you a reset link
          </div>
        </div>

        {/* Card */}
        <div className="sp-card sp-card-pad">
          {sent ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", margin: "0 auto 14px",
                background: "color-mix(in srgb, var(--brand) 12%, transparent)",
                display: "grid", placeItems: "center", color: "var(--brand)",
              }}>
                <MailCheck size={24} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
                Check your inbox
              </div>
              <p style={{ fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.6, margin: 0 }}>
                We've sent a password reset link to <strong style={{ color: "var(--ink)" }}>{email}</strong>.
                It expires in 1 hour. If it doesn't arrive within a few minutes, check your spam folder — Gmail sometimes delays mail from new domains.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={lbl}>Email</label>
                <input type="email" required autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }} style={inp} />
              </div>
              <button
                type="submit"
                disabled={forgot.isPending}
                className="sp-btn sp-btn-primary"
                style={{ width: "100%", height: 48, justifyContent: "center", fontSize: 15, marginTop: 4 }}
              >
                {forgot.isPending ? "Sending…" : "Send reset link"}
              </button>
              {error && (
                <div style={{ fontSize: 13, color: "var(--neg)", background: "color-mix(in srgb, var(--neg) 10%, transparent)", borderRadius: "var(--r-sm)", padding: "10px 14px", marginTop: 2 }}>
                  {error}
                </div>
              )}
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 13.5, color: "var(--ink-3)", marginTop: 20 }}>
          Remembered it?{" "}
          <Link to="/login" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

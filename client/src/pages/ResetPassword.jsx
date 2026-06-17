import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useResetPassword, useValidateResetToken } from "../api/auth.js";
import Spinner from "../components/Spinner.jsx";

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

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const reset = useResetPassword();
  const validation = useValidateResetToken(token);
  const tokenInvalid = !token || (validation.data && !validation.data.valid);

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }

    try {
      await reset.mutateAsync({ token, password: form.password });
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      if (!navigator.onLine) {
        setError("You're offline. Check your connection and try again.");
      } else if (err.response?.status === 400) {
        setError("This reset link is invalid or has expired. Please request a new one.");
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
            Set a new password
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-3)" }}>Choose a new password for your account</div>
        </div>

        {/* Card */}
        <div className="sp-card sp-card-pad">
          {done ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", margin: "0 auto 14px",
                background: "color-mix(in srgb, var(--brand) 12%, transparent)",
                display: "grid", placeItems: "center", color: "var(--brand)",
              }}>
                <CheckCircle2 size={24} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
                Password updated
              </div>
              <p style={{ fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.6, margin: "0 0 16px" }}>
                You can now sign in with your new password. Redirecting…
              </p>
              <Link to="/login" className="sp-btn sp-btn-primary" style={{ justifyContent: "center", fontSize: 14, textDecoration: "none" }}>
                Sign in now
              </Link>
            </div>
          ) : validation.isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
              <Spinner />
            </div>
          ) : tokenInvalid ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
                This link has expired
              </div>
              <p style={{ fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.6, margin: "0 0 16px" }}>
                Reset links work only once and expire after 1 hour.
                If you still need to change your password, request a new link.
              </p>
              <Link to="/forgot-password" className="sp-btn sp-btn-primary" style={{ justifyContent: "center", fontSize: 14, textDecoration: "none" }}>
                Request new link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={lbl}>New password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    style={{ ...inp, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--ink-3)", display: "grid", placeItems: "center", padding: 4,
                    }}
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={lbl}>Confirm password</label>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => set("confirm", e.target.value)}
                  style={{ ...inp, ...(error ? { borderColor: "var(--neg)" } : {}) }}
                />
              </div>
              <button
                type="submit"
                disabled={reset.isPending}
                className="sp-btn sp-btn-primary"
                style={{ width: "100%", height: 48, justifyContent: "center", fontSize: 15, marginTop: 4 }}
              >
                {reset.isPending ? "Updating…" : "Update password"}
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
          <Link to="/login" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

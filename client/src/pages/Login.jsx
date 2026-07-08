import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useLogin } from "../api/auth.js";
import Seo from "../components/Seo.jsx";

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

export default function Login() {
  const navigate = useNavigate();
  const login = useLogin();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login.mutateAsync(form);
      navigate("/dashboard");
    } catch (err) {
      if (!navigator.onLine) {
        setError("You're offline. Check your connection and try again.");
      } else if (err.response?.status === 401 || err.response?.status === 400) {
        setError("Invalid email or password.");
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
      <Seo
        path="/login"
        title="Log in to Spendly — Free Expense Tracker"
        description="Log in to your Spendly account to track expenses by salary cycle, manage budgets, and reach your savings goals."
      />
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
            Welcome back
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-3)" }}>Sign in to your Spendly account</div>
        </div>

        {/* Card */}
        <div className="sp-card sp-card-pad">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" required autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={lbl}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 12.5, color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  style={{ ...inp, paddingRight: 44, ...(error ? { borderColor: "var(--neg)" } : {}) }}
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
            <button
              type="submit"
              disabled={login.isPending}
              className="sp-btn sp-btn-primary"
              style={{ width: "100%", height: 48, justifyContent: "center", fontSize: 15, marginTop: 4 }}
            >
              {login.isPending ? "Signing in…" : "Sign in"}
            </button>
            {error && (
              <div style={{ fontSize: 13, color: "var(--neg)", background: "color-mix(in srgb, var(--neg) 10%, transparent)", borderRadius: "var(--r-sm)", padding: "10px 14px", marginTop: 2 }}>
                {error}
              </div>
            )}
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 13.5, color: "var(--ink-3)", marginTop: 20 }}>
          No account?{" "}
          <Link to="/register" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

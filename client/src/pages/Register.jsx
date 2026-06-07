import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useRegister } from "../api/auth.js";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD"];

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

export default function Register() {
  const navigate = useNavigate();
  const register = useRegister();
  const [form, setForm] = useState({
    name: "", email: "", password: "", salaryDay: 1, currency: "INR",
  });
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
      await register.mutateAsync({ ...form, salaryDay: parseInt(form.salaryDay) });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
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
            Create your account
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-3)" }}>Start tracking your spending in minutes</div>
        </div>

        {/* Card */}
        <div className="sp-card sp-card-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {error && (
            <div style={{ fontSize: 13, color: "var(--neg)", background: "color-mix(in srgb, var(--neg) 10%, transparent)", borderRadius: "var(--r-sm)", padding: "10px 14px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={lbl}>Full name</label>
              <input type="text" required autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" required autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Budget start day</label>
                <input
                  type="number" min="1" max="31" required
                  value={form.salaryDay}
                  onChange={(e) => set("salaryDay", e.target.value)}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Currency</label>
                <select value={form.currency} onChange={(e) => set("currency", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
              The day each month your budget cycle begins — e.g. 1 for the 1st, 25 if you get paid on the 25th.
            </div>

            <button
              type="submit"
              disabled={register.isPending}
              className="sp-btn sp-btn-primary"
              style={{ width: "100%", height: 48, justifyContent: "center", fontSize: 15, marginTop: 4 }}
            >
              {register.isPending ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 13.5, color: "var(--ink-3)", marginTop: 20 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

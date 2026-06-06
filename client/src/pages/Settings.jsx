import { useState } from "react";
import { Moon, Sun, Save, Wallet, X } from "lucide-react";
import { useUpdateProfile } from "../api/auth.js";
import { formatCurrency } from "../utils/format.js";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD"];

const inp = {
  width: "100%", height: 44, padding: "0 14px",
  borderRadius: "var(--r-sm)", border: "1px solid var(--line)",
  background: "var(--surface-2)", color: "var(--ink)", fontSize: 14, outline: "none",
};
const lbl = {
  display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
  textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 7,
};

export default function Settings({ user }) {
  const update = useUpdateProfile();
  const [form, setForm] = useState({
    name: user.name,
    salaryDay: user.salaryDay,
    currency: user.currency,
    monthlyBudget: user.monthlyBudget?.toString() || "",
  });
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await update.mutateAsync({
        name: form.name,
        salaryDay: parseInt(form.salaryDay),
        currency: form.currency,
        monthlyBudget: form.monthlyBudget ? parseFloat(form.monthlyBudget) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" }}>
      {/* Left — Profile form */}
      <form onSubmit={handleSubmit} className="sp-card sp-card-pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="sp-card-head" style={{ padding: 0 }}>
          <div>
            <div className="sp-card-title">Profile</div>
            <div className="sp-card-sub">Update your name, cycle day, currency, and budget</div>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 13, color: "var(--neg)", background: "color-mix(in srgb, var(--neg) 10%, transparent)", borderRadius: "var(--r-sm)", padding: "10px 14px" }}>
            {error}
          </div>
        )}

        <div>
          <label style={lbl}>Name</label>
          <input type="text" required value={form.name} onChange={(e) => set("name", e.target.value)} style={inp} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={lbl}>Budget Start Day</label>
            <input
              type="number" min="1" max="31" required
              value={form.salaryDay}
              onChange={(e) => set("salaryDay", e.target.value)}
              style={inp}
            />
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>Day 1–31. Auto-caps if the month is shorter.</div>
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

        <div>
          <label style={lbl}>Monthly Budget</label>
          <div style={{ position: "relative" }}>
            <Wallet size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", pointerEvents: "none" }} />
            <input
              type="number" min="0" step="1"
              value={form.monthlyBudget}
              onChange={(e) => set("monthlyBudget", e.target.value)}
              placeholder="e.g. 30000"
              style={{ ...inp, paddingLeft: 40, paddingRight: form.monthlyBudget ? 40 : 14 }}
            />
            {form.monthlyBudget && (
              <button
                type="button"
                onClick={() => set("monthlyBudget", "")}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", display: "grid", placeItems: "center" }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>
            Your total spending limit per cycle. Shows as "Remaining Budget" on the dashboard.
            {user.monthlyBudget && (
              <span style={{ marginLeft: 6, color: "var(--brand)", fontWeight: 600 }}>
                Current: {formatCurrency(user.monthlyBudget, form.currency)}
              </span>
            )}
          </div>
        </div>

        {form.monthlyBudget && (
          <div style={{ borderRadius: "var(--r-sm)", background: "var(--brand-soft)", padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--brand)", fontWeight: 500 }}>Monthly Budget</span>
            <span className="sp-num" style={{ fontSize: 18, fontWeight: 700, color: "var(--brand)" }}>
              {formatCurrency(parseFloat(form.monthlyBudget) || 0, form.currency)}
            </span>
          </div>
        )}

        <div>
          <button type="submit" disabled={update.isPending} className="sp-btn sp-btn-primary" style={{ gap: 8 }}>
            <Save size={15} />
            {saved ? "Saved!" : update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Appearance */}
        <div className="sp-card sp-card-pad">
          <div className="sp-card-head" style={{ padding: 0, marginBottom: 18 }}>
            <div className="sp-card-title">Appearance</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Dark mode</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>Switch between light and dark theme</div>
            </div>
            <button
              type="button"
              onClick={toggleDark}
              style={{
                position: "relative", width: 52, height: 30, borderRadius: 99, border: "none", cursor: "pointer",
                background: darkMode ? "var(--brand)" : "var(--line)",
                transition: "background var(--d1) var(--e)", flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute", top: 3, left: darkMode ? 25 : 3,
                width: 24, height: 24, borderRadius: "50%", background: "var(--surface)",
                display: "grid", placeItems: "center",
                transition: "left var(--d1) var(--e)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
              }}>
                {darkMode
                  ? <Moon size={11} style={{ color: "var(--brand)" }} />
                  : <Sun size={11} style={{ color: "#f59e0b" }} />}
              </span>
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="sp-card sp-card-pad">
          <div className="sp-card-head" style={{ padding: 0, marginBottom: 18 }}>
            <div className="sp-card-title">Account</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="sp-avatar" style={{ width: 48, height: 48, fontSize: 18, flexShrink: 0 }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{user.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>{user.email}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

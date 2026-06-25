import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMe } from "../api/auth.js";

const features = [
  {
    icon: "📅",
    title: "Budget by your payday",
    desc: "Your cycle resets on the day YOU get paid — not the 1st of the month. Finally, a budget that matches real life.",
  },
  {
    icon: "📊",
    title: "Visual spending insights",
    desc: "Donut charts, daily trends, and category breakdowns give you an instant picture of where your money goes.",
  },
  {
    icon: "🎯",
    title: "Savings goals",
    desc: "Set a savings target, watch the ring fill up each cycle, and celebrate when you hit it.",
  },
  {
    icon: "🏷️",
    title: "Categories & tags",
    desc: "Organise every expense your way. Create custom categories and tags that map to your actual spending habits.",
  },
  {
    icon: "🌍",
    title: "Multi-currency",
    desc: "Pick your currency on signup — ₹, $, €, £ and more are all supported out of the box.",
  },
  {
    icon: "📱",
    title: "Installable PWA",
    desc: "Add Spendly to your home screen. Works offline. No App Store, no Play Store, no waiting.",
  },
];

const steps = [
  { n: "1", title: "Set your payday", desc: "Tell Spendly the day your salary lands. That becomes day one of your budget cycle." },
  { n: "2", title: "Log your expenses", desc: "Add expenses in seconds — pick a category, enter an amount, done." },
  { n: "3", title: "See where you stand", desc: "Your dashboard shows remaining budget, top categories, and daily trend at a glance." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && user) navigate("/dashboard", { replace: true });
  }, [user, isLoading, navigate]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--sans)", color: "var(--ink)" }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "color-mix(in srgb, var(--bg) 85%, transparent)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--line)",
        padding: "0 24px",
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: 1100, margin: "0 auto", width: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: "var(--brand)",
            display: "grid", placeItems: "center",
            boxShadow: "0 2px 8px color-mix(in srgb, var(--brand) 35%, transparent)",
          }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#f4efe6", lineHeight: 1 }}>S</span>
          </div>
          <span style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>Spendly</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)", textDecoration: "none", padding: "8px 14px" }}>
            Sign in
          </Link>
          <Link to="/register" className="sp-btn sp-btn-primary" style={{ fontSize: 14, height: 38, padding: "0 18px" }}>
            Get started free
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* ── Hero ── */}
        <section
          aria-label="Hero"
          style={{ padding: "96px 0 80px", textAlign: "center" }}
        >
          <div style={{
            display: "inline-block", background: "var(--brand-soft)",
            color: "var(--brand)", borderRadius: "var(--r-pill)",
            padding: "6px 16px", fontSize: 13, fontWeight: 600,
            marginBottom: 24, letterSpacing: "0.01em",
          }}>
            Free · No subscription · No credit card
          </div>
          <h1
            className="sp-display"
            style={{
              fontSize: "clamp(38px, 6vw, 68px)", fontWeight: 800,
              letterSpacing: "-0.04em", lineHeight: 1.08,
              color: "var(--ink)", marginBottom: 22, maxWidth: 780, margin: "0 auto 22px",
            }}
          >
            Track every rupee.{" "}
            <span style={{ color: "var(--brand)" }}>Hit every goal.</span>
          </h1>
          <p style={{
            fontSize: "clamp(16px, 2vw, 20px)", color: "var(--ink-2)", lineHeight: 1.6,
            maxWidth: 560, margin: "0 auto 40px",
          }}>
            Spendly budgets by your <strong>salary cycle</strong> — not the calendar month.
            See exactly where your money goes and reach your savings goals faster.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/register"
              className="sp-btn sp-btn-primary"
              style={{ fontSize: 16, height: 52, padding: "0 32px", borderRadius: "var(--r-md)" }}
            >
              Start for free
            </Link>
            <Link
              to="/login"
              className="sp-btn"
              style={{
                fontSize: 16, height: 52, padding: "0 32px", borderRadius: "var(--r-md)",
                background: "var(--surface)", border: "1px solid var(--line)", color: "var(--ink)",
              }}
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* ── Dashboard preview card ── */}
        <section aria-label="App preview" style={{ marginBottom: 96 }}>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--sh-lg)",
            overflow: "hidden",
            padding: 32,
          }}>
            {/* Fake dashboard top bar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--neg-soft)" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--warn-soft)" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--pos-soft)" }} />
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--surface-sunken)", marginLeft: 8 }} />
            </div>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Budget remaining", value: "₹18,400", color: "var(--pos)" },
                { label: "Spent this cycle", value: "₹11,600", color: "var(--neg)" },
                { label: "Savings goal", value: "68%", color: "var(--brand)" },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "var(--surface-2)", borderRadius: "var(--r-md)",
                  padding: "16px 20px", border: "1px solid var(--line)",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--display)", color: s.color, letterSpacing: "-0.03em" }}>{s.value}</div>
                </div>
              ))}
            </div>
            {/* Category bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { name: "Food & Dining", pct: 72, color: "var(--cat-2)" },
                { name: "Transport", pct: 45, color: "var(--cat-4)" },
                { name: "Entertainment", pct: 28, color: "var(--cat-5)" },
                { name: "Utilities", pct: 18, color: "var(--cat-3)" },
              ].map((c) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 120, fontSize: 13, color: "var(--ink-2)", flexShrink: 0 }}>{c.name}</div>
                  <div style={{ flex: 1, height: 8, background: "var(--surface-sunken)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${c.pct}%`, height: "100%", background: c.color, borderRadius: 4, transition: "width 1s var(--e)" }} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", width: 32, textAlign: "right" }}>{c.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features grid ── */}
        <section aria-labelledby="features-heading" style={{ marginBottom: 96 }}>
          <h2
            id="features-heading"
            className="sp-display"
            style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 12 }}
          >
            Everything you need. Nothing you don't.
          </h2>
          <p style={{ textAlign: "center", color: "var(--ink-2)", fontSize: 16, marginBottom: 48 }}>
            Built for people who want clarity over complexity.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {features.map((f) => (
              <article key={f.title} style={{
                background: "var(--surface)", border: "1px solid var(--line)",
                borderRadius: "var(--r-lg)", padding: "24px 24px 28px",
                boxShadow: "var(--sh-sm)",
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--ink)" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section aria-labelledby="how-heading" style={{ marginBottom: 96 }}>
          <h2
            id="how-heading"
            className="sp-display"
            style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 56 }}
          >
            Up and running in 3 steps
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32, position: "relative" }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ textAlign: "center" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: i === 0 ? "var(--brand)" : "var(--brand-soft)",
                  color: i === 0 ? "var(--on-brand)" : "var(--brand)",
                  display: "grid", placeItems: "center", margin: "0 auto 18px",
                  fontSize: 20, fontWeight: 800, fontFamily: "var(--display)",
                  boxShadow: i === 0 ? "0 4px 16px color-mix(in srgb, var(--brand) 30%, transparent)" : "none",
                }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section
          aria-label="Call to action"
          style={{
            background: "var(--brand)", borderRadius: "var(--r-xl)",
            padding: "64px 32px", textAlign: "center", marginBottom: 80,
            boxShadow: "0 8px 40px color-mix(in srgb, var(--brand) 30%, transparent)",
          }}
        >
          <h2
            className="sp-display"
            style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--on-brand)", marginBottom: 14 }}
          >
            Take control of your spending today.
          </h2>
          <p style={{ fontSize: 16, color: "color-mix(in srgb, var(--on-brand) 75%, transparent)", marginBottom: 36 }}>
            Free forever. No hidden fees. Your data stays yours.
          </p>
          <Link
            to="/register"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              height: 52, padding: "0 36px", borderRadius: "var(--r-md)",
              background: "var(--on-brand)", color: "var(--brand)",
              fontSize: 16, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}
          >
            Create your free account
          </Link>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid var(--line)", padding: "28px 24px",
        textAlign: "center", fontSize: 13, color: "var(--ink-3)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span>© {new Date().getFullYear()} Spendly. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link to="/login" style={{ color: "var(--ink-3)", textDecoration: "none" }}>Sign in</Link>
            <Link to="/register" style={{ color: "var(--ink-3)", textDecoration: "none" }}>Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

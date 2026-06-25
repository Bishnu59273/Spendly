import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays, PieChart, Target,
  UtensilsCrossed, Car, Banknote, ShoppingBag,
  Quote, Star, ArrowRight, CheckCircle2,
} from "lucide-react";
import { useMe } from "../api/auth.js";
import { useTestimonials } from "../api/feedback.js";

// Direction B — WARM palette tokens
const green      = "oklch(0.6 0.12 150)";
const greenDark  = "oklch(0.48 0.12 150)";
const greenSoft  = "oklch(0.93 0.04 150)";
const amber      = "oklch(0.68 0.13 40)";
const amberSoft  = "oklch(0.93 0.05 40)";
const gold       = "oklch(0.75 0.1 80)";
const goldSoft   = "oklch(0.93 0.04 80)";
const bg         = "#faf4ea";
const surface    = "#ffffff";
const dark       = "#2c2620";
const textMid    = "#6b6256";
const textMuted  = "#a3917a";
const border     = "#ece2d2";

const AVATAR_COLORS = [green, amber, gold];

const FEATURES = [
  {
    Icon: CalendarDays,
    iconBg: greenSoft,
    iconColor: green,
    title: "Budget by payday",
    desc: "Your month starts when you get paid — so the budget actually matches real life.",
  },
  {
    Icon: PieChart,
    iconBg: amberSoft,
    iconColor: amber,
    title: "See it all clearly",
    desc: "Friendly charts turn a messy month into one calm, colourful picture.",
  },
  {
    Icon: Target,
    iconBg: goldSoft,
    iconColor: gold,
    title: "Reach your goals",
    desc: "Set a target and we'll nudge you toward it, one cycle at a time.",
  },
];

const STEPS = [
  { n: "01", color: green, title: "Set your payday", desc: "Your cycle is built around the day money lands in your account." },
  { n: "02", color: amber, title: "Add what you spend", desc: "A few taps and it's logged, sorted, and on the chart." },
  { n: "03", color: gold,  title: "Feel in control",   desc: "Open the app and instantly know exactly where you stand." },
];

const TRANSACTIONS = [
  { Icon: UtensilsCrossed, iconBg: greenSoft,  label: "Swiggy",  sub: "Food",      amt: "−₹420",    amtColor: dark },
  { Icon: Car,             iconBg: goldSoft,   label: "Uber",    sub: "Transport", amt: "−₹230",    amtColor: dark },
  { Icon: Banknote,        iconBg: "oklch(0.93 0.05 230)", label: "Salary",  sub: "Income",    amt: "+₹60,000", amtColor: green },
  { Icon: ShoppingBag,     iconBg: amberSoft,  label: "Amazon",  sub: "Shopping",  amt: "−₹1,299",  amtColor: dark },
];

// Pill badge used in several places
function Pill({ children, style }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: surface, border: `1px solid ${border}`,
      color: "oklch(0.5 0.1 60)", fontWeight: 700, fontSize: 13,
      padding: "8px 14px", borderRadius: 100, ...style,
    }}>
      {children}
    </div>
  );
}

function TestimonialCard({ text, name, initials, stars, color }) {
  return (
    <div style={{ background: surface, borderRadius: 22, padding: 26 }}>
      <Quote size={18} color={color} style={{ marginBottom: 10 }} />
      <p style={{ fontSize: 15, lineHeight: 1.65, margin: "0 0 18px", color: dark }}>{text}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: color, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 13, fontFamily: "var(--display)", flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: dark }}>{name}</div>
          <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} size={11} fill={amber} color={amber} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { data: user, isLoading: authLoading } = useMe();
  const { data: testimonials = [] } = useTestimonials();

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "var(--sans)", color: dark }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: `color-mix(in srgb, ${bg} 88%, transparent)`,
        backdropFilter: "blur(14px)",
        padding: "0 40px",
      }}>
        <div style={{
          maxWidth: 1160, margin: "0 auto",
          height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em" }}>
            <span style={{
              width: 13, height: 13, borderRadius: "50%", background: green, display: "inline-block",
              boxShadow: `0 0 0 4px color-mix(in srgb, ${green} 18%, transparent)`,
            }} />
            Spendly
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 15, fontWeight: 600, color: textMid }}>
            <a href="#features" style={{ color: "inherit", textDecoration: "none" }}>Features</a>
            <a href="#how-it-works" style={{ color: "inherit", textDecoration: "none" }}>How it works</a>
            <a href="#reviews" style={{ color: "inherit", textDecoration: "none" }}>Reviews</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link to="/login" style={{ fontSize: 15, fontWeight: 600, color: dark, textDecoration: "none" }}>Log in</Link>
            <Link to="/register" style={{
              background: dark, color: bg, fontWeight: 700, fontSize: 15,
              padding: "11px 22px", borderRadius: 100, textDecoration: "none",
            }}>
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 40px" }}>

        {/* ── Hero ── */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 44, alignItems: "center", padding: "68px 0 60px" }}>
          <div>
            <Pill>🌱 Free, friendly, no spreadsheets</Pill>

            <h1 style={{
              fontFamily: "var(--display)", fontWeight: 800,
              fontSize: "clamp(42px, 5.5vw, 62px)", lineHeight: 1.02,
              letterSpacing: "-0.03em", margin: "22px 0 0",
            }}>
              Money that finally{" "}
              <span style={{ color: green }}>makes sense</span>.
            </h1>

            <p style={{ fontSize: "clamp(16px, 1.8vw, 18.5px)", lineHeight: 1.65, color: textMid, margin: "22px 0 0", maxWidth: 460 }}>
              See where every rupee goes, budgeted around{" "}
              <strong style={{ color: dark, fontWeight: 700 }}>your payday</strong>.
              No jargon, no guilt — just a calm picture of your spending.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
              <Link to="/register" style={{
                background: green, color: "#fff", fontWeight: 700, fontSize: 16,
                padding: "16px 28px", borderRadius: 100, textDecoration: "none",
                boxShadow: `0 10px 24px color-mix(in srgb, ${green} 32%, transparent)`,
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                Start tracking free <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" style={{
                color: dark, fontWeight: 700, fontSize: 16, textDecoration: "none",
                padding: "15px 4px", borderBottom: `2px solid ${dark}`,
                display: "inline-flex", alignItems: "center",
              }}>
                See how it works
              </a>
            </div>

            {/* Social proof */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 32 }}>
              <div style={{ display: "flex" }}>
                {AVATAR_COLORS.map((c, i) => (
                  <div key={i} style={{
                    width: 30, height: 30, borderRadius: "50%", background: c,
                    border: `2.5px solid ${bg}`, marginLeft: i > 0 ? -9 : 0,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 14, color: textMid, fontWeight: 600 }}>
                Loved by 12,000+ savers · ★ 4.8
              </span>
            </div>
          </div>

          {/* Phone mockup */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              width: 300, background: surface, borderRadius: 42, padding: 14,
              boxShadow: `0 30px 60px rgba(60,40,20,0.16), inset 0 0 0 1px ${border}`,
            }}>
              <div style={{ background: "oklch(0.98 0.012 95)", borderRadius: 32, overflow: "hidden", height: 548 }}>
                {/* notch */}
                <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 90, height: 6, borderRadius: 6, background: border }} />
                </div>
                <div style={{ padding: "4px 22px 0" }}>
                  <div style={{ fontSize: 12, color: textMuted, fontWeight: 700 }}>This cycle · resets in 18 days</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
                    <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em" }}>₹18,200</span>
                    <span style={{ fontSize: 13, color: textMuted, fontWeight: 600 }}>left to spend</span>
                  </div>
                  {/* Donut */}
                  <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 10px" }}>
                    <div style={{
                      width: 168, height: 168, borderRadius: "50%",
                      background: `conic-gradient(${green} 0 32%, ${amber} 32% 60%, ${gold} 60% 76%, oklch(0.72 0.09 230) 76% 90%, oklch(0.88 0.04 150) 90% 100%)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{
                        width: 108, height: 108, borderRadius: "50%",
                        background: "oklch(0.98 0.012 95)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontSize: 11, color: textMuted, fontWeight: 700 }}>spent</span>
                        <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 20 }}>₹42,180</span>
                      </div>
                    </div>
                  </div>
                  {/* Legend */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    {[
                      { color: green, label: "Food & dining", val: "₹13.5k" },
                      { color: amber, label: "Rent",          val: "₹11.8k" },
                      { color: gold,  label: "Transport",     val: "₹6.7k"  },
                      { color: "oklch(0.72 0.09 230)", label: "Shopping", val: "₹5.9k" },
                    ].map((l) => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, color: "#4a4338", fontWeight: 700 }}>{l.label}</span>
                        <span style={{ color: textMuted, fontWeight: 700 }}>{l.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" style={{ paddingBottom: 72 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {FEATURES.map(({ Icon, iconBg, iconColor, title, desc }) => (
              <article key={title} style={{ background: surface, borderRadius: 22, padding: "28px 28px 32px" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", background: iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={21} color={iconColor} strokeWidth={2} />
                </div>
                <h3 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 20, margin: "18px 0 8px", color: dark }}>{title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: textMid, margin: 0 }}>{desc}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* ── App preview band (full-width dark) ── */}
      <section style={{ background: dark, padding: "64px 40px", margin: "0 0 0 0" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 44px" }}>
            <h2 style={{
              fontFamily: "var(--display)", fontWeight: 800, fontSize: "clamp(26px, 3.5vw, 36px)",
              letterSpacing: "-0.02em", margin: 0, color: bg,
            }}>
              A peek inside the app
            </h2>
            <p style={{ fontSize: 16, color: textMuted, margin: "12px 0 0" }}>Warm, simple, and genuinely nice to open.</p>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            {/* Phone 1 — expenses list */}
            <div style={{ width: 248, background: "#000", borderRadius: 36, padding: 10, flexShrink: 0 }}>
              <div style={{ background: "oklch(0.98 0.012 95)", borderRadius: 28, height: 460, padding: "18px 16px", overflow: "hidden" }}>
                <div style={{ fontSize: 11, color: textMuted, fontWeight: 700 }}>Day 12 of 30</div>
                <div style={{ height: 7, borderRadius: 7, background: border, margin: "8px 0 16px", overflow: "hidden" }}>
                  <div style={{ width: "40%", height: "100%", background: green, borderRadius: 7 }} />
                </div>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, marginBottom: 10, color: dark }}>Recent</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {TRANSACTIONS.map(({ Icon, iconBg, label, sub, amt, amtColor }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={14} color={dark} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: dark }}>{label}</div>
                        <div style={{ fontSize: 11, color: textMuted }}>{sub}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: amtColor }}>{amt}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Phone 2 — dashboard overview */}
            <div style={{ width: 248, background: "#000", borderRadius: 36, padding: 10, flexShrink: 0 }}>
              <div style={{ background: "oklch(0.98 0.012 95)", borderRadius: 28, height: 460, padding: "18px 16px", overflow: "hidden" }}>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, marginBottom: 14, color: dark }}>This cycle</div>
                <div style={{ background: surface, borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: textMuted, fontWeight: 700, marginBottom: 4 }}>Budget left</div>
                  <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 24, color: green, letterSpacing: "-0.02em" }}>₹18,200</div>
                  <div style={{ height: 6, borderRadius: 6, background: border, marginTop: 10, overflow: "hidden" }}>
                    <div style={{ width: "30%", height: "100%", background: green, borderRadius: 6 }} />
                  </div>
                </div>
                {[
                  { label: "Food & dining", pct: 72, color: green },
                  { label: "Transport",     pct: 45, color: amber },
                  { label: "Shopping",      pct: 28, color: gold  },
                ].map((c) => (
                  <div key={c.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: textMid, marginBottom: 4 }}>
                      <span>{c.label}</span><span>{c.pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 6, background: border, overflow: "hidden" }}>
                      <div style={{ width: `${c.pct}%`, height: "100%", background: c.color, borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone 3 — savings goal */}
            <div style={{ width: 248, background: "#000", borderRadius: 36, padding: 10, flexShrink: 0 }}>
              <div style={{ background: "oklch(0.98 0.012 95)", borderRadius: 28, height: 460, padding: "20px 18px", overflow: "hidden" }}>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, color: dark, marginBottom: 4 }}>Goals</div>
                <div style={{ display: "flex", justifyContent: "center", margin: "22px 0" }}>
                  <div style={{
                    width: 148, height: 148, borderRadius: "50%",
                    background: `conic-gradient(${green} 0 67%, ${border} 67% 100%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      width: 112, height: 112, borderRadius: "50%",
                      background: "oklch(0.98 0.012 95)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    }}>
                      <Target size={18} color={green} strokeWidth={2} />
                      <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 21, color: dark }}>67%</span>
                    </div>
                  </div>
                </div>
                <div style={{ background: bg, borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: textMuted, fontWeight: 700 }}>Goa trip</span>
                    <span style={{ fontWeight: 800, color: dark }}>₹40k / ₹60k</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 7, background: border, marginTop: 10, overflow: "hidden" }}>
                    <div style={{ width: "67%", height: "100%", background: green, borderRadius: 7 }} />
                  </div>
                </div>
                <div style={{ textAlign: "center", fontSize: 12, color: textMuted, marginTop: 14, fontWeight: 600 }}>
                  Set aside ₹6,600 / cycle
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 40px" }}>

        {/* ── How it works ── */}
        <section id="how-it-works" style={{ padding: "80px 0 72px" }}>
          <h2 style={{
            fontFamily: "var(--display)", fontWeight: 800,
            fontSize: "clamp(26px, 3.5vw, 36px)", letterSpacing: "-0.02em",
            textAlign: "center", margin: "0 0 48px",
          }}>
            Three little steps
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {STEPS.map(({ n, color, title, desc }) => (
              <div key={n} style={{ background: surface, borderRadius: 22, padding: 28 }}>
                <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 34, color, lineHeight: 1 }}>{n}</div>
                <h3 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 19, margin: "10px 0 6px", color: dark }}>{title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: textMid, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ── */}
        {testimonials.length > 0 && (
          <section id="reviews" style={{ paddingBottom: 72 }}>
            <h2 style={{
              fontFamily: "var(--display)", fontWeight: 800,
              fontSize: "clamp(26px, 3.5vw, 36px)", letterSpacing: "-0.02em",
              textAlign: "center", margin: "0 0 40px",
            }}>
              What people are saying
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              {testimonials.map((t, i) => (
                <TestimonialCard key={i} {...t} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
              ))}
            </div>
          </section>
        )}

        {/* ── Final CTA ── */}
        <section style={{
          background: green, borderRadius: 28,
          padding: "60px 40px", textAlign: "center",
          margin: "0 0 32px",
          boxShadow: `0 10px 40px color-mix(in srgb, ${green} 30%, transparent)`,
        }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>🌿</div>
          <h2 style={{
            fontFamily: "var(--display)", fontWeight: 800,
            fontSize: "clamp(24px, 3.5vw, 38px)", letterSpacing: "-0.02em",
            margin: 0, color: "#fff",
          }}>
            Ready to feel good about money?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", margin: "14px 0 32px" }}>
            Free forever. No credit card. No guilt.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
            <Link to="/register" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: dark, color: "#fff", fontWeight: 700, fontSize: 16,
              padding: "16px 32px", borderRadius: 100, textDecoration: "none",
            }}>
              Start tracking free <ArrowRight size={16} />
            </Link>
            <Link to="/login" style={{
              display: "inline-flex", alignItems: "center",
              background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, fontSize: 16,
              padding: "16px 28px", borderRadius: 100, textDecoration: "none",
              border: "1.5px solid rgba(255,255,255,0.3)",
            }}>
              Already have an account
            </Link>
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {["No credit card required", "Free forever", "Works offline"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                <CheckCircle2 size={14} color="rgba(255,255,255,0.8)" />
                {t}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: "28px 40px" }}>
        <div style={{
          maxWidth: 1160, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 16, color: dark }}>Spendly</span>
          <span style={{ fontSize: 13, color: textMuted }}>© {new Date().getFullYear()} · Made for people with paydays</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link to="/login"    style={{ fontSize: 13, color: textMuted, textDecoration: "none" }}>Sign in</Link>
            <Link to="/register" style={{ fontSize: 13, color: textMuted, textDecoration: "none" }}>Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

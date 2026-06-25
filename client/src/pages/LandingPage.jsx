import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  PieChart,
  Target,
  UtensilsCrossed,
  Car,
  Banknote,
  ShoppingBag,
  Quote,
  Star,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMe } from "../api/auth.js";
import { useTestimonials } from "../api/feedback.js";

// Direction B — WARM palette tokens
const green = "oklch(0.6 0.12 150)";
const greenSoft = "oklch(0.93 0.04 150)";
const amber = "oklch(0.68 0.13 40)";
const amberSoft = "oklch(0.93 0.05 40)";
const gold = "oklch(0.75 0.1 80)";
const goldSoft = "oklch(0.93 0.04 80)";
const bg = "#faf4ea";
const surface = "#ffffff";
const dark = "#2c2620";
const textMid = "#6b6256";
const textMuted = "#a3917a";
const border = "#ece2d2";

const AVATAR_COLORS = [green, amber, gold];

// Real app screenshots — drop PNG files into client/public/screenshots/
// Set to null to fall back to the CSS mockup for that slot
const SCREENSHOTS = {
  hero: "/dashboard.jpeg",
  expenses: "/expense.jpeg",
  overview: "/categories.jpeg",
  goals: "/goals.jpeg",
};

function PhoneFrame({ screenshot, children, height = 440, width = 232 }) {
  return (
    <div
      className="lp-phone-card"
      style={{
        width,
        background: "#1a1a1a",
        borderRadius: 34,
        padding: 9,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          borderRadius: 27,
          height,
          overflow: "hidden",
          background: "oklch(0.98 0.012 95)",
          position: "relative",
        }}
      >
        {screenshot ? (
          <img
            src={screenshot}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
              display: "block",
            }}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

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
  {
    n: "01",
    color: green,
    title: "Set your payday",
    desc: "Your cycle is built around the day money lands in your account.",
  },
  {
    n: "02",
    color: amber,
    title: "Add what you spend",
    desc: "A few taps and it's logged, sorted, and on the chart.",
  },
  {
    n: "03",
    color: gold,
    title: "Feel in control",
    desc: "Open the app and instantly know exactly where you stand.",
  },
];

const TRANSACTIONS = [
  {
    Icon: UtensilsCrossed,
    iconBg: greenSoft,
    label: "Swiggy",
    sub: "Food",
    amt: "−₹420",
    amtColor: dark,
  },
  {
    Icon: Car,
    iconBg: goldSoft,
    label: "Uber",
    sub: "Transport",
    amt: "−₹230",
    amtColor: dark,
  },
  {
    Icon: Banknote,
    iconBg: "oklch(0.93 0.05 230)",
    label: "Salary",
    sub: "Income",
    amt: "+₹60,000",
    amtColor: green,
  },
  {
    Icon: ShoppingBag,
    iconBg: amberSoft,
    label: "Amazon",
    sub: "Shopping",
    amt: "−₹1,299",
    amtColor: dark,
  },
];

function useWindowWidth() {
  const [w, setW] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return w;
}

function Pill({ children }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: surface,
        border: `1px solid ${border}`,
        color: "oklch(0.5 0.1 60)",
        fontWeight: 700,
        fontSize: 13,
        padding: "8px 14px",
        borderRadius: 100,
      }}
    >
      {children}
    </div>
  );
}

function TestimonialCard({ text, name, initials, stars, color }) {
  return (
    <div
      style={{
        background: surface,
        borderRadius: 22,
        padding: 26,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <Quote
        size={18}
        color={color}
        style={{ marginBottom: 10, flexShrink: 0 }}
      />
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.65,
          margin: "0 0 18px",
          color: dark,
          flex: 1,
        }}
      >
        {text}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          marginTop: "auto",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: color,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
            fontFamily: "var(--display)",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: dark,
              lineHeight: 1.3,
            }}
          >
            {name}
          </div>
          <div style={{ display: "flex", gap: 2, marginTop: 3 }}>
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} size={11} fill={amber} color={amber} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialsCarousel({ testimonials, visible }) {
  const [index, setIndex] = useState(0);
  const total = testimonials.length;
  const maxIndex = Math.max(0, total - visible);

  // Reset index when visible count changes (e.g. resize)
  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(
    () => setIndex((i) => Math.min(maxIndex, i + 1)),
    [maxIndex],
  );

  useEffect(() => {
    if (total <= visible) return;
    const id = setInterval(
      () => setIndex((i) => (i >= maxIndex ? 0 : i + 1)),
      4000,
    );
    return () => clearInterval(id);
  }, [total, visible, maxIndex]);

  const gap = 20;
  const cardW = `calc((100% - ${gap * (visible - 1)}px) / ${visible})`;
  const slideAmt = `calc(${cardW} + ${gap}px)`;

  return (
    <div>
      <div style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            gap,
            transform: `translateX(calc(-${index} * (${slideAmt})))`,
            transition: "transform 0.4s cubic-bezier(0.32,0.72,0.24,1)",
            alignItems: "stretch",
          }}
        >
          {testimonials.map((t, i) => (
            <div
              key={i}
              style={{ minWidth: cardW, maxWidth: cardW, flexShrink: 0 }}
            >
              <TestimonialCard
                {...t}
                color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginTop: 28,
        }}
      >
        <button
          onClick={prev}
          disabled={index === 0}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: `1.5px solid ${border}`,
            background: surface,
            cursor: index === 0 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: index === 0 ? 0.35 : 1,
            transition: "opacity 0.2s",
          }}
        >
          <ChevronLeft size={18} color={dark} />
        </button>

        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: i === index ? 20 : 8,
                height: 8,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                padding: 0,
                background: i === index ? green : border,
                transition: "all 0.3s cubic-bezier(0.32,0.72,0.24,1)",
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={index === maxIndex}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: `1.5px solid ${border}`,
            background: surface,
            cursor: index === maxIndex ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: index === maxIndex ? 0.35 : 1,
            transition: "opacity 0.2s",
          }}
        >
          <ChevronRight size={18} color={dark} />
        </button>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { data: user, isLoading: authLoading } = useMe();
  const { data: testimonials = [] } = useTestimonials();
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const carouselVisible = isMobile ? 1 : isTablet ? 2 : 3;

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  const px = isMobile ? "0 20px" : "0 40px";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        fontFamily: "var(--sans)",
        color: dark,
      }}
    >
      <style>{`
        .lp-nav-links { display: flex; }
        .lp-hero { display: grid; grid-template-columns: 1fr 0.9fr; gap: 44px; align-items: center; padding: 68px 0 60px; }
        .lp-phone-hero { display: flex; justify-content: center; }
        .lp-phones { display: flex; justify-content: center; gap: 24px; flex-wrap: nowrap; }
        .lp-phone-card { flex-shrink: 0; }
        .lp-cta-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 24px; }
        .lp-footer-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        @media (max-width: 767px) {
          .lp-nav-links { display: none !important; }
          .lp-hero { grid-template-columns: 1fr !important; padding: 40px 0 36px !important; gap: 36px !important; }
          .lp-phone-hero { display: none !important; }
          .lp-phones { gap: 12px; overflow-x: auto; justify-content: flex-start; padding-bottom: 8px; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .lp-phones::-webkit-scrollbar { display: none; }
          .lp-phone-card { flex-shrink: 0; }
          .lp-cta-buttons { flex-direction: column; align-items: center; }
          .lp-cta-buttons a { width: 100%; max-width: 320px; justify-content: center; }
          .lp-footer-inner { flex-direction: column; text-align: center; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .lp-hero { grid-template-columns: 1fr 1fr !important; padding: 52px 0 48px !important; }
          .lp-phones { gap: 16px; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: `color-mix(in srgb, ${bg} 88%, transparent)`,
          backdropFilter: "blur(14px)",
          padding: isMobile ? "0 20px" : "0 40px",
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            height: isMobile ? 56 : 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontFamily: "var(--display)",
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: "-0.02em",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: green,
                display: "inline-block",
                boxShadow: `0 0 0 4px color-mix(in srgb, ${green} 18%, transparent)`,
              }}
            />
            Spendly
          </div>

          <div
            className="lp-nav-links"
            style={{
              alignItems: "center",
              gap: 32,
              fontSize: 15,
              fontWeight: 600,
              color: textMid,
            }}
          >
            <a
              href="#features"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              How it works
            </a>
            <a
              href="#reviews"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Reviews
            </a>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 8 : 14,
            }}
          >
            <Link
              to="/login"
              style={{
                fontSize: isMobile ? 14 : 15,
                fontWeight: 600,
                color: dark,
                textDecoration: "none",
              }}
            >
              Log in
            </Link>
            <Link
              to="/register"
              style={{
                background: dark,
                color: bg,
                fontWeight: 700,
                fontSize: isMobile ? 13 : 15,
                padding: isMobile ? "9px 16px" : "11px 22px",
                borderRadius: 100,
                textDecoration: "none",
              }}
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: px }}>
        {/* ── Hero ── */}
        <section className="lp-hero">
          <div>
            <Pill>🌱 Free, friendly, no spreadsheets</Pill>

            <h1
              style={{
                fontFamily: "var(--display)",
                fontWeight: 800,
                fontSize: isMobile
                  ? "clamp(36px, 10vw, 48px)"
                  : "clamp(42px, 5.5vw, 62px)",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                margin: "22px 0 0",
              }}
            >
              Money that finally{" "}
              <span style={{ color: green }}>makes sense</span>.
            </h1>

            <p
              style={{
                fontSize: isMobile ? 16 : "clamp(16px, 1.8vw, 18.5px)",
                lineHeight: 1.65,
                color: textMid,
                margin: "18px 0 0",
                maxWidth: 460,
              }}
            >
              The free expense tracker for{" "}
              <strong style={{ color: dark, fontWeight: 700 }}>
                salaried professionals, students &amp; bachelors
              </strong>
              . Budget by your payday or pocket money — not the calendar. No jargon, no guilt.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 28,
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/register"
                style={{
                  background: green,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "14px 24px",
                  borderRadius: 100,
                  textDecoration: "none",
                  boxShadow: `0 10px 24px color-mix(in srgb, ${green} 32%, transparent)`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Start tracking free <ArrowRight size={15} />
              </Link>
              <a
                href="#how-it-works"
                style={{
                  color: dark,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  padding: "14px 4px",
                  borderBottom: `2px solid ${dark}`,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                See how it works
              </a>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 28,
              }}
            >
              <div style={{ display: "flex" }}>
                {AVATAR_COLORS.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: c,
                      border: `2.5px solid ${bg}`,
                      marginLeft: i > 0 ? -8 : 0,
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 13, color: textMid, fontWeight: 600 }}>
                Free forever · No credit card · ★ 4.8 rated
              </span>
            </div>
          </div>

          {/* Phone mockup — hidden on mobile via CSS */}
          <div className="lp-phone-hero">
            <div
              style={{
                width: 290,
                background: "#1a1a1a",
                borderRadius: 40,
                padding: 13,
                boxShadow: `0 30px 60px rgba(60,40,20,0.16)`,
              }}
            >
              <div
                style={{
                  background: "oklch(0.98 0.012 95)",
                  borderRadius: 30,
                  overflow: "hidden",
                  height: 530,
                  position: "relative",
                }}
              >
                {SCREENSHOTS.hero ? (
                  <img
                    src={SCREENSHOTS.hero}
                    alt="Spendly dashboard"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "top",
                      display: "block",
                    }}
                  />
                ) : (
                  <>
                    <div
                      style={{
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 80,
                          height: 5,
                          borderRadius: 5,
                          background: border,
                        }}
                      />
                    </div>
                    <div style={{ padding: "4px 20px 0" }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: textMuted,
                          fontWeight: 700,
                        }}
                      >
                        This cycle · resets in 18 days
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 6,
                          marginTop: 2,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--display)",
                            fontWeight: 800,
                            fontSize: 28,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          ₹18,200
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: textMuted,
                            fontWeight: 600,
                          }}
                        >
                          left
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          margin: "14px 0 8px",
                        }}
                      >
                        <div
                          style={{
                            width: 160,
                            height: 160,
                            borderRadius: "50%",
                            background: `conic-gradient(${green} 0 32%, ${amber} 32% 60%, ${gold} 60% 76%, oklch(0.72 0.09 230) 76% 90%, oklch(0.88 0.04 150) 90% 100%)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              width: 104,
                              height: 104,
                              borderRadius: "50%",
                              background: "oklch(0.98 0.012 95)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                color: textMuted,
                                fontWeight: 700,
                              }}
                            >
                              spent
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--display)",
                                fontWeight: 800,
                                fontSize: 19,
                              }}
                            >
                              ₹42,180
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {[
                          {
                            color: green,
                            label: "Food & dining",
                            val: "₹13.5k",
                          },
                          { color: amber, label: "Rent", val: "₹11.8k" },
                          { color: gold, label: "Transport", val: "₹6.7k" },
                          {
                            color: "oklch(0.72 0.09 230)",
                            label: "Shopping",
                            val: "₹5.9k",
                          },
                        ].map((l) => (
                          <div
                            key={l.label}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontSize: 12,
                            }}
                          >
                            <span
                              style={{
                                width: 9,
                                height: 9,
                                borderRadius: "50%",
                                background: l.color,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                flex: 1,
                                color: "#4a4338",
                                fontWeight: 700,
                              }}
                            >
                              {l.label}
                            </span>
                            <span style={{ color: textMuted, fontWeight: 700 }}>
                              {l.val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" style={{ paddingBottom: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{
              fontFamily: "var(--display)", fontWeight: 800,
              fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "-0.02em",
              color: dark, margin: "0 0 8px",
            }}>
              Built around when <em style={{ fontStyle: "normal", color: green }}>you</em> get paid
            </h2>
            <p style={{ fontSize: 15, color: textMid, margin: 0 }}>
              Salary, stipend, or pocket money — your cycle, your rules.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
              gap: 16,
            }}
          >
            {FEATURES.map(({ Icon, iconBg, iconColor, title, desc }) => (
              <article
                key={title}
                style={{
                  background: surface,
                  borderRadius: 22,
                  padding: "24px 24px 28px",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={20} color={iconColor} strokeWidth={2} />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--display)",
                    fontWeight: 700,
                    fontSize: 19,
                    margin: "16px 0 7px",
                    color: dark,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.65,
                    color: textMid,
                    margin: 0,
                  }}
                >
                  {desc}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* ── App preview band ── */}
      <section
        style={{
          background: dark,
          padding: isMobile ? "48px 20px" : "64px 40px",
        }}
      >
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div
            style={{
              textAlign: "center",
              maxWidth: 560,
              margin: "0 auto 36px",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--display)",
                fontWeight: 800,
                fontSize: "clamp(24px, 3.5vw, 34px)",
                letterSpacing: "-0.02em",
                margin: 0,
                color: bg,
              }}
            >
              A peek inside the app
            </h2>
            <p style={{ fontSize: 15, color: textMuted, margin: "10px 0 0" }}>
              Used by salaried professionals, students, and bachelors across India.
            </p>
          </div>

          <div className="lp-phones">
            {/* Phone 1 — expenses list */}
            <PhoneFrame screenshot={SCREENSHOTS.expenses}>
              <div style={{ padding: "16px 14px" }}>
                <div
                  style={{ fontSize: 10, color: textMuted, fontWeight: 700 }}
                >
                  Day 12 of 30
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 6,
                    background: border,
                    margin: "7px 0 14px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "40%",
                      height: "100%",
                      background: green,
                      borderRadius: 6,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontWeight: 700,
                    fontSize: 14,
                    marginBottom: 10,
                    color: dark,
                  }}
                >
                  Recent
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {TRANSACTIONS.map(
                    ({ Icon, iconBg, label, sub, amt, amtColor }) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: iconBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={13} color={dark} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: dark,
                            }}
                          >
                            {label}
                          </div>
                          <div style={{ fontSize: 10, color: textMuted }}>
                            {sub}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: amtColor,
                          }}
                        >
                          {amt}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </PhoneFrame>

            {/* Phone 2 — dashboard overview */}
            <PhoneFrame screenshot={SCREENSHOTS.overview}>
              <div style={{ padding: "16px 14px" }}>
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontWeight: 700,
                    fontSize: 14,
                    marginBottom: 12,
                    color: dark,
                  }}
                >
                  This cycle
                </div>
                <div
                  style={{
                    background: surface,
                    borderRadius: 13,
                    padding: "12px 14px",
                    marginBottom: 11,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: textMuted,
                      fontWeight: 700,
                      marginBottom: 3,
                    }}
                  >
                    Budget left
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--display)",
                      fontWeight: 800,
                      fontSize: 22,
                      color: green,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    ₹18,200
                  </div>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 5,
                      background: border,
                      marginTop: 9,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "30%",
                        height: "100%",
                        background: green,
                        borderRadius: 5,
                      }}
                    />
                  </div>
                </div>
                {[
                  { label: "Food & dining", pct: 72, color: green },
                  { label: "Transport", pct: 45, color: amber },
                  { label: "Shopping", pct: 28, color: gold },
                ].map((c) => (
                  <div key={c.label} style={{ marginBottom: 9 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11,
                        fontWeight: 600,
                        color: textMid,
                        marginBottom: 3,
                      }}
                    >
                      <span>{c.label}</span>
                      <span>{c.pct}%</span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        borderRadius: 5,
                        background: border,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${c.pct}%`,
                          height: "100%",
                          background: c.color,
                          borderRadius: 5,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </PhoneFrame>

            {/* Phone 3 — goals */}
            <PhoneFrame screenshot={SCREENSHOTS.goals}>
              <div style={{ padding: "18px 16px" }}>
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontWeight: 700,
                    fontSize: 14,
                    color: dark,
                    marginBottom: 4,
                  }}
                >
                  Goals
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    margin: "18px 0",
                  }}
                >
                  <div
                    style={{
                      width: 136,
                      height: 136,
                      borderRadius: "50%",
                      background: `conic-gradient(${green} 0 67%, ${border} 67% 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 104,
                        height: 104,
                        borderRadius: "50%",
                        background: "oklch(0.98 0.012 95)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Target size={16} color={green} strokeWidth={2} />
                      <span
                        style={{
                          fontFamily: "var(--display)",
                          fontWeight: 800,
                          fontSize: 19,
                          color: dark,
                        }}
                      >
                        67%
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ background: bg, borderRadius: 12, padding: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: textMuted, fontWeight: 700 }}>
                      Goa trip
                    </span>
                    <span style={{ fontWeight: 800, color: dark }}>
                      ₹40k / ₹60k
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 6,
                      background: border,
                      marginTop: 8,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "67%",
                        height: "100%",
                        background: green,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    color: textMuted,
                    marginTop: 12,
                    fontWeight: 600,
                  }}
                >
                  Set aside ₹6,600 / cycle
                </div>
              </div>
            </PhoneFrame>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: px }}>
        {/* ── How it works ── */}
        <section
          id="how-it-works"
          style={{ padding: isMobile ? "56px 0 52px" : "80px 0 72px" }}
        >
          <h2
            style={{
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: "clamp(24px, 3.5vw, 36px)",
              letterSpacing: "-0.02em",
              textAlign: "center",
              margin: "0 0 36px",
            }}
          >
            Three little steps
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
              gap: 16,
            }}
          >
            {STEPS.map(({ n, color, title, desc }) => (
              <div
                key={n}
                style={{ background: surface, borderRadius: 22, padding: 24 }}
              >
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontWeight: 800,
                    fontSize: 32,
                    color,
                    lineHeight: 1,
                  }}
                >
                  {n}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--display)",
                    fontWeight: 700,
                    fontSize: 18,
                    margin: "10px 0 6px",
                    color: dark,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: textMid,
                    margin: 0,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ── */}
        {testimonials.length > 0 && (
          <section id="reviews" style={{ paddingBottom: 64 }}>
            <h2
              style={{
                fontFamily: "var(--display)",
                fontWeight: 800,
                fontSize: "clamp(24px, 3.5vw, 36px)",
                letterSpacing: "-0.02em",
                textAlign: "center",
                margin: "0 0 36px",
              }}
            >
              What people are saying
            </h2>
            <TestimonialsCarousel
              testimonials={testimonials}
              visible={carouselVisible}
            />
          </section>
        )}

        {/* ── Final CTA ── */}
        <section
          style={{
            background: green,
            borderRadius: isMobile ? 20 : 28,
            padding: isMobile ? "44px 24px" : "60px 40px",
            textAlign: "center",
            margin: "0 0 28px",
            boxShadow: `0 10px 40px color-mix(in srgb, ${green} 30%, transparent)`,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10 }}>🌿</div>
          <h2
            style={{
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: "clamp(22px, 3.5vw, 36px)",
              letterSpacing: "-0.02em",
              margin: 0,
              color: "#fff",
            }}
          >
            Ready to feel good about money?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.88)",
              margin: "12px 0 28px",
            }}
          >
            Free forever. No credit card. No guilt.
          </p>
          <div className="lp-cta-buttons">
            <Link
              to="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: dark,
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                padding: "15px 28px",
                borderRadius: 100,
                textDecoration: "none",
              }}
            >
              Start tracking free <ArrowRight size={15} />
            </Link>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 15,
                padding: "15px 24px",
                borderRadius: 100,
                textDecoration: "none",
                border: "1.5px solid rgba(255,255,255,0.3)",
              }}
            >
              Already have an account
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              gap: isMobile ? 12 : 20,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {["No credit card required", "Free forever", "Works offline"].map(
              (t) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.8)",
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={13} color="rgba(255,255,255,0.8)" />
                  {t}
                </div>
              ),
            )}
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: `1px solid ${border}`,
          padding: isMobile ? "24px 20px" : "28px 40px",
        }}
      >
        <div
          className="lp-footer-inner"
          style={{ maxWidth: 1160, margin: "0 auto" }}
        >
          <span
            style={{
              fontFamily: "var(--display)",
              fontWeight: 700,
              fontSize: 16,
              color: dark,
            }}
          >
            Spendly
          </span>
          <span style={{ fontSize: 13, color: textMuted }}>
            © {new Date().getFullYear()} · Made for people with paydays
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link
              to="/login"
              style={{ fontSize: 13, color: textMuted, textDecoration: "none" }}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              style={{ fontSize: 13, color: textMuted, textDecoration: "none" }}
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

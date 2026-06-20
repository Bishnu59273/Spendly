import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "../utils/format.js";

export default function DailyChart({ data = [], currency = "INR" }) {
  const [hover, setHover] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const todayIdx = data.findIndex((d) => d.isToday);
    if (todayIdx < 0) return;
    requestAnimationFrame(() => {
      const barWidth = el.scrollWidth / data.length;
      el.scrollLeft = barWidth * todayIdx + barWidth / 2 - el.clientWidth / 2;
    });
  }, [data]);

  const allZero = data.every((d) => d.total === 0);
  if (allZero) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "32px 0",
          color: "var(--ink-3)",
          fontSize: 13,
        }}
      >
        No expenses yet this cycle
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.total), 1) * 1.1;
  // each bar at least 18px wide + 3px gap so bars stay tappable on mobile
  const minContentWidth = data.length * 21;

  return (
    <div ref={scrollRef} style={{ overflowX: "auto", overflowY: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: 160,
          paddingTop: 32,
          paddingBottom: 2,
          minWidth: minContentWidth,
        }}
      >
        {data.map((d, i) => {
          const pct = Math.max((d.total / max) * 100, d.total > 0 ? 2 : 0.8);
          const isHovered = hover === i;
          return (
            <div
              key={i}
              style={{
                flex: "1 0 0",
                minWidth: 18,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                height: "100%",
                justifyContent: "flex-end",
              }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onTouchStart={() => setHover(hover === i ? null : i)}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  flex: 1,
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                {isHovered && d.total > 0 && (
                  <div
                    className="sp-num"
                    style={{
                      position: "absolute",
                      bottom: `calc(${pct}% + 6px)`,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "var(--ink)",
                      color: "var(--surface)",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 5px",
                      borderRadius: 6,
                      whiteSpace: "nowrap",
                      boxShadow: "var(--sh-md)",
                      zIndex: 10,
                    }}
                  >
                    {formatCurrency(d.total, currency)}
                  </div>
                )}
                <div
                  style={{
                    width: "100%",
                    height: `${pct}%`,
                    borderRadius: "5px 5px 2px 2px",
                    background: d.isToday
                      ? "var(--brand)"
                      : isHovered
                      ? "color-mix(in srgb, var(--brand) 55%, var(--surface-sunken))"
                      : "color-mix(in srgb, var(--brand) 28%, var(--surface-sunken))",
                    transition: "background 150ms var(--e)",
                    boxShadow: d.isToday ? "var(--sh-xs)" : "none",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: d.isToday ? 700 : 500,
                  color: d.isToday ? "var(--ink)" : "var(--ink-3)",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

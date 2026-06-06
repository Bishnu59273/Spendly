import { useState } from "react";
import { formatCurrency } from "../utils/format.js";

export default function CycleBars({ cycles = [], currency = "INR" }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...cycles.map((c) => c.budget || c.spent || 0), 1) * 1.05;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, paddingTop: 8 }}>
      {cycles.map((c, i) => {
        const h = (c.spent / max) * 100;
        const over = c.spent > (c.budget || Infinity);
        const isLast = i === cycles.length - 1;
        return (
          <div
            key={c.label}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div style={{ position: "relative", width: "100%", maxWidth: 36, flex: 1, display: "flex", alignItems: "flex-end" }}>
              {hover === i && (
                <div
                  className="sp-num"
                  style={{
                    position: "absolute", bottom: `calc(${h}% + 8px)`, left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--ink)", color: "var(--surface)",
                    fontSize: 11, fontWeight: 700, padding: "3px 7px",
                    borderRadius: 7, whiteSpace: "nowrap", boxShadow: "var(--sh-md)",
                  }}
                >
                  {formatCurrency(c.spent, currency)}
                </div>
              )}
              <div
                style={{
                  width: "100%",
                  height: `${h}%`,
                  borderRadius: "7px 7px 3px 3px",
                  background: over
                    ? "var(--neg)"
                    : isLast
                    ? "var(--brand)"
                    : "color-mix(in srgb, var(--brand) 30%, var(--surface-sunken))",
                  transition: "background 200ms var(--e)",
                  boxShadow: isLast ? "var(--sh-xs)" : "none",
                  minHeight: 2,
                }}
              />
            </div>
            <div style={{ fontSize: 11.5, fontWeight: isLast ? 700 : 500, color: isLast ? "var(--ink)" : "var(--ink-3)" }}>
              {c.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

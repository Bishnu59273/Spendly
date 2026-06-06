import { formatCurrency } from "../utils/format.js";

function Mini({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: "1px solid var(--line)",
        paddingTop: 9,
      }}
    >
      <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500 }}>
        {label}
      </span>
      <span
        className="sp-num"
        style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function SavingsGoal({ goal, currency = "INR" }) {
  const saved = goal.saved ?? goal.current ?? 0;
  const target = goal.target ?? goal.goal ?? 0;
  const pct =
    target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0;
  const left = Math.max(target - saved, 0);
  const months = goal.monthly > 0 ? Math.ceil(left / goal.monthly) : "—";
  const R = 76;
  const strokeW = 13;
  const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;

  return (
    <div
      className="sp-card sp-card-pad"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div className="sp-card-head">
        <div>
          <div className="sp-card-title">Savings goal</div>
          <div className="sp-card-sub">{goal.name}</div>
        </div>
        <span className="mt-5 sp-pill sp-pill-pos">On track</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
        <div
          style={{
            position: "relative",
            width: 180,
            height: 180,
            flex: "none",
          }}
        >
          <svg
            viewBox="0 0 180 180"
            width="180"
            height="180"
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke="var(--surface-sunken)"
              strokeWidth={strokeW}
            />
            <circle
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke="var(--brand)"
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
            }}
          >
            <div>
              <div
                className="sp-display sp-num"
                style={{ fontSize: 27, fontWeight: 800, color: "var(--brand)" }}
              >
                {pct}%
              </div>
              <div
                style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}
              >
                funded
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="sp-display sp-num"
            style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)" }}
          >
            {formatCurrency(saved, currency)}
          </div>
          <div
            className="sp-num"
            style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 16 }}
          >
            of {formatCurrency(target, currency)} goal
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Mini label="Still need" value={formatCurrency(left, currency)} />
            <Mini
              label="Monthly add"
              value={formatCurrency(goal.monthly, currency)}
            />
            <Mini
              label="On track in"
              value={months !== "—" ? `${months} mo` : "—"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

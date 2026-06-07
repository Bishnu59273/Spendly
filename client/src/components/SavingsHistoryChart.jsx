import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../utils/format.js";

export default function SavingsHistoryChart({ snapshots = [], target, currency }) {
  if (snapshots.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, color: "var(--ink-3)", fontSize: 13 }}>
        Add savings to start tracking your history
      </div>
    );
  }

  const data = snapshots.map((s) => ({
    label: new Date(s.snapshotDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    saved: s.savedAmount,
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 8, right: 28, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--ink-3)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis hide />
        <Tooltip
          formatter={(v) => [formatCurrency(v, currency), "Saved"]}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--ink)",
          }}
          labelStyle={{ color: "var(--ink-3)", fontSize: 11 }}
        />
        {target && (
          <ReferenceLine
            y={target}
            stroke="var(--ink-3)"
            strokeDasharray="4 3"
            label={{ value: "Goal", position: "insideTopRight", fontSize: 10, fill: "var(--ink-3)" }}
          />
        )}
        <Area
          type="monotone"
          dataKey="saved"
          stroke="var(--brand)"
          strokeWidth={2}
          fill="url(#savingsGrad)"
          dot={{ r: 3, fill: "var(--brand)", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "var(--brand)", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

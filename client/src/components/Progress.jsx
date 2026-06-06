export default function Progress({ value, max, color, height = 8 }) {
  const pct = Math.min(max > 0 ? (value / max) * 100 : 0, 100);
  const over = value > max;
  return (
    <div style={{ width: "100%", height, borderRadius: 99, background: "var(--surface-sunken)", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 99,
          background: over ? "var(--neg)" : (color || "var(--brand)"),
          transition: "width 600ms var(--e)",
        }}
      />
    </div>
  );
}

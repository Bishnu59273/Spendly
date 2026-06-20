export default function Donut({ data = [], size = 208, stroke = 28, active, onHover }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const gap = 0.012 * C;

  let offset = 0;
  const arcs = data.map((d) => {
    const frac = total ? d.value / total : 0;
    const len = Math.max(frac * C - gap, 0);
    const seg = { ...d, len, off: -offset, C };
    offset += frac * C;
    return seg;
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)", width: "100%", height: "auto", maxWidth: size, display: "block" }}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
      {arcs.map((a) => (
        <circle
          key={a.id}
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={a.color}
          strokeWidth={active && active !== a.id ? stroke - 6 : stroke}
          strokeLinecap="round"
          strokeDasharray={`${a.len} ${a.C - a.len}`}
          strokeDashoffset={a.off}
          onMouseEnter={() => onHover && onHover(a.id)}
          onMouseLeave={() => onHover && onHover(null)}
          onClick={() => onHover && onHover(active === a.id ? null : a.id)}
          style={{
            transition: "stroke-width 200ms var(--e), opacity 200ms var(--e)",
            opacity: active && active !== a.id ? 0.45 : 1,
            cursor: "pointer",
          }}
        />
      ))}
    </svg>
  );
}

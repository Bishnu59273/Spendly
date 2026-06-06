export default function Pill({ icon, label, color, size = "sm" }) {
  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${pad}`}
      style={{ backgroundColor: color + "22", color }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}

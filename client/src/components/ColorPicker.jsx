const PRESETS = [
  "#F97316","#3B82F6","#8B5CF6","#EF4444","#EC4899",
  "#F59E0B","#10B981","#6B7280","#14B8A6","#F43F5E",
  "#84CC16","#0EA5E9",
];

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: c,
              borderColor: value === c ? "#1e293b" : "transparent",
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Custom:</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-14 cursor-pointer rounded border"
        />
        <span className="text-xs font-mono text-gray-500">{value}</span>
      </div>
    </div>
  );
}

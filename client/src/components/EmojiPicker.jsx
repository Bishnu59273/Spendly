import { useState } from "react";

const EMOJIS = [
  { e: "🏷️",  k: "tag label" },
  { e: "🎯",  k: "target goal" },
  { e: "💡",  k: "idea light" },
  { e: "🔥",  k: "fire hot" },
  { e: "⭐",  k: "star favourite" },
  { e: "💎",  k: "diamond gem luxury" },
  { e: "🏆",  k: "trophy award win" },
  { e: "🎉",  k: "party celebrate" },
  { e: "❤️",  k: "heart love" },
  { e: "😀",  k: "smile happy face" },
  { e: "😂",  k: "laugh funny" },
  { e: "🍔",  k: "burger food eat" },
  { e: "🍕",  k: "pizza food eat" },
  { e: "☕",  k: "coffee tea drink" },
  { e: "🍺",  k: "beer drink alcohol" },
  { e: "🎂",  k: "cake birthday celebrate" },
  { e: "🛒",  k: "cart shopping grocery" },
  { e: "💊",  k: "pill medicine health" },
  { e: "🏥",  k: "hospital health medical" },
  { e: "🚗",  k: "car transport drive" },
  { e: "🚌",  k: "bus transport commute" },
  { e: "✈️",  k: "plane travel fly trip" },
  { e: "🏠",  k: "house home rent" },
  { e: "📚",  k: "books study education" },
  { e: "💻",  k: "laptop computer tech" },
  { e: "📱",  k: "phone mobile" },
  { e: "🎮",  k: "game gaming controller" },
  { e: "🎬",  k: "movie film cinema" },
  { e: "🎵",  k: "music note song" },
  { e: "🎨",  k: "art paint design" },
  { e: "💰",  k: "money cash savings" },
  { e: "💳",  k: "card credit payment" },
  { e: "📈",  k: "chart growth invest" },
  { e: "🌍",  k: "world travel globe" },
  { e: "🌙",  k: "moon night" },
  { e: "☀️",  k: "sun day" },
  { e: "🌈",  k: "rainbow colour" },
  { e: "🌸",  k: "flower spring" },
  { e: "🍀",  k: "clover luck" },
  { e: "🦋",  k: "butterfly nature" },
  { e: "🐶",  k: "dog pet" },
  { e: "🐱",  k: "cat pet" },
  { e: "🦁",  k: "lion animal" },
  { e: "🍎",  k: "apple fruit food" },
  { e: "🥗",  k: "salad healthy food" },
  { e: "🏋️",  k: "gym fitness workout" },
  { e: "⚽",  k: "football sport" },
  { e: "🎓",  k: "graduate education school" },
  { e: "✂️",  k: "scissors cut" },
  { e: "🔧",  k: "tool repair fix" },
  { e: "💼",  k: "briefcase work office" },
  { e: "🧾",  k: "receipt bill expense" },
  { e: "🎁",  k: "gift present" },
  { e: "🧴",  k: "skincare personal care" },
  { e: "👕",  k: "clothes fashion shopping" },
  { e: "👟",  k: "shoes fashion" },
  { e: "🌮",  k: "taco food eat" },
  { e: "🍜",  k: "noodle food eat" },
  { e: "🧃",  k: "juice drink" },
  { e: "🏖️",  k: "beach holiday vacation" },
];

const inp = {
  width: "100%", height: 38, padding: "0 12px",
  borderRadius: "var(--r-sm)", border: "1px solid var(--line)",
  background: "var(--surface-2)", color: "var(--ink)", fontSize: 13.5, outline: "none",
};

export default function EmojiPicker({ value, onChange }) {
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = q
    ? EMOJIS.filter(({ e, k }) => k.includes(q) || e === q)
    : EMOJIS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        type="text"
        placeholder="Search e.g. food, travel, home…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inp}
      />
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4,
        maxHeight: 130, overflowY: "auto",
      }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1", padding: "16px 0", textAlign: "center", fontSize: 12, color: "var(--ink-3)" }}>
            No results
          </div>
        ) : filtered.map(({ e }) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            style={{
              fontSize: 20, borderRadius: "var(--r-xs)", padding: "4px 0",
              background: value === e ? "var(--brand-soft)" : "transparent",
              border: value === e ? "1.5px solid var(--brand)" : "1.5px solid transparent",
              transition: "background var(--d1) var(--e)",
              cursor: "pointer",
            }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

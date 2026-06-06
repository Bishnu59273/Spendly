import { useState } from "react";

const EMOJIS = [
  "😀","😂","❤️","🎉","🔥","⭐","💡","🎵","🏆","💎",
  "🍔","🍕","☕","🍺","🎂","🛒","💊","🚗","🏠","✈️",
  "📚","💻","📱","🎮","🎬","🎨","💰","💳","📈","🌍",
  "🌙","☀️","🌈","🌸","🍀","🦋","🐶","🐱","🦁","🐢",
];

export default function EmojiPicker({ value, onChange }) {
  const [search, setSearch] = useState("");
  const filtered = search ? EMOJIS.filter((e) => e.includes(search)) : EMOJIS;

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Search emoji..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm"
      />
      <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
        {filtered.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={`text-xl p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              value === emoji ? "bg-indigo-100 dark:bg-indigo-900" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

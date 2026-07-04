import { useState } from "react";
import Modal from "./Modal.jsx";
import EmojiPicker from "./EmojiPicker.jsx";
import ColorPicker from "./ColorPicker.jsx";
import ExpenseForm from "./ExpenseForm.jsx";
import { useCreateCategory } from "../api/categories.js";
import { useCreateTag } from "../api/tags.js";
import { useCreateGoal } from "../api/goals.js";

const inp = {
  width: "100%", height: 44, padding: "0 14px",
  borderRadius: "var(--r-sm)", border: "1px solid var(--line)",
  background: "var(--surface-2)", color: "var(--ink)", fontSize: 14.5, outline: "none",
};
const lbl = {
  display: "block", fontSize: 11, fontWeight: 700,
  letterSpacing: "0.04em", textTransform: "uppercase",
  color: "var(--ink-3)", marginBottom: 7,
};

/* ─── Category quick-add ─── */
function CategoryAdd({ onClose }) {
  const create = useCreateCategory();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [color, setColor] = useState("#6366f1");
  const [budget, setBudget] = useState("");
  const [err, setErr] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const save = async () => {
    if (!name.trim()) { setErr("Name is required"); return; }
    try {
      await create.mutateAsync({ name: name.trim(), icon, color, budgetLimit: budget ? parseFloat(budget) : null });
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || "Failed to create category");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {err && <p style={{ fontSize: 13, color: "var(--neg)", margin: 0 }}>{err}</p>}
      <div><label style={lbl}>Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Housing" style={inp} /></div>
      <div><label style={lbl}>Monthly budget limit (optional)</label><input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Leave blank for no limit" style={inp} /></div>
      <div>
        <label style={lbl}>Icon</label>
        <button
          type="button"
          onClick={() => setShowIconPicker((v) => !v)}
          style={{
            width: 46, height: 44, fontSize: 22,
            borderRadius: "var(--r-sm)",
            border: `1px solid ${showIconPicker ? "var(--brand)" : "var(--line)"}`,
            background: showIconPicker ? "var(--brand-soft)" : "var(--surface-2)",
            cursor: "pointer", display: "grid", placeItems: "center",
          }}
        >
          {icon}
        </button>
        {showIconPicker && (
          <div style={{ marginTop: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", overflow: "hidden" }}>
            <EmojiPicker value={icon} onChange={(v) => { setIcon(v); setShowIconPicker(false); }} />
          </div>
        )}
      </div>
      <div><label style={lbl}>Color</label><ColorPicker value={color} onChange={setColor} /></div>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="sp-btn sp-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="sp-btn sp-btn-primary" style={{ flex: 1.4 }} onClick={save} disabled={create.isPending || !name.trim()}>
          {create.isPending ? "Creating…" : "Create category"}
        </button>
      </div>
    </div>
  );
}

/* ─── Tag quick-add ─── */
function TagAdd({ onClose }) {
  const create = useCreateTag();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const [color, setColor] = useState("#6366f1");
  const [err, setErr] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const save = async () => {
    if (!name.trim()) { setErr("Name is required"); return; }
    try {
      await create.mutateAsync({ name: name.trim(), icon, color });
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || "Failed to create tag");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {err && <p style={{ fontSize: 13, color: "var(--neg)", margin: 0 }}>{err}</p>}
      <div><label style={lbl}>Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. essentials" style={inp} /></div>
      <div>
        <label style={lbl}>Icon</label>
        <button
          type="button"
          onClick={() => setShowIconPicker((v) => !v)}
          style={{
            width: 46, height: 44, fontSize: 22,
            borderRadius: "var(--r-sm)",
            border: `1px solid ${showIconPicker ? "var(--brand)" : "var(--line)"}`,
            background: showIconPicker ? "var(--brand-soft)" : "var(--surface-2)",
            cursor: "pointer", display: "grid", placeItems: "center",
          }}
        >
          {icon}
        </button>
        {showIconPicker && (
          <div style={{ marginTop: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", overflow: "hidden" }}>
            <EmojiPicker value={icon} onChange={(v) => { setIcon(v); setShowIconPicker(false); }} />
          </div>
        )}
      </div>
      <div><label style={lbl}>Color</label><ColorPicker value={color} onChange={setColor} /></div>
      {/* Live preview */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: "var(--r-sm)", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 14px", borderRadius: 99, background: color + "22", border: `1.5px solid ${color}`, color, fontWeight: 700, fontSize: 13.5 }}>
          {icon} #{name || "preview"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="sp-btn sp-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="sp-btn sp-btn-primary" style={{ flex: 1.4 }} onClick={save} disabled={create.isPending || !name.trim()}>
          {create.isPending ? "Creating…" : "Create tag"}
        </button>
      </div>
    </div>
  );
}

/* ─── Goal quick-add ─── */
function GoalAdd({ onClose }) {
  const create = useCreateGoal();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [monthly, setMonthly] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [color, setColor] = useState("#1d6b51");
  const [isPrimary, setIsPrimary] = useState(false);
  const [err, setErr] = useState("");

  const ICONS = ["🎯", "💻", "✈️", "📚", "🏥", "🏠", "🚗", "💍", "🎵", "🌴"];
  const COLORS = ["#1d6b51", "#3B82F6", "#8B5CF6", "#EF4444", "#EC4899", "#F59E0B"];

  const save = async () => {
    if (!name.trim() || !target) { setErr("Name and target are required"); return; }
    await create.mutateAsync({ name: name.trim(), icon, color, target: parseFloat(target), saved: parseFloat(saved) || 0, monthly: parseFloat(monthly) || 0, isPrimary });
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {err && <p style={{ fontSize: 13, color: "var(--neg)", margin: 0 }}>{err}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label style={lbl}>Goal name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Laptop" style={inp} /></div>
        <div>
          <label style={lbl}>Icon</label>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {ICONS.slice(0, 6).map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)} style={{ width: 34, height: 34, borderRadius: 8, fontSize: 17, border: `2px solid ${icon === ic ? "var(--brand)" : "var(--line)"}`, background: icon === ic ? "var(--brand-soft)" : "var(--surface-2)" }}>{ic}</button>
            ))}
          </div>
        </div>
        <div><label style={lbl}>Target amount</label><input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" style={inp} /></div>
        <div><label style={lbl}>Currently saved</label><input type="number" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0" style={inp} /></div>
        <div><label style={lbl}>Monthly contribution</label><input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="0" style={inp} /></div>
        <div>
          <label style={lbl}>Color</label>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 4 }}>
            {COLORS.map((c) => <button key={c} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: 99, background: c, border: `3px solid ${color === c ? "var(--ink)" : "transparent"}` }} />)}
          </div>
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <button type="button" onClick={() => setIsPrimary(!isPrimary)}
          style={{ width: 42, height: 24, borderRadius: 99, padding: 2, background: isPrimary ? "var(--brand)" : "var(--surface-sunken)", flex: "none", border: "none" }}>
          <span style={{ display: "block", width: 20, height: 20, borderRadius: "50%", background: "#fff", transform: isPrimary ? "translateX(18px)" : "translateX(0)", transition: "transform var(--d1) var(--e)", boxShadow: "var(--sh-xs)" }} />
        </button>
        <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-2)" }}>Set as primary savings goal</span>
      </label>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="sp-btn sp-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="sp-btn sp-btn-primary" style={{ flex: 1.4 }} onClick={save} disabled={create.isPending || !name.trim() || !target}>
          {create.isPending ? "Creating…" : "Add goal"}
        </button>
      </div>
    </div>
  );
}

/* ─── Router ─── */
const MODAL_TITLES = {
  expense:  "New expense",
  category: "New category",
  tag:      "New tag",
  goal:     "New goal",
};

export default function SmartAddModal({ open, onClose, type = "expense" }) {
  if (type === "expense") {
    return <ExpenseForm open={open} onClose={onClose} />;
  }

  return (
    <Modal open={open} onClose={onClose} title={MODAL_TITLES[type]}>
      {type === "category" && <CategoryAdd onClose={onClose} />}
      {type === "tag"      && <TagAdd      onClose={onClose} />}
      {type === "goal"     && <GoalAdd     onClose={onClose} />}
    </Modal>
  );
}

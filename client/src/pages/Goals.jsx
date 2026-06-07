import { useState } from "react";
import { Plus, X, Pencil, Star, PlusCircle } from "lucide-react";
import ConfirmDelete from "../components/ConfirmDelete.jsx";
import EmojiPicker from "../components/EmojiPicker.jsx";
import { useTrend } from "../api/summary.js";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "../api/goals.js";
import SavingsGoal from "../components/SavingsGoal.jsx";
import CycleBars from "../components/CycleBars.jsx";
import Progress from "../components/Progress.jsx";
import { formatCurrency } from "../utils/format.js";

const GOAL_COLORS = ["#1d6b51", "#3B82F6", "#8B5CF6", "#EF4444", "#EC4899", "#F59E0B"];

const inputStyle = {
  width: "100%", height: 42, padding: "0 12px",
  borderRadius: "var(--r-sm)", border: "1px solid var(--line)",
  background: "var(--surface-2)", color: "var(--ink)", fontSize: 14, outline: "none",
};

function GoalForm({ initial, onSave, onCancel, isPrimarySlot }) {
  const [name, setName] = useState(initial?.name || "");
  const [current, setCurrent] = useState(initial?.saved?.toString() || "");
  const [target, setTarget] = useState(initial?.target?.toString() || "");
  const [monthly, setMonthly] = useState(initial?.monthly?.toString() || "");
  const [icon, setIcon] = useState(initial?.icon || "🎯");
  const [color, setColor] = useState(initial?.color || "#1d6b51");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const save = () => {
    if (!name || !target) return;
    onSave({
      name,
      icon,
      color,
      target: parseFloat(target),
      saved: parseFloat(current) || 0,
      monthly: parseFloat(monthly) || 0,
      isPrimary: isPrimarySlot || false,
    });
  };

  return (
    <div className="sp-card sp-card-pad" style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
        {initial ? "Edit goal" : "New goal"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Laptop" />
        </div>
        <div>
          <label style={labelStyle}>Icon</label>
          <button
            type="button"
            onClick={() => setShowIconPicker((v) => !v)}
            title="Change icon"
            style={{
              width: 42, height: 42, fontSize: 22, borderRadius: 10,
              border: `2px solid ${showIconPicker ? "var(--brand)" : "var(--line)"}`,
              background: showIconPicker ? "var(--brand-soft)" : "var(--surface-2)",
              cursor: "pointer", transition: "all var(--d1) var(--e)",
              display: "grid", placeItems: "center",
            }}
          >
            {icon}
          </button>
        </div>
        <div>
          <label style={labelStyle}>Goal amount</label>
          <input style={inputStyle} type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label style={labelStyle}>Currently saved</label>
          <input style={inputStyle} type="number" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label style={labelStyle}>Monthly contribution</label>
          <input style={inputStyle} type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label style={labelStyle}>Color</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            {GOAL_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 26, height: 26, borderRadius: 99, background: c,
                border: `3px solid ${color === c ? "var(--ink)" : "transparent"}`,
              }} />
            ))}
          </div>
        </div>
      </div>
      {showIconPicker && (
        <div style={{ marginBottom: 12, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface-2)", padding: 10 }}>
          <EmojiPicker
            value={icon}
            onChange={(e) => { setIcon(e); setShowIconPicker(false); }}
          />
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap" }}>Or type:</span>
            <input
              type="text"
              maxLength={2}
              value={icon}
              onChange={(e) => { if (e.target.value) setIcon(e.target.value); }}
              placeholder="😊"
              style={{ height: 34, width: 54, textAlign: "center", fontSize: 18, padding: "0 8px", borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", outline: "none" }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="sp-btn sp-btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
        <button className="sp-btn sp-btn-primary" style={{ flex: 1.4 }} onClick={save} disabled={!name || !target}>
          {initial ? "Save changes" : "Add goal"}
        </button>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 };

export default function Goals({ user }) {
  const { data: trend } = useTrend();
  const { data: goals = [], isLoading } = useGoals();
  const create = useCreateGoal();
  const update = useUpdateGoal();
  const remove = useDeleteGoal();

  const [showPrimaryForm, setShowPrimaryForm] = useState(false);
  const [showOtherForm, setShowOtherForm] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [promotingId, setPromotingId] = useState(null);
  const [addSavingsGoalId, setAddSavingsGoalId] = useState(null);
  const [savingsAmount, setSavingsAmount] = useState("");

  const primaryGoal = goals.find((g) => g.isPrimary);
  const otherGoals = goals.filter((g) => !g.isPrimary);

  const cycles = trend?.barData?.map((d) => ({ label: d.label, spent: d.total, budget: d.total * 1.15 })) || [];

  const handleCreate = async (data) => {
    await create.mutateAsync(data);
    setShowPrimaryForm(false);
    setShowOtherForm(false);
  };

  const handleUpdate = async (data) => {
    await update.mutateAsync({ id: editGoal.id, ...data });
    setEditGoal(null);
  };

  const handleSetPrimary = async (id) => {
    setPromotingId(id);
    try {
      await update.mutateAsync({ id, isPrimary: true });
    } finally {
      setPromotingId(null);
    }
  };

  const handleAddSavings = async (goal) => {
    const amount = parseFloat(savingsAmount);
    if (!amount || amount <= 0) return;
    await update.mutateAsync({ id: goal.id, saved: (goal.saved || 0) + amount });
    setAddSavingsGoalId(null);
    setSavingsAmount("");
  };

  const confirmDelete = async () => {
    await remove.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div>
      {/* Main savings goal + Cycle history */}
      <div className="sp-grid-5-7" style={{ marginBottom: 16 }}>
        <div>
          {editGoal?.isPrimary ? (
            <GoalForm initial={editGoal} onSave={handleUpdate} onCancel={() => setEditGoal(null)} isPrimarySlot />
          ) : showPrimaryForm ? (
            <GoalForm onSave={handleCreate} onCancel={() => setShowPrimaryForm(false)} isPrimarySlot />
          ) : primaryGoal ? (
            <div style={{ position: "relative" }}>
              <SavingsGoal goal={primaryGoal} currency={user.currency}>
                {addSavingsGoalId === primaryGoal.id && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
                    <input
                      type="number"
                      min="0"
                      autoFocus
                      placeholder="Amount saved"
                      value={savingsAmount}
                      onChange={(e) => setSavingsAmount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSavings(primaryGoal)}
                      style={{ flex: 1, height: 34, padding: "0 10px", borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink)", fontSize: 14, outline: "none" }}
                    />
                    <button onClick={() => handleAddSavings(primaryGoal)} disabled={update.isPending} className="sp-btn sp-btn-primary" style={{ height: 34, padding: "0 14px", fontSize: 13 }}>
                      {update.isPending ? "…" : "Add"}
                    </button>
                    <button onClick={() => { setAddSavingsGoalId(null); setSavingsAmount(""); }} className="sp-btn sp-btn-ghost" style={{ height: 34, padding: "0 10px", fontSize: 13 }}>
                      Cancel
                    </button>
                  </div>
                )}
              </SavingsGoal>
              <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 6 }}>
                <button className="sp-icon-btn" style={{ width: 28, height: 28 }} title="Add savings" onClick={() => { setAddSavingsGoalId(primaryGoal.id); setSavingsAmount(""); }}>
                  <PlusCircle style={{ width: 13, height: 13 }} />
                </button>
                <button className="sp-icon-btn" style={{ width: 28, height: 28 }} onClick={() => setEditGoal(primaryGoal)}>
                  <Pencil style={{ width: 13, height: 13 }} />
                </button>
                <button className="sp-icon-btn" style={{ width: 28, height: 28 }} onClick={() => setDeleteTarget({ id: primaryGoal.id, label: `${primaryGoal.name} goal` })}>
                  <X style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          ) : (
            <div className="sp-card sp-card-pad" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12 }}>
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>No primary savings goal yet</div>
              <button className="sp-btn sp-btn-primary" onClick={() => setShowPrimaryForm(true)}>
                <Plus style={{ width: 15, height: 15 }} /> Set savings goal
              </button>
            </div>
          )}
        </div>

        <div className="sp-card sp-card-pad">
          <div className="sp-card-head">
            <div>
              <div className="sp-card-title">Spending history</div>
              <div className="sp-card-sub">Last {cycles.length} pay cycles</div>
            </div>
            {cycles.length > 0 && <span className="sp-pill sp-pill-pos">Tracked</span>}
          </div>
          {cycles.length > 0
            ? <CycleBars cycles={cycles} currency={user.currency} />
            : <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No cycle history yet</div>
          }
        </div>
      </div>

      {/* Other goals */}
      <div className="sp-card sp-card-pad">
        <div className="sp-card-head">
          <div className="sp-card-title">Other goals</div>
          <button className="sp-btn sp-btn-soft sp-btn-sm" onClick={() => setShowOtherForm((v) => !v)}>
            <Plus style={{ width: 15, height: 15 }} /> New goal
          </button>
        </div>

        {showOtherForm && <GoalForm onSave={handleCreate} onCancel={() => setShowOtherForm(false)} />}

        {otherGoals.length === 0 && !showOtherForm ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            No other goals yet. Add one above.
          </div>
        ) : (
          <div className="sp-grid-thirds" style={{ marginTop: showOtherForm ? 16 : 0 }}>
            {otherGoals.map((g) => {
              if (editGoal?.id === g.id) {
                return (
                  <div key={g.id} style={{ gridColumn: "1 / -1" }}>
                    <GoalForm initial={g} onSave={handleUpdate} onCancel={() => setEditGoal(null)} />
                  </div>
                );
              }
              const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
              const left = g.target - g.saved;
              return (
                <div key={g.id} style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 16, position: "relative" }}>
                  <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4 }}>
                    <button className="sp-icon-btn" style={{ width: 24, height: 24 }} onClick={() => setEditGoal(g)}>
                      <Pencil style={{ width: 12, height: 12 }} />
                    </button>
                    <button className="sp-icon-btn" style={{ width: 24, height: 24 }} onClick={() => setDeleteTarget({ id: g.id, label: `${g.name} goal` })}>
                      <X style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--brand-soft)", fontSize: 18 }}>
                      {g.icon}
                    </span>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{g.name}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                    <span className="sp-display sp-num" style={{ fontSize: 19, fontWeight: 700 }}>{formatCurrency(g.saved, user.currency)}</span>
                    <span className="sp-num" style={{ fontSize: 12, color: "var(--ink-3)" }}>{pct}%</span>
                  </div>
                  <Progress value={g.saved} max={g.target} color={g.color?.startsWith("var") ? undefined : g.color} />
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>
                    {formatCurrency(left, user.currency)} left of {formatCurrency(g.target, user.currency)}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAddSavingsGoalId(g.id); setSavingsAmount(""); }}
                    style={{
                      marginTop: 12, width: "100%", height: 30,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      borderRadius: "var(--r-sm)", border: "1px solid var(--line)",
                      background: "transparent", color: "var(--ink-3)", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", transition: "all var(--d1) var(--e)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand)"; e.currentTarget.style.background = "var(--brand-soft)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <PlusCircle size={12} /> Add savings
                  </button>
                  {addSavingsGoalId === g.id && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                      <input
                        type="number"
                        min="0"
                        autoFocus
                        placeholder="Amount saved"
                        value={savingsAmount}
                        onChange={(e) => setSavingsAmount(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddSavings(g)}
                        style={{ flex: 1, height: 32, padding: "0 8px", borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink)", fontSize: 13, outline: "none" }}
                      />
                      <button onClick={() => handleAddSavings(g)} disabled={update.isPending} className="sp-btn sp-btn-primary" style={{ height: 32, padding: "0 12px", fontSize: 12 }}>
                        {update.isPending ? "…" : "Add"}
                      </button>
                      <button onClick={() => { setAddSavingsGoalId(null); setSavingsAmount(""); }} className="sp-btn sp-btn-ghost" style={{ height: 32, padding: "0 8px", fontSize: 12 }}>
                        Cancel
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(g.id)}
                    disabled={!!promotingId}
                    style={{
                      marginTop: 8, width: "100%", height: 30,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      borderRadius: "var(--r-sm)",
                      border: "1px solid var(--line)",
                      background: "transparent",
                      color: "var(--ink-3)", fontSize: 12, fontWeight: 600,
                      cursor: promotingId ? "default" : "pointer",
                      transition: "all var(--d1) var(--e)",
                      opacity: promotingId && promotingId !== g.id ? 0.4 : 1,
                    }}
                    onMouseEnter={(e) => { if (!promotingId) { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand)"; e.currentTarget.style.background = "var(--brand-soft)"; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Star size={12} />
                    {promotingId === g.id ? "Setting…" : "Set as primary"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDelete
        open={!!deleteTarget}
        label={deleteTarget?.label}
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

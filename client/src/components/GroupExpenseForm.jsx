import { useState } from "react";
import Modal from "./Modal.jsx";
import { useCreateGroupExpense, useUpdateGroupExpense } from "../api/groups.js";
import { getCurrencySymbol } from "../utils/format.js";

const inputStyle = {
  width: "100%", height: 42, padding: "0 12px",
  borderRadius: "var(--r-sm)", border: "1px solid var(--line)",
  background: "var(--surface-2)", color: "var(--ink)", fontSize: 14, outline: "none",
};
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 };

const SPLIT_TYPES = [
  { value: "EQUAL", label: "Equal" },
  { value: "CUSTOM", label: "Custom" },
  { value: "PERCENTAGE", label: "Percentage" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function GroupExpenseForm({ open, onClose, groupId, members, currentUserId, initial }) {
  const create = useCreateGroupExpense(groupId);
  const update = useUpdateGroupExpense(groupId);

  const [description, setDescription] = useState(initial?.description || "");
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : "");
  const [paidById, setPaidById] = useState(initial?.paidById || currentUserId);
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : todayIso());
  const [splitType, setSplitType] = useState(initial?.splitType || "EQUAL");
  const [participantIds, setParticipantIds] = useState(
    initial ? initial.splits.map((s) => s.userId) : members.map((m) => m.userId)
  );
  const [customAmounts, setCustomAmounts] = useState(() => {
    const map = {};
    if (initial?.splitType === "CUSTOM") {
      for (const s of initial.splits) map[s.userId] = String(s.shareAmount);
    }
    return map;
  });
  const [percents, setPercents] = useState(() => {
    const map = {};
    if (initial?.splitType === "PERCENTAGE") {
      for (const s of initial.splits) map[s.userId] = String(s.sharePercent ?? "");
    }
    return map;
  });
  const [error, setError] = useState("");

  const amountNum = parseFloat(amount) || 0;

  const toggleParticipant = (userId) => {
    setParticipantIds((ids) =>
      ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId]
    );
  };

  const customSum = participantIds.reduce((acc, id) => acc + (parseFloat(customAmounts[id]) || 0), 0);
  const percentSum = participantIds.reduce((acc, id) => acc + (parseFloat(percents[id]) || 0), 0);

  const isValid =
    description.trim().length > 0 &&
    amountNum > 0 &&
    paidById &&
    participantIds.length > 0 &&
    (splitType !== "CUSTOM" || Math.abs(customSum - amountNum) < 0.01) &&
    (splitType !== "PERCENTAGE" || Math.abs(percentSum - 100) < 0.5);

  const handleSave = async () => {
    if (!isValid) {
      if (splitType === "CUSTOM") setError(`Custom amounts add up to ${customSum.toFixed(2)}, they need to total ${amountNum.toFixed(2)}.`);
      else if (splitType === "PERCENTAGE") setError(`Percentages add up to ${percentSum.toFixed(1)}%, they need to total 100%.`);
      else setError("Fill in a description, amount, and at least one participant.");
      return;
    }
    setError("");

    const splits = participantIds.map((userId) => {
      if (splitType === "CUSTOM") return { userId, shareAmount: parseFloat(customAmounts[userId]) || 0 };
      if (splitType === "PERCENTAGE") return { userId, sharePercent: parseFloat(percents[userId]) || 0 };
      return { userId };
    });

    const payload = {
      description: description.trim(),
      amount: amountNum,
      splitType,
      paidById,
      date: new Date(date).toISOString(),
      splits,
    };

    try {
      if (initial) await update.mutateAsync({ id: initial.id, ...payload });
      else await create.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit expense" : "Add group expense"}>
      <div style={{ display: "grid", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Description</label>
          <input style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Groceries" autoFocus />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Amount</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", fontSize: 14 }}>
                {getCurrencySymbol("INR")}
              </span>
              <input
                style={{ ...inputStyle, paddingLeft: 26 }}
                type="number" min="0" step="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Paid by</label>
          <select style={inputStyle} value={paidById} onChange={(e) => setPaidById(e.target.value)}>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.userId === currentUserId ? "You" : m.user?.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Split</label>
        <div style={{ display: "flex", gap: 6, background: "var(--surface-sunken)", borderRadius: "var(--r-sm)", padding: 4 }}>
          {SPLIT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setSplitType(t.value)}
              style={{
                flex: 1, height: 34, borderRadius: "var(--r-xs)", border: "none",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: splitType === t.value ? "var(--surface)" : "transparent",
                color: splitType === t.value ? "var(--ink)" : "var(--ink-3)",
                boxShadow: splitType === t.value ? "var(--sh-xs)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>Split between</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => {
            const checked = participantIds.includes(m.userId);
            return (
              <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, cursor: "pointer", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleParticipant(m.userId)}
                    style={{ accentColor: "var(--brand)", width: 15, height: 15, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 14, color: "var(--ink)" }}>
                    {m.userId === currentUserId ? "You" : m.user?.name}
                  </span>
                </label>
                {checked && splitType === "EQUAL" && participantIds.length > 0 && (
                  <span className="sp-num" style={{ fontSize: 13, color: "var(--ink-3)" }}>
                    {getCurrencySymbol("INR")}{(amountNum / participantIds.length).toFixed(2)}
                  </span>
                )}
                {checked && splitType === "CUSTOM" && (
                  <input
                    type="number" min="0" step="0.01"
                    value={customAmounts[m.userId] ?? ""}
                    onChange={(e) => setCustomAmounts((c) => ({ ...c, [m.userId]: e.target.value }))}
                    style={{ ...inputStyle, width: 90, height: 34, fontSize: 13 }}
                    placeholder="0"
                  />
                )}
                {checked && splitType === "PERCENTAGE" && (
                  <div style={{ position: "relative", width: 78 }}>
                    <input
                      type="number" min="0" max="100" step="0.1"
                      value={percents[m.userId] ?? ""}
                      onChange={(e) => setPercents((p) => ({ ...p, [m.userId]: e.target.value }))}
                      style={{ ...inputStyle, height: 34, fontSize: 13, paddingRight: 22 }}
                      placeholder="0"
                    />
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", fontSize: 12 }}>%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {splitType === "CUSTOM" && (
          <div style={{ marginTop: 8, fontSize: 12, color: Math.abs(customSum - amountNum) < 0.01 ? "var(--ink-3)" : "var(--neg)" }}>
            {getCurrencySymbol("INR")}{customSum.toFixed(2)} of {getCurrencySymbol("INR")}{amountNum.toFixed(2)} allocated
          </div>
        )}
        {splitType === "PERCENTAGE" && (
          <div style={{ marginTop: 8, fontSize: 12, color: Math.abs(percentSum - 100) < 0.5 ? "var(--ink-3)" : "var(--neg)" }}>
            {percentSum.toFixed(1)}% of 100% allocated
          </div>
        )}
      </div>

      {error && (
        <div style={{ fontSize: 13, color: "var(--neg)", background: "color-mix(in srgb, var(--neg) 10%, transparent)", borderRadius: "var(--r-sm)", padding: "10px 14px", marginTop: 10 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button className="sp-btn sp-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="sp-btn sp-btn-primary" style={{ flex: 1.4 }} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : initial ? "Save changes" : "Add expense"}
        </button>
      </div>
    </Modal>
  );
}

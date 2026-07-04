import { useState, useEffect } from "react";
import { useSetMonthlyBudget } from "../api/budgets.js";
import Modal from "./Modal.jsx";

export default function BudgetModal({
  open, onClose, currency, initialValue = "", hint, onSaved,
  month, year, useDefaultBudget = true,
}) {
  const setMonthlyBudget = useSetMonthlyBudget();
  const [input, setInput] = useState(initialValue);
  const [isDefault, setIsDefault] = useState(useDefaultBudget);

  useEffect(() => {
    if (open) {
      setInput(initialValue);
      setIsDefault(useDefaultBudget);
    }
  }, [open, initialValue, useDefaultBudget]);

  const save = async () => {
    const val = parseFloat(input) || null;
    if (!val) return;
    await setMonthlyBudget.mutateAsync({ month, year, amount: val, isDefault });
    onClose();
    onSaved?.();
  };

  return (
    <Modal open={open} onClose={onClose} title="Set monthly budget">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)" }}>
          {hint ?? "Your total spending limit per pay cycle."}
        </p>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "var(--ink-3)",
            fontSize: 13, pointerEvents: "none",
          }}>
            {currency}
          </span>
          <input
            type="number"
            min="0"
            step="1"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="e.g. 30000"
            style={{
              width: "100%", height: 44,
              paddingLeft: 48, paddingRight: 14,
              borderRadius: "var(--r-sm)",
              border: "1px solid var(--line)",
              background: "var(--surface-2)",
              color: "var(--ink)", fontSize: 14,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-2)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          Default (every month)
        </label>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="sp-btn sp-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="sp-btn sp-btn-primary"
            onClick={save}
            disabled={!input || setMonthlyBudget.isPending}
          >
            {setMonthlyBudget.isPending ? "Saving…" : "Save budget"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

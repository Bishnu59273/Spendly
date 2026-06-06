import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useCategories } from "../api/categories.js";
import { useTags } from "../api/tags.js";
import { useCreateExpense, useUpdateExpense } from "../api/expenses.js";

const today = () => new Date().toISOString().split("T")[0];

const fieldLabelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  letterSpacing: "0.04em", textTransform: "uppercase",
  color: "var(--ink-3)", marginBottom: 8,
};

const inputStyle = {
  width: "100%", height: 44, padding: "0 14px",
  borderRadius: "var(--r-sm)", border: "1px solid var(--line)",
  background: "var(--surface-2)", color: "var(--ink)", fontSize: 14.5, outline: "none",
};

export default function ExpenseForm({ open, onClose, expense = null }) {
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const create = useCreateExpense();
  const update = useUpdateExpense();

  const [form, setForm] = useState({
    amount: "",
    categoryId: "",
    date: today(),
    note: "",
    tagIds: [],
    isRecurring: false,
    recurringDay: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        amount: expense?.amount?.toString() || "",
        categoryId: expense?.categoryId || (categories[0]?.id || ""),
        date: expense ? expense.date.split("T")[0] : today(),
        note: expense?.note || "",
        tagIds: expense?.tags?.map((t) => t.tagId) || [],
        isRecurring: expense?.isRecurring || false,
        recurringDay: expense?.recurringDay?.toString() || "",
      });
      setError("");
    }
  }, [open, expense]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleTag = (id) => {
    set("tagIds", form.tagIds.includes(id) ? form.tagIds.filter((t) => t !== id) : [...form.tagIds, id]);
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.amount || !form.categoryId || !form.date) {
      setError("Amount, category, and date are required.");
      return;
    }
    const payload = {
      amount: parseFloat(form.amount),
      categoryId: form.categoryId,
      date: new Date(form.date).toISOString(),
      note: form.note || null,
      tagIds: form.tagIds,
      isRecurring: form.isRecurring,
      recurringDay: form.isRecurring && form.recurringDay ? parseInt(form.recurringDay) : null,
    };
    try {
      if (expense) await update.mutateAsync({ id: expense.id, ...payload });
      else await create.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <>
      {/* Scrim */}
      <div className={`sp-scrim${open ? " open" : ""}`} onClick={onClose} />

      {/* Modal */}
      <div style={{
        position: "fixed", zIndex: 91, left: "50%", top: "50%",
        transform: open ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-46%) scale(0.97)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: "transform var(--d2) var(--e), opacity var(--d2) var(--e)",
        width: 480, maxWidth: "94vw",
        background: "var(--surface)", borderRadius: "var(--r-xl)",
        boxShadow: "var(--sh-lg)", border: "1px solid var(--line)",
        overflow: "hidden",
      }}>
        {/* Amount hero */}
        <div style={{ padding: "24px 26px 20px", background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="sp-display" style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
              {expense ? "Edit expense" : "New expense"}
            </div>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 99, display: "grid", placeItems: "center",
                background: "var(--surface-sunken)", border: "none", color: "var(--ink-2)" }}
            >
              <X style={{ width: 17, height: 17 }} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="sp-display" style={{ fontSize: 38, fontWeight: 700, color: form.amount ? "var(--ink)" : "var(--ink-3)" }}>₹</span>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="0"
              autoFocus={open && !expense}
              className="sp-display sp-num"
              style={{ border: "none", background: "none", outline: "none", fontSize: 42, fontWeight: 700,
                width: "100%", color: "var(--ink)", letterSpacing: "-0.03em", fontFamily: "var(--display)" }}
            />
          </div>
        </div>

        {/* Fields */}
        <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 18, maxHeight: "60vh", overflowY: "auto" }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--neg-soft)", color: "var(--neg)", fontSize: 13, fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* Description */}
          <div>
            <label style={fieldLabelStyle}>Description</label>
            <input
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="e.g. Grocery run"
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* Date */}
          <div>
            <label style={fieldLabelStyle}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Category */}
          <div>
            <label style={fieldLabelStyle}>Category</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {categories.map((c) => {
                const on = form.categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => set("categoryId", c.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "9px 11px",
                      borderRadius: "var(--r-sm)",
                      border: `1px solid ${on ? "transparent" : "var(--line)"}`,
                      background: on ? c.color : "var(--surface-2)",
                      color: on ? "#fff" : "var(--ink-2)",
                      fontWeight: 600, fontSize: 12.5,
                      transition: "all var(--d1) var(--e)",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{c.icon}</span>{c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label style={fieldLabelStyle}>Tags</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tags.map((t) => {
                  const on = form.tagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        height: 28, padding: "0 12px", borderRadius: 99,
                        border: `1px solid ${on ? t.color : "var(--line)"}`,
                        background: on ? t.color + "22" : "var(--surface-2)",
                        color: on ? t.color : "var(--ink-2)",
                        fontWeight: 600, fontSize: 12.5,
                        transition: "all var(--d1) var(--e)",
                      }}
                    >
                      {t.icon} #{t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recurring toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <button
              type="button"
              onClick={() => set("isRecurring", !form.isRecurring)}
              style={{
                width: 42, height: 24, borderRadius: 99, padding: 2,
                background: form.isRecurring ? "var(--brand)" : "var(--surface-sunken)",
                transition: "background var(--d1) var(--e)", flex: "none", border: "none",
              }}
            >
              <span style={{
                display: "block", width: 20, height: 20, borderRadius: "50%",
                background: "#fff",
                transform: form.isRecurring ? "translateX(18px)" : "translateX(0)",
                transition: "transform var(--d1) var(--e)",
                boxShadow: "var(--sh-xs)",
              }} />
            </button>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-2)" }}>Recurring every cycle</span>
          </label>

          {form.isRecurring && (
            <div>
              <label style={fieldLabelStyle}>Repeat on day of month</label>
              <input
                type="number" min="1" max="31"
                value={form.recurringDay}
                onChange={(e) => set("recurringDay", e.target.value)}
                style={{ ...inputStyle, width: 100 }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 12, padding: "0 26px 24px" }}>
          <button className="sp-btn sp-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            className="sp-btn sp-btn-primary"
            style={{ flex: 1.4 }}
            onClick={handleSubmit}
            disabled={isPending}
          >
            <Check style={{ width: 17, height: 17 }} />
            {isPending ? "Saving…" : expense ? "Save changes" : "Add expense"}
          </button>
        </div>
      </div>
    </>
  );
}

import { useState, useEffect, useRef } from "react";
import { X, Check } from "lucide-react";
import { useCategories } from "../api/categories.js";
import { useTags } from "../api/tags.js";
import { useCreateExpense, useUpdateExpense } from "../api/expenses.js";

const today = () => new Date().toISOString().split("T")[0];

function nowTime() {
  const d = new Date();
  const h = d.getHours();
  return { hour: String(h % 12 || 12), minute: String(d.getMinutes()).padStart(2, "0"), period: h >= 12 ? "PM" : "AM" };
}

function parseTime(dateStr) {
  const d = new Date(dateStr);
  const h = d.getHours();
  return { hour: String(h % 12 || 12), minute: String(d.getMinutes()).padStart(2, "0"), period: h >= 12 ? "PM" : "AM" };
}

function buildDateTime(date, hour, minute, period) {
  const [y, m, day] = date.split("-").map(Number);
  let h = parseInt(hour) || 12;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return new Date(y, m - 1, day, h, parseInt(minute) || 0, 0).toISOString();
}

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

const numInputStyle = {
  height: 44, padding: "0 10px", textAlign: "center",
  borderRadius: "var(--r-sm)", border: "1px solid var(--line)",
  background: "var(--surface-2)", color: "var(--ink)", fontSize: 15,
  fontWeight: 600, outline: "none", width: 62,
};

export default function ExpenseForm({ open, onClose, expense = null }) {
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const create = useCreateExpense();
  const update = useUpdateExpense();

  const [form, setForm] = useState({
    amount: "", categoryId: "", date: today(), note: "",
    tagIds: [], isRecurring: false, recurringDay: "",
    hour: "12", minute: "00", period: "PM",
  });
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const amountRef = useRef(null);
  const dateRef = useRef(null);
  const categoryRef = useRef(null);

  useEffect(() => {
    if (open) {
      const t = expense ? parseTime(expense.date) : nowTime();
      setForm({
        amount: expense?.amount?.toString() || "",
        categoryId: expense?.categoryId || (categories[0]?.id || ""),
        date: expense ? expense.date.split("T")[0] : today(),
        note: expense?.note || "",
        tagIds: expense?.tags?.map((t) => t.tagId) || [],
        isRecurring: expense?.isRecurring || false,
        recurringDay: expense?.recurringDay?.toString() || "",
        hour: t.hour, minute: t.minute, period: t.period,
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
    if (!form.amount) { setInvalidField("amount"); amountRef.current?.focus(); amountRef.current?.select(); return; }
    if (!form.date) { setInvalidField("date"); dateRef.current?.focus(); return; }
    if (!form.categoryId) { setInvalidField("category"); categoryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }

    const payload = {
      amount: parseFloat(form.amount),
      categoryId: form.categoryId,
      date: buildDateTime(form.date, form.hour, form.minute, form.period),
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
      <div className={`sp-scrim${open ? " open" : ""}`} onClick={onClose} />

      <div
        className={`sp-modal-sheet${open ? " sp-modal-open" : ""}`}
        style={{
          position: "fixed", zIndex: 91, left: "50%", top: "50%",
          transform: open ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-46%) scale(0.97)",
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: "transform var(--d2) var(--e), opacity var(--d2) var(--e)",
          width: 480, maxWidth: "94vw",
          background: "var(--surface)", borderRadius: "var(--r-xl)",
          boxShadow: "var(--sh-lg)", border: "1px solid var(--line)", overflow: "hidden",
        }}
      >
        <div className="sp-sheet-handle" style={{ display: "none", justifyContent: "center", padding: "10px 0 2px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--line-strong)" }} />
        </div>

        <div style={{ padding: "20px 26px 20px", background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="sp-display" style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
              {expense ? "Edit expense" : "New expense"}
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, display: "grid", placeItems: "center", background: "var(--surface-sunken)", border: "none", color: "var(--ink-2)" }}>
              <X style={{ width: 17, height: 17 }} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: "var(--r-sm)", outline: invalidField === "amount" ? "2px solid var(--neg)" : "none", outlineOffset: 4, transition: "outline var(--d1) var(--e)" }}>
            <span className="sp-display" style={{ fontSize: 38, fontWeight: 700, color: invalidField === "amount" ? "var(--neg)" : form.amount ? "var(--ink)" : "var(--ink-3)" }}>&#8377;</span>
            <input
              ref={amountRef}
              type="number"
              value={form.amount}
              onChange={(e) => { set("amount", e.target.value); setInvalidField(""); }}
              placeholder="0"
              autoFocus={open && !expense}
              className="sp-display sp-num"
              style={{ border: "none", background: "none", outline: "none", fontSize: 42, fontWeight: 700, width: "100%", color: invalidField === "amount" ? "var(--neg)" : "var(--ink)", letterSpacing: "-0.03em", fontFamily: "var(--display)" }}
            />
          </div>
        </div>

        <div className="sp-modal-fields" style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 18, maxHeight: "60vh", overflowY: "auto" }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--neg-soft)", color: "var(--neg)", fontSize: 13, fontWeight: 500 }}>{error}</div>
          )}

          <div>
            <label style={fieldLabelStyle}>Description</label>
            <input value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="e.g. Grocery run" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          </div>

          {/* Date + Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <label style={{ ...fieldLabelStyle, color: invalidField === "date" ? "var(--neg)" : "var(--ink-3)" }}>Date</label>
              <input
                ref={dateRef}
                type="date"
                value={form.date}
                onChange={(e) => { set("date", e.target.value); setInvalidField(""); }}
                style={{ ...inputStyle, border: `1px solid ${invalidField === "date" ? "var(--neg)" : "var(--line)"}`, boxShadow: invalidField === "date" ? "0 0 0 3px var(--neg-soft)" : "none" }}
              />
            </div>

            <div>
              <label style={fieldLabelStyle}>Time</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number" min="1" max="12"
                  value={form.hour}
                  onChange={(e) => { let v = Math.min(12, Math.max(1, parseInt(e.target.value) || 1)); set("hour", String(v)); }}
                  style={numInputStyle}
                />
                <span style={{ fontWeight: 700, color: "var(--ink-3)", fontSize: 18 }}>:</span>
                <input
                  type="number" min="0" max="59"
                  value={form.minute}
                  onChange={(e) => { let v = Math.min(59, Math.max(0, parseInt(e.target.value) || 0)); set("minute", String(v).padStart(2, "0")); }}
                  style={numInputStyle}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {["AM", "PM"].map((p) => (
                    <button key={p} type="button" onClick={() => set("period", p)}
                      style={{ height: 20, padding: "0 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "none", background: form.period === p ? "var(--brand)" : "var(--surface-sunken)", color: form.period === p ? "#fff" : "var(--ink-3)", cursor: "pointer", transition: "all var(--d1) var(--e)" }}
                    >{p}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div ref={categoryRef}>
            <label style={{ ...fieldLabelStyle, color: invalidField === "category" ? "var(--neg)" : "var(--ink-3)" }}>Category</label>
            <div className="sp-cat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, padding: invalidField === "category" ? 6 : 0, borderRadius: "var(--r-sm)", border: `1px solid ${invalidField === "category" ? "var(--neg)" : "transparent"}`, boxShadow: invalidField === "category" ? "0 0 0 3px var(--neg-soft)" : "none", transition: "border-color var(--d1) var(--e), box-shadow var(--d1) var(--e)" }}>
              {categories.map((c) => {
                const on = form.categoryId === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => { set("categoryId", c.id); setInvalidField(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: "var(--r-sm)", border: `1px solid ${on ? "transparent" : "var(--line)"}`, background: on ? c.color : "var(--surface-2)", color: on ? "#fff" : "var(--ink-2)", fontWeight: 600, fontSize: 12.5, transition: "all var(--d1) var(--e)" }}
                  >
                    <span style={{ fontSize: 16 }}>{c.icon}</span>{c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <label style={fieldLabelStyle}>Tags</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tags.map((t) => {
                  const on = form.tagIds.includes(t.id);
                  return (
                    <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 28, padding: "0 12px", borderRadius: 99, border: `1px solid ${on ? t.color : "var(--line)"}`, background: on ? t.color + "22" : "var(--surface-2)", color: on ? t.color : "var(--ink-2)", fontWeight: 600, fontSize: 12.5, transition: "all var(--d1) var(--e)" }}
                    >{t.icon} #{t.name}</button>
                  );
                })}
              </div>
            </div>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <button type="button" onClick={() => set("isRecurring", !form.isRecurring)}
              style={{ width: 42, height: 24, borderRadius: 99, padding: 2, background: form.isRecurring ? "var(--brand)" : "var(--surface-sunken)", transition: "background var(--d1) var(--e)", flex: "none", border: "none" }}
            >
              <span style={{ display: "block", width: 20, height: 20, borderRadius: "50%", background: "#fff", transform: form.isRecurring ? "translateX(18px)" : "translateX(0)", transition: "transform var(--d1) var(--e)", boxShadow: "var(--sh-xs)" }} />
            </button>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-2)" }}>Recurring every cycle</span>
          </label>

          {form.isRecurring && (
            <div>
              <label style={fieldLabelStyle}>Repeat on day of month</label>
              <input type="number" min="1" max="31" value={form.recurringDay} onChange={(e) => set("recurringDay", e.target.value)} style={{ ...inputStyle, width: 100 }} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, padding: "0 26px 24px" }}>
          <button className="sp-btn sp-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="sp-btn sp-btn-primary" style={{ flex: 1.4 }} onClick={handleSubmit} disabled={isPending}>
            <Check style={{ width: 17, height: 17 }} />
            {isPending ? "Saving..." : expense ? "Save changes" : "Add expense"}
          </button>
        </div>
      </div>
    </>
  );
}

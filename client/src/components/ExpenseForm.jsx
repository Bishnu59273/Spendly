import { useState, useEffect, useRef } from "react";
import { X, Check, Calculator, Clock, AlertTriangle } from "lucide-react";
import { useMe } from "../api/auth.js";
import { getCurrencySymbol } from "../utils/format.js";
import { getCycleRange, formatCycleLabel } from "../utils/cycle.js";
import { useCategories, useCreateCategory } from "../api/categories.js";
import { useTags, useCreateTag } from "../api/tags.js";
import { useCreateExpense, useUpdateExpense } from "../api/expenses.js";
import { useHabitSuggestions } from "../api/suggestions.js";
import {
  useIncomeSources,
  useCreateIncomeSource,
  useDeleteIncomeSource,
} from "../api/incomeSources.js";
import EmojiPicker from "./EmojiPicker.jsx";
import InlineCalculator from "./InlineCalculator.jsx";
import TimeWheelPicker from "./TimeWheelPicker.jsx";

const CAT_COLORS = [
  "#F97316",
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#6B7280",
  "#14B8A6",
  "#F43F5E",
  "#84CC16",
  "#0EA5E9",
];

const today = () => new Date().toISOString().split("T")[0];

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function parseTime(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function buildDateTime(date, time) {
  const [y, m, day] = date.split("-").map(Number);
  const [h, min] = (time || "00:00").split(":").map(Number);
  return new Date(y, m - 1, day, h || 0, min || 0, 0).toISOString();
}

function formatTime12(time) {
  const [hStr, mStr] = (time || "00:00").split(":");
  const h24 = parseInt(hStr, 10) || 0;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${mStr} ${period}`;
}

// Converts a UTC minute-of-day (from the server) into the viewer's own local
// time for display - the average was computed in UTC since the server's
// timezone isn't necessarily the user's.
function formatTypicalTime(minuteOfDayUtc) {
  if (minuteOfDayUtc == null) return null;
  const d = new Date();
  d.setUTCHours(0, minuteOfDayUtc, 0, 0);
  const h24 = d.getHours();
  const m = d.getMinutes();
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

const fieldLabelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
  marginBottom: 8,
};

const inputStyle = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  borderRadius: "var(--r-sm)",
  border: "1px solid var(--line)",
  background: "var(--surface-2)",
  color: "var(--ink)",
  fontSize: 14.5,
  outline: "none",
};

export default function ExpenseForm({ open, onClose, expense = null }) {
  const { data: me } = useMe();
  const currencySymbol = getCurrencySymbol(me?.currency);
  const { cycleStart: currentCycleStart, cycleEnd: currentCycleEnd } =
    getCycleRange(me?.salaryDay ?? 1);
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const { data: incomeSources = [] } = useIncomeSources();
  const { data: habitSuggestions } = useHabitSuggestions({
    enabled: open && !expense,
  });
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const createCategory = useCreateCategory();
  const createSource = useCreateIncomeSource();
  const deleteSource = useDeleteIncomeSource();

  const [txType, setTxType] = useState("EXPENSE");
  const [incomeMode, setIncomeMode] = useState("source");
  const [form, setForm] = useState({
    amount: "",
    categoryId: "",
    sourceId: "",
    date: today(),
    note: "",
    tagIds: [],
    isRecurring: false,
    recurringDay: "",
    time: "12:00",
  });
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({
    name: "",
    color: "#6366f1",
    icon: "📁",
  });
  const [quickError, setQuickError] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const createTag = useCreateTag();
  const [quickAddTag, setQuickAddTag] = useState(false);
  const [quickTagForm, setQuickTagForm] = useState({
    name: "",
    color: "#6366f1",
    icon: "🏷️",
  });
  const [quickTagError, setQuickTagError] = useState("");
  const [showTagIconPicker, setShowTagIconPicker] = useState(false);
  // source quick-add
  const [quickAddSource, setQuickAddSource] = useState(false);
  const [quickSourceForm, setQuickSourceForm] = useState({
    name: "",
    icon: "💰",
  });
  const [quickSourceError, setQuickSourceError] = useState("");
  const [showSourceIconPicker, setShowSourceIconPicker] = useState(false);

  const [calcOpen, setCalcOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const amountRef = useRef(null);
  const dateRef = useRef(null);
  const categoryRef = useRef(null);
  const sourceRef = useRef(null);
  const originalDateKeyRef = useRef(null);
  const [crossCycleWarning, setCrossCycleWarning] = useState(null);

  useEffect(() => {
    if (open) {
      const t = expense ? parseTime(expense.date) : nowTime();
      originalDateKeyRef.current = expense
        ? `${expense.date.split("T")[0]}T${t}`
        : null;
      setCrossCycleWarning(null);
      setTxType(expense?.type || "EXPENSE");
      setIncomeMode(
        expense?.type === "INCOME" && expense?.categoryId
          ? "category"
          : "source",
      );
      setForm({
        amount: expense?.amount?.toString() || "",
        categoryId: expense?.categoryId || categories[0]?.id || "",
        sourceId: expense?.sourceId || "",
        date: expense ? expense.date.split("T")[0] : today(),
        note: expense?.note || "",
        tagIds: expense?.tags?.map((t) => t.tagId) || [],
        isRecurring: expense?.isRecurring || false,
        recurringDay: expense?.recurringDay?.toString() || "",
        time: t,
      });
      setError("");
      setQuickAdd(false);
      setQuickForm({ name: "", color: "#6366f1", icon: "📁" });
      setQuickError("");
      setShowIconPicker(false);
      setShowAllCats(false);
      setQuickAddTag(false);
      setQuickTagForm({ name: "", color: "#6366f1", icon: "🏷️" });
      setQuickTagError("");
      setShowTagIconPicker(false);
      setQuickAddSource(false);
      setQuickSourceForm({ name: "", icon: "💰" });
      setQuickSourceError("");
      setShowSourceIconPicker(false);
      setCalcOpen(false);
      setTimePickerOpen(false);
    }
  }, [open, expense]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleTag = (id) => {
    set(
      "tagIds",
      form.tagIds.includes(id)
        ? form.tagIds.filter((t) => t !== id)
        : [...form.tagIds, id],
    );
  };

  const applySuggestion = (s) => {
    set("note", s.note);
    if (s.amount != null) set("amount", String(s.amount));
    if (s.category?.id) set("categoryId", s.category.id);
    set("tagIds", s.tagIds || []);
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.amount) {
      setInvalidField("amount");
      amountRef.current?.focus();
      amountRef.current?.select();
      return;
    }
    if (!form.date) {
      setInvalidField("date");
      dateRef.current?.focus();
      return;
    }
    if (txType === "INCOME" && incomeMode === "source" && !form.sourceId) {
      setInvalidField("source");
      sourceRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (
      (txType === "EXPENSE" ||
        (txType === "INCOME" && incomeMode === "category")) &&
      !form.categoryId
    ) {
      setInvalidField("category");
      categoryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    if (me?.salaryDay) {
      const dateTimeKey = `${form.date}T${form.time}`;
      const dateChanged =
        !expense || dateTimeKey !== originalDateKeyRef.current;
      const pickedDateTime = new Date(buildDateTime(form.date, form.time));
      const inCurrentCycle =
        pickedDateTime >= currentCycleStart &&
        pickedDateTime <= currentCycleEnd;

      if (dateChanged && !inCurrentCycle) {
        const pickedCycle = getCycleRange(me.salaryDay, pickedDateTime);
        setCrossCycleWarning({
          pickedLabel: formatCycleLabel(
            pickedCycle.cycleStart,
            pickedCycle.cycleEnd,
          ),
          currentLabel: formatCycleLabel(currentCycleStart, currentCycleEnd),
        });
        return;
      }
    }

    await submitExpense();
  };

  const submitExpense = async () => {
    const payload = {
      amount: parseFloat(form.amount),
      type: txType,
      ...(txType === "EXPENSE" ||
      (txType === "INCOME" && incomeMode === "category")
        ? { categoryId: form.categoryId }
        : { sourceId: form.sourceId }),
      date: buildDateTime(form.date, form.time),
      note: form.note || null,
      tagIds: form.tagIds,
      isRecurring: form.isRecurring,
      recurringDay:
        form.isRecurring && form.recurringDay
          ? parseInt(form.recurringDay)
          : null,
    };
    try {
      if (expense) await update.mutateAsync({ id: expense.id, ...payload });
      else await create.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  const handleConfirmCrossCycle = async () => {
    setCrossCycleWarning(null);
    await submitExpense();
  };

  const handleQuickAddCategory = async () => {
    if (!quickForm.name.trim()) {
      setQuickError("Name is required");
      return;
    }
    try {
      const newCat = await createCategory.mutateAsync(quickForm);
      set("categoryId", newCat.id);
      setQuickAdd(false);
      setQuickForm({ name: "", color: "#6366f1", icon: "📁" });
      setQuickError("");
      setShowIconPicker(false);
      setInvalidField("");
    } catch {
      setQuickError("Failed to create category");
    }
  };

  const handleQuickAddSource = async () => {
    if (!quickSourceForm.name.trim()) {
      setQuickSourceError("Name is required");
      return;
    }
    try {
      const newSrc = await createSource.mutateAsync(quickSourceForm);
      set("sourceId", newSrc.id);
      setQuickAddSource(false);
      setQuickSourceForm({ name: "", icon: "💰" });
      setQuickSourceError("");
      setShowSourceIconPicker(false);
      setInvalidField("");
    } catch {
      setQuickSourceError("Failed to create source");
    }
  };

  const handleQuickAddTag = async () => {
    if (!quickTagForm.name.trim()) {
      setQuickTagError("Name is required");
      return;
    }
    try {
      const newTag = await createTag.mutateAsync(quickTagForm);
      set("tagIds", [...form.tagIds, newTag.id]);
      setQuickAddTag(false);
      setQuickTagForm({ name: "", color: "#6366f1", icon: "🏷️" });
      setQuickTagError("");
      setShowTagIconPicker(false);
    } catch {
      setQuickTagError("Failed to create tag");
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <>
      <div className={`sp-scrim${open ? " open" : ""}`} onClick={onClose} />

      <div
        className={`sp-modal-sheet${open ? " sp-modal-open" : ""}`}
        style={{
          position: "fixed",
          zIndex: 91,
          left: "50%",
          top: "50%",
          transform: open
            ? "translate(-50%,-50%) scale(1)"
            : "translate(-50%,-46%) scale(0.97)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition:
            "transform var(--d2) var(--e), opacity var(--d2) var(--e)",
          width: 480,
          maxWidth: "94vw",
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--sh-lg)",
          border: "1px solid var(--line)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        <div
          className="sp-sheet-handle"
          style={{
            display: "none",
            justifyContent: "center",
            padding: "10px 0 2px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 99,
              background: "var(--line-strong)",
            }}
          />
        </div>

        <div
          style={{
            padding: "20px 26px 20px",
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--line)",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div
              className="sp-display"
              style={{
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.02em",
              }}
            >
              {expense
                ? txType === "INCOME"
                  ? "Edit income"
                  : "Edit expense"
                : txType === "INCOME"
                  ? "New income"
                  : "New expense"}
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 99,
                display: "grid",
                placeItems: "center",
                background: "var(--surface-sunken)",
                border: "none",
                color: "var(--ink-2)",
              }}
            >
              <X style={{ width: 17, height: 17 }} />
            </button>
          </div>

          {/* Type toggle */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 16,
              background: "var(--surface-sunken)",
              borderRadius: "var(--r-sm)",
              padding: 3,
            }}
          >
            {[
              { value: "EXPENSE", label: "− Expense" },
              { value: "INCOME", label: "+ Income" },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTxType(value)}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: "calc(var(--r-sm) - 2px)",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all var(--d1) var(--e)",
                  background:
                    txType === value
                      ? value === "INCOME"
                        ? "var(--brand)"
                        : "#a31622"
                      : "transparent",
                  color: txType === value ? "#fff" : "var(--ink-3)",
                  boxShadow: txType === value ? "var(--sh-xs)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: "var(--r-sm)",
              outline:
                invalidField === "amount" ? "2px solid var(--neg)" : "none",
              outlineOffset: 4,
              transition: "outline var(--d1) var(--e)",
            }}
          >
            <span
              className="sp-display"
              style={{
                fontSize: 38,
                fontWeight: 700,
                color:
                  invalidField === "amount"
                    ? "var(--neg)"
                    : form.amount
                      ? "var(--ink)"
                      : "var(--ink-3)",
              }}
            >
              {currencySymbol}
            </span>
            <input
              ref={amountRef}
              type="number"
              value={form.amount}
              onChange={(e) => {
                set("amount", e.target.value);
                setInvalidField("");
              }}
              placeholder="0"
              autoFocus={open && !expense}
              className="sp-display sp-num"
              style={{
                border: "none",
                background: "none",
                outline: "none",
                fontSize: 42,
                fontWeight: 700,
                width: "100%",
                color: invalidField === "amount" ? "var(--neg)" : "var(--ink)",
                letterSpacing: "-0.03em",
                fontFamily: "var(--display)",
              }}
            />
          </div>

          <div style={{ display: "flex", marginTop: 8 }}>
            <button
              type="button"
              onClick={() => {
                amountRef.current?.blur();
                setCalcOpen((v) => !v);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                height: 26,
                padding: "0 10px",
                borderRadius: "var(--r-pill, 999px)",
                border: "1.5px solid var(--brand)",
                background: calcOpen ? "var(--brand)" : "var(--brand-soft)",
                color: calcOpen ? "#fff" : "var(--brand)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all var(--d1) var(--e)",
              }}
            >
              <Calculator style={{ width: 13, height: 13 }} />
              {calcOpen ? "Close calculator" : "Calculator"}
            </button>
          </div>

          <InlineCalculator
            open={calcOpen}
            currencySymbol={currencySymbol}
            initialValue={form.amount}
            onConfirm={(val) => {
              set("amount", val);
              setInvalidField("");
              setCalcOpen(false);
              amountRef.current?.focus();
            }}
            onClose={() => setCalcOpen(false)}
          />
        </div>

        <div
          className="sp-modal-fields"
          style={{
            padding: "22px 26px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--r-sm)",
                background: "var(--neg-soft)",
                color: "var(--neg)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {!expense &&
            txType === "EXPENSE" &&
            (habitSuggestions?.dailyHabits?.length > 0 ||
              habitSuggestions?.frequentHabits?.length > 0) &&
            (() => {
              const [topHabit, ...restDaily] = habitSuggestions.dailyHabits;
              const otherSuggestions = [
                ...restDaily,
                ...habitSuggestions.frequentHabits,
              ];
              return (
                <div>
                  <label style={fieldLabelStyle}>Quick fill</label>

                  {topHabit && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: "var(--r-sm)",
                        background: "var(--brand-soft)",
                        marginBottom: otherSuggestions.length ? 10 : 0,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          borderRadius: 99,
                          background: "var(--surface-2)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 18,
                        }}
                      >
                        {topHabit.category?.icon || "🔁"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14.5,
                            color: "var(--ink)",
                          }}
                        >
                          {topHabit.note} {currencySymbol}
                          {topHabit.amount}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                          You log this most days around{" "}
                          {formatTypicalTime(topHabit.typicalMinuteOfDayUtc)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => applySuggestion(topHabit)}
                        style={{
                          flexShrink: 0,
                          height: 34,
                          padding: "0 16px",
                          borderRadius: 99,
                          border: "none",
                          background: "var(--brand)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        Use
                      </button>
                    </div>
                  )}

                  {otherSuggestions.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {otherSuggestions.map((s, i) => (
                        <button
                          key={`${s.note}-${i}`}
                          type="button"
                          onClick={() => applySuggestion(s)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            height: 30,
                            padding: "0 12px",
                            borderRadius: 99,
                            border: "1px solid var(--line)",
                            background: "var(--surface-2)",
                            color: "var(--ink-2)",
                            fontWeight: 600,
                            fontSize: 12.5,
                          }}
                        >
                          <span>{s.category?.icon || "🔁"}</span>
                          <span>{s.note}</span>
                          {s.amount != null && (
                            <span
                              style={{ color: "var(--ink-3)", fontWeight: 500 }}
                            >
                              {currencySymbol}
                              {s.amount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

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

          {/* Date + Time */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  ...fieldLabelStyle,
                  color:
                    invalidField === "date" ? "var(--neg)" : "var(--ink-3)",
                }}
              >
                Date
              </label>
              <input
                ref={dateRef}
                type="date"
                value={form.date}
                onChange={(e) => {
                  set("date", e.target.value);
                  setInvalidField("");
                }}
                style={{
                  ...inputStyle,
                  border: `1px solid ${invalidField === "date" ? "var(--neg)" : "var(--line)"}`,
                  boxShadow:
                    invalidField === "date"
                      ? "0 0 0 3px var(--neg-soft)"
                      : "none",
                }}
              />
            </div>

            <div>
              <label style={fieldLabelStyle}>Time</label>
              <button
                type="button"
                onClick={() => setTimePickerOpen((v) => !v)}
                style={{
                  ...inputStyle,
                  width: 140,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  border: `1px solid ${timePickerOpen ? "var(--brand)" : "var(--line)"}`,
                }}
              >
                <span>{formatTime12(form.time)}</span>
                <Clock
                  style={{
                    width: 15,
                    height: 15,
                    color: "var(--ink-3)",
                    flexShrink: 0,
                  }}
                />
              </button>
            </div>
          </div>

          <TimeWheelPicker
            open={timePickerOpen}
            value={form.time}
            onChange={(v) => set("time", v)}
          />

          {txType === "INCOME" && (
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 3,
                  background: "var(--surface-sunken)",
                  borderRadius: 10,
                  padding: 3,
                  width: "fit-content",
                  marginBottom: 8,
                }}
              >
                {[
                  { value: "category", label: "Category" },
                  { value: "source", label: "Other source" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setIncomeMode(value);
                      setInvalidField("");
                    }}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 7,
                      border: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      background:
                        incomeMode === value ? "var(--surface)" : "transparent",
                      color:
                        incomeMode === value ? "var(--ink)" : "var(--ink-3)",
                      boxShadow: incomeMode === value ? "var(--sh-xs)" : "none",
                      transition: "all var(--d1) var(--e)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--ink-3)",
                  marginBottom: 12,
                }}
              >
                {incomeMode === "category"
                  ? "Refunds a category - reduces that category's spending everywhere."
                  : "General income - only reduces your total spent, not any category."}
              </div>
            </div>
          )}

          {txType === "INCOME" && incomeMode === "source" ? (
            /* ── Source picker (income only) ─────────────────────── */
            <div ref={sourceRef}>
              <label
                style={{
                  ...fieldLabelStyle,
                  color:
                    invalidField === "source" ? "var(--neg)" : "var(--ink-3)",
                }}
              >
                Source
              </label>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  padding: invalidField === "source" ? 6 : 0,
                  borderRadius: "var(--r-sm)",
                  border: `1px solid ${invalidField === "source" ? "var(--neg)" : "transparent"}`,
                  boxShadow:
                    invalidField === "source"
                      ? "0 0 0 3px var(--neg-soft)"
                      : "none",
                  transition:
                    "border-color var(--d1) var(--e), box-shadow var(--d1) var(--e)",
                }}
              >
                {incomeSources.map((s) => {
                  const on = form.sourceId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        set("sourceId", s.id);
                        setInvalidField("");
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        height: 36,
                        padding: "0 14px",
                        borderRadius: 99,
                        border: `1px solid ${on ? "#16a34a" : "var(--line)"}`,
                        background: on ? "#16a34a" : "var(--surface-2)",
                        color: on ? "#fff" : "var(--ink-2)",
                        fontWeight: 600,
                        fontSize: 13,
                        transition: "all var(--d1) var(--e)",
                      }}
                    >
                      <span style={{ fontSize: 15 }}>{s.icon}</span>
                      {s.name}
                      {!s.isDefault && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSource.mutate(s.id);
                            if (form.sourceId === s.id) set("sourceId", "");
                          }}
                          style={{
                            marginLeft: 2,
                            opacity: 0.6,
                            fontSize: 11,
                            lineHeight: 1,
                            cursor: "pointer",
                          }}
                          title="Remove"
                        >
                          ✕
                        </span>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddSource((v) => !v);
                    setQuickSourceError("");
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    height: 36,
                    padding: "0 14px",
                    borderRadius: 99,
                    border: `1px dashed ${quickAddSource ? "#16a34a" : "var(--line)"}`,
                    background: quickAddSource ? "#16a34a11" : "transparent",
                    color: quickAddSource ? "#16a34a" : "var(--ink-3)",
                    fontWeight: 600,
                    fontSize: 13,
                    transition: "all var(--d1) var(--e)",
                  }}
                >
                  + New
                </button>
              </div>

              {quickAddSource && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "14px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowSourceIconPicker((v) => !v)}
                      title="Change icon"
                      style={{
                        width: 46,
                        height: 44,
                        flexShrink: 0,
                        fontSize: 22,
                        borderRadius: "var(--r-sm)",
                        border: `1px solid ${showSourceIconPicker ? "#16a34a" : "var(--line)"}`,
                        background: showSourceIconPicker
                          ? "#16a34a11"
                          : "var(--surface-2)",
                        cursor: "pointer",
                        transition: "all var(--d1) var(--e)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {quickSourceForm.icon}
                    </button>
                    <input
                      type="text"
                      value={quickSourceForm.name}
                      onChange={(e) => {
                        setQuickSourceForm((f) => ({
                          ...f,
                          name: e.target.value,
                        }));
                        setQuickSourceError("");
                      }}
                      placeholder="Source name"
                      autoFocus={!showSourceIconPicker}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleQuickAddSource()
                      }
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>

                  {showSourceIconPicker && (
                    <div
                      style={{
                        borderRadius: "var(--r-sm)",
                        border: "1px solid var(--line)",
                        background: "var(--surface)",
                        padding: 10,
                      }}
                    >
                      <EmojiPicker
                        value={quickSourceForm.icon}
                        onChange={(e) => {
                          setQuickSourceForm((f) => ({ ...f, icon: e }));
                          setShowSourceIconPicker(false);
                        }}
                      />
                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--ink-3)",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Or type:
                        </span>
                        <input
                          type="text"
                          maxLength={2}
                          value={quickSourceForm.icon}
                          onChange={(e) => {
                            if (e.target.value)
                              setQuickSourceForm((f) => ({
                                ...f,
                                icon: e.target.value,
                              }));
                          }}
                          placeholder="😊"
                          style={{
                            ...inputStyle,
                            height: 34,
                            width: 54,
                            textAlign: "center",
                            fontSize: 18,
                            padding: "0 8px",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {quickSourceError && (
                    <div style={{ fontSize: 12, color: "var(--neg)" }}>
                      {quickSourceError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickAddSource(false);
                        setQuickSourceError("");
                        setShowSourceIconPicker(false);
                      }}
                      className="sp-btn sp-btn-ghost"
                      style={{ flex: 1, height: 34, fontSize: 13 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddSource}
                      disabled={createSource.isPending}
                      className="sp-btn sp-btn-primary"
                      style={{
                        flex: 1.5,
                        height: 34,
                        fontSize: 13,
                        background: "#16a34a",
                      }}
                    >
                      {createSource.isPending ? "Adding…" : "Add source"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Category picker (expense only) ──────────────────── */
            <div ref={categoryRef}>
              <label
                style={{
                  ...fieldLabelStyle,
                  color:
                    invalidField === "category" ? "var(--neg)" : "var(--ink-3)",
                }}
              >
                Category
              </label>
              {(() => {
                const CAT_LIMIT = 9;
                const selectedIdx = categories.findIndex(
                  (c) => c.id === form.categoryId,
                );
                const expanded = showAllCats || selectedIdx >= CAT_LIMIT;
                const visible = expanded
                  ? categories
                  : categories.slice(0, CAT_LIMIT);
                const hiddenCount = categories.length - CAT_LIMIT;
                return (
                  <div
                    className="sp-cat-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 8,
                      padding: invalidField === "category" ? 6 : 0,
                      borderRadius: "var(--r-sm)",
                      border: `1px solid ${invalidField === "category" ? "var(--neg)" : "transparent"}`,
                      boxShadow:
                        invalidField === "category"
                          ? "0 0 0 3px var(--neg-soft)"
                          : "none",
                      transition:
                        "border-color var(--d1) var(--e), box-shadow var(--d1) var(--e)",
                    }}
                  >
                    {visible.map((c) => {
                      const on = form.categoryId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            set("categoryId", c.id);
                            setInvalidField("");
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "9px 11px",
                            borderRadius: "var(--r-sm)",
                            border: `1px solid ${on ? "transparent" : "var(--line)"}`,
                            background: on ? c.color : "var(--surface-2)",
                            color: on ? "#fff" : "var(--ink-2)",
                            fontWeight: 600,
                            fontSize: 12.5,
                            transition: "all var(--d1) var(--e)",
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{c.icon}</span>
                          {c.name}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setQuickAdd((v) => !v);
                        setQuickError("");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "9px 11px",
                        borderRadius: "var(--r-sm)",
                        border: `1px dashed ${quickAdd ? "var(--brand)" : "var(--line)"}`,
                        background: quickAdd
                          ? "var(--brand-soft)"
                          : "transparent",
                        color: quickAdd ? "var(--brand)" : "var(--ink-3)",
                        fontWeight: 600,
                        fontSize: 12.5,
                        transition: "all var(--d1) var(--e)",
                      }}
                    >
                      + New
                    </button>
                    {categories.length > CAT_LIMIT && (
                      <button
                        type="button"
                        onClick={() => setShowAllCats((v) => !v)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "9px 11px",
                          borderRadius: "var(--r-sm)",
                          border: "1px solid var(--line)",
                          background: "transparent",
                          color: "var(--ink-3)",
                          fontWeight: 600,
                          fontSize: 12.5,
                          transition: "all var(--d1) var(--e)",
                        }}
                      >
                        {expanded ? "Show less" : `+ ${hiddenCount} more`}
                      </button>
                    )}
                  </div>
                );
              })()}

              {quickAdd && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "14px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowIconPicker((v) => !v)}
                      title="Change icon"
                      style={{
                        width: 46,
                        height: 44,
                        flexShrink: 0,
                        fontSize: 22,
                        borderRadius: "var(--r-sm)",
                        border: `1px solid ${showIconPicker ? "var(--brand)" : "var(--line)"}`,
                        background: showIconPicker
                          ? "var(--brand-soft)"
                          : "var(--surface-2)",
                        cursor: "pointer",
                        transition: "all var(--d1) var(--e)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {quickForm.icon}
                    </button>
                    <input
                      type="text"
                      value={quickForm.name}
                      onChange={(e) => {
                        setQuickForm((f) => ({ ...f, name: e.target.value }));
                        setQuickError("");
                      }}
                      placeholder="Category name"
                      autoFocus={!showIconPicker}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleQuickAddCategory()
                      }
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>

                  {showIconPicker && (
                    <div
                      style={{
                        borderRadius: "var(--r-sm)",
                        border: "1px solid var(--line)",
                        background: "var(--surface)",
                        padding: 10,
                      }}
                    >
                      <EmojiPicker
                        value={quickForm.icon}
                        onChange={(e) => {
                          setQuickForm((f) => ({ ...f, icon: e }));
                          setShowIconPicker(false);
                        }}
                      />
                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--ink-3)",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Or type:
                        </span>
                        <input
                          type="text"
                          maxLength={2}
                          value={quickForm.icon}
                          onChange={(e) => {
                            if (e.target.value)
                              setQuickForm((f) => ({
                                ...f,
                                icon: e.target.value,
                              }));
                          }}
                          placeholder="😊"
                          style={{
                            ...inputStyle,
                            height: 34,
                            width: 54,
                            textAlign: "center",
                            fontSize: 18,
                            padding: "0 8px",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {CAT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          setQuickForm((f) => ({ ...f, color: c }))
                        }
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          border: "none",
                          background: c,
                          cursor: "pointer",
                          flexShrink: 0,
                          outline:
                            quickForm.color === c ? `2px solid ${c}` : "none",
                          outlineOffset: 2,
                          transform:
                            quickForm.color === c ? "scale(1.2)" : "scale(1)",
                          transition:
                            "transform var(--d1) var(--e), outline var(--d1) var(--e)",
                        }}
                      />
                    ))}
                  </div>

                  {quickError && (
                    <div style={{ fontSize: 12, color: "var(--neg)" }}>
                      {quickError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickAdd(false);
                        setQuickError("");
                        setShowIconPicker(false);
                      }}
                      className="sp-btn sp-btn-ghost"
                      style={{ flex: 1, height: 34, fontSize: 13 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddCategory}
                      disabled={createCategory.isPending}
                      className="sp-btn sp-btn-primary"
                      style={{ flex: 1.5, height: 34, fontSize: 13 }}
                    >
                      {createCategory.isPending ? "Adding…" : "Add category"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      height: 28,
                      padding: "0 12px",
                      borderRadius: 99,
                      border: `1px solid ${on ? t.color : "var(--line)"}`,
                      background: on ? t.color + "22" : "var(--surface-2)",
                      color: on ? t.color : "var(--ink-2)",
                      fontWeight: 600,
                      fontSize: 12.5,
                      transition: "all var(--d1) var(--e)",
                    }}
                  >
                    {t.icon} #{t.name}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setQuickAddTag((v) => !v);
                  setQuickTagError("");
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  height: 28,
                  padding: "0 12px",
                  borderRadius: 99,
                  border: `1px dashed ${quickAddTag ? "var(--brand)" : "var(--line)"}`,
                  background: quickAddTag ? "var(--brand-soft)" : "transparent",
                  color: quickAddTag ? "var(--brand)" : "var(--ink-3)",
                  fontWeight: 600,
                  fontSize: 12.5,
                  transition: "all var(--d1) var(--e)",
                }}
              >
                + New
              </button>
            </div>

            {quickAddTag && (
              <div
                style={{
                  marginTop: 10,
                  padding: "14px",
                  borderRadius: "var(--r-sm)",
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowTagIconPicker((v) => !v)}
                    title="Change icon"
                    style={{
                      width: 46,
                      height: 44,
                      flexShrink: 0,
                      fontSize: 22,
                      borderRadius: "var(--r-sm)",
                      border: `1px solid ${showTagIconPicker ? "var(--brand)" : "var(--line)"}`,
                      background: showTagIconPicker
                        ? "var(--brand-soft)"
                        : "var(--surface-2)",
                      cursor: "pointer",
                      transition: "all var(--d1) var(--e)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {quickTagForm.icon}
                  </button>
                  <input
                    type="text"
                    value={quickTagForm.name}
                    onChange={(e) => {
                      setQuickTagForm((f) => ({ ...f, name: e.target.value }));
                      setQuickTagError("");
                    }}
                    placeholder="Tag name"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleQuickAddTag()}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>

                {showTagIconPicker && (
                  <div
                    style={{
                      borderRadius: "var(--r-sm)",
                      border: "1px solid var(--line)",
                      background: "var(--surface)",
                      padding: 10,
                    }}
                  >
                    <EmojiPicker
                      value={quickTagForm.icon}
                      onChange={(e) => {
                        setQuickTagForm((f) => ({ ...f, icon: e }));
                        setShowTagIconPicker(false);
                      }}
                    />
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--ink-3)",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Or type:
                      </span>
                      <input
                        type="text"
                        maxLength={2}
                        value={quickTagForm.icon}
                        onChange={(e) => {
                          if (e.target.value)
                            setQuickTagForm((f) => ({
                              ...f,
                              icon: e.target.value,
                            }));
                        }}
                        placeholder="😊"
                        style={{
                          ...inputStyle,
                          height: 34,
                          width: 54,
                          textAlign: "center",
                          fontSize: 18,
                          padding: "0 8px",
                        }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {CAT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setQuickTagForm((f) => ({ ...f, color: c }))
                      }
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "none",
                        background: c,
                        cursor: "pointer",
                        flexShrink: 0,
                        outline:
                          quickTagForm.color === c ? `2px solid ${c}` : "none",
                        outlineOffset: 2,
                        transform:
                          quickTagForm.color === c ? "scale(1.2)" : "scale(1)",
                        transition:
                          "transform var(--d1) var(--e), outline var(--d1) var(--e)",
                      }}
                    />
                  ))}
                </div>

                {quickTagError && (
                  <div style={{ fontSize: 12, color: "var(--neg)" }}>
                    {quickTagError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddTag(false);
                      setQuickTagError("");
                      setShowTagIconPicker(false);
                    }}
                    className="sp-btn sp-btn-ghost"
                    style={{ flex: 1, height: 34, fontSize: 13 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickAddTag}
                    disabled={createTag.isPending}
                    className="sp-btn sp-btn-primary"
                    style={{ flex: 1.5, height: 34, fontSize: 13 }}
                  >
                    {createTag.isPending ? "Adding…" : "Add tag"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <button
              type="button"
              onClick={() => set("isRecurring", !form.isRecurring)}
              style={{
                width: 42,
                height: 24,
                borderRadius: 99,
                padding: 2,
                background: form.isRecurring
                  ? "var(--brand)"
                  : "var(--surface-sunken)",
                transition: "background var(--d1) var(--e)",
                flex: "none",
                border: "none",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  transform: form.isRecurring
                    ? "translateX(18px)"
                    : "translateX(0)",
                  transition: "transform var(--d1) var(--e)",
                  boxShadow: "var(--sh-xs)",
                }}
              />
            </button>
            <span
              style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-2)" }}
            >
              Recurring every cycle
            </span>
          </label>

          {form.isRecurring && (
            <div>
              <label style={fieldLabelStyle}>Repeat on day of month</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.recurringDay}
                onChange={(e) => set("recurringDay", e.target.value)}
                style={{ ...inputStyle, width: 100 }}
              />
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "0 26px 24px",
            flexShrink: 0,
          }}
        >
          <button
            className="sp-btn sp-btn-ghost"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="sp-btn sp-btn-primary"
            style={{ flex: 1.4 }}
            onClick={handleSubmit}
            disabled={isPending}
          >
            <Check style={{ width: 17, height: 17 }} />
            {isPending
              ? "Saving..."
              : expense
                ? "Save changes"
                : txType === "INCOME"
                  ? "Add income"
                  : "Add expense"}
          </button>
        </div>
      </div>

      {crossCycleWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={() => setCrossCycleWarning(null)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(2px)",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: 380,
              margin: "0 16px",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-lg)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "color-mix(in srgb, var(--brand) 10%, transparent)",
                padding: "24px 24px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  flexShrink: 0,
                  background:
                    "color-mix(in srgb, var(--brand) 15%, transparent)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--brand)",
                }}
              >
                <AlertTriangle style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--ink)",
                  }}
                >
                  Different pay cycle
                </div>
                <div
                  style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 3 }}
                >
                  This date falls in{" "}
                  <strong>{crossCycleWarning.pickedLabel}</strong>, not your
                  current pay cycle (
                  <strong>{crossCycleWarning.currentLabel}</strong>).
                </div>
              </div>
            </div>

            <div style={{ padding: "16px 24px", display: "flex", gap: 10 }}>
              <button
                className="sp-btn sp-btn-ghost"
                style={{ flex: 1 }}
                onClick={() => {
                  setCrossCycleWarning(null);
                  dateRef.current?.focus();
                }}
              >
                Change date
              </button>
              <button
                className="sp-btn sp-btn-primary"
                style={{ flex: 1.2 }}
                onClick={handleConfirmCrossCycle}
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save anyway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

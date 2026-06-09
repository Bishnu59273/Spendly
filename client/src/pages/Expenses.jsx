import { useState } from "react";
import { Search, Edit2, Trash2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useExpenses, useDeleteExpense } from "../api/expenses.js";
import { useCategories } from "../api/categories.js";
import ExpenseForm from "../components/ExpenseForm.jsx";
import ConfirmDelete from "../components/ConfirmDelete.jsx";
import { formatCurrency, formatDate, formatTime } from "../utils/format.js";
import { getCycleRange, formatCycleLabel, prevCycleRef, nextCycleRef } from "../utils/cycle.js";

export default function Expenses({ user }) {
  const [editExpense, setEditExpense] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, label }
  const [cycleRef, setCycleRef] = useState(new Date());
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { cycleStart, cycleEnd } = getCycleRange(user.salaryDay, cycleRef);
  const cycleStartParam = cycleStart.toISOString();

  const params = { cycleStart: cycleStartParam };
  if (categoryId !== "all") params.categoryId = categoryId;
  if (search) params.search = search;
  if (typeFilter !== "all") params.type = typeFilter;

  const { data: expenses = [], isLoading } = useExpenses(params);
  const { data: categories = [] } = useCategories();
  const deleteExpense = useDeleteExpense();

  const totalSpent    = expenses.filter((e) => e.type !== "INCOME").reduce((s, e) => s + e.amount, 0);
  const totalReceived = expenses.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);

  const openEdit = (e) => { setEditExpense(e); setEditOpen(true); };

  const confirmDelete = async () => {
    await deleteExpense.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div>
      {/* Cycle switcher */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 20 }}>
        <button className="sp-icon-btn" style={{ width: 38, height: 38 }} onClick={() => setCycleRef(prevCycleRef(cycleStart, user.salaryDay))}>
          <ChevronLeft style={{ width: 18, height: 18 }} />
        </button>
        <div style={{ textAlign: "center", minWidth: 220 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 2 }}>Pay Cycle</div>
          <div className="sp-display" style={{ fontSize: 18, fontWeight: 700 }}>{formatCycleLabel(cycleStart, cycleEnd)}</div>
        </div>
        <button className="sp-icon-btn" style={{ width: 38, height: 38 }} onClick={() => setCycleRef(nextCycleRef(cycleStart, user.salaryDay))}>
          <ChevronRight style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Filter bar */}
      <div className="sp-filter-bar" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="sp-search" style={{ flex: 1, minWidth: 220, height: 44 }}>
          <Search style={{ width: 17, height: 17 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions…" />
        </div>
        <div className="sp-select-wrap">
          <select
            className="sp-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <ChevronDown style={{ width: 15, height: 15 }} />
        </div>
        <div style={{ display: "flex", background: "var(--surface-sunken)", borderRadius: "var(--r-sm)", padding: 3, gap: 2 }}>
          {[{ v: "all", label: "All" }, { v: "EXPENSE", label: "Expenses" }, { v: "INCOME", label: "Income" }].map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => setTypeFilter(v)}
              style={{
                height: 34, padding: "0 12px",
                borderRadius: "calc(var(--r-sm) - 2px)", border: "none",
                fontWeight: 600, fontSize: 12.5, cursor: "pointer",
                transition: "all var(--d1) var(--e)",
                background: typeFilter === v
                  ? (v === "INCOME" ? "#16a34a" : v === "EXPENSE" ? "var(--brand)" : "var(--surface)")
                  : "transparent",
                color: typeFilter === v ? (v === "all" ? "var(--ink)" : "#fff") : "var(--ink-3)",
                boxShadow: typeFilter === v ? "var(--sh-xs)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="sp-card" style={{ overflow: "hidden" }}>
        <div className="sp-exp-header" style={{
          display: "grid", gridTemplateColumns: "2.4fr 1.2fr 1.4fr 1fr 44px",
          gap: 12, padding: "13px 22px",
          background: "var(--surface-2)", borderBottom: "1px solid var(--line)",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-3)",
        }}>
          <div>Transaction</div><div>Category</div><div>Date</div>
          <div style={{ textAlign: "right" }}>Amount</div><div />
        </div>

        {isLoading ? (
          <div style={{ padding: "48px 22px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>Loading…</div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: "52px 22px", textAlign: "center", color: "var(--ink-3)" }}>
            <Search style={{ width: 26, height: 26, margin: "0 auto 12px", opacity: 0.4 }} />
            <div style={{ fontWeight: 600, color: "var(--ink-2)", fontSize: 14 }}>No transactions found</div>
          </div>
        ) : (
          expenses.map((e, i) => (
            <div key={e.id}
              className="sp-exp-row"
              style={{
                display: "grid", gridTemplateColumns: "2.4fr 1.2fr 1.4fr 1fr 44px",
                gap: 12, alignItems: "center", padding: "13px 22px",
                borderTop: i === 0 ? "none" : "1px solid var(--line)",
                transition: "background var(--d1) var(--e)",
              }}
              onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
            >
              {(() => {
                const isIncome = e.type === "INCOME";
                const iconBg = isIncome ? "#16a34a22" : (e.category?.color || "#888") + "22";
                const iconChar = isIncome ? (e.source?.icon || "💰") : (e.category?.icon || "💸");
                const label = isIncome ? (e.source?.name || "Income") : (e.category?.name || "Expense");
                const dotColor = isIncome ? "#16a34a" : (e.category?.color || "#888");
                return (
                  <>
                    <div className="sp-exp-txn" style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <span style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", background: iconBg, fontSize: 17, flex: "none" }}>
                        {iconChar}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {e.note || label}
                          {e.isRecurring && <span style={{ marginLeft: 6, fontSize: 11, color: "var(--ink-3)", fontWeight: 500 }}>↻</span>}
                        </div>
                        {e.tags?.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 3 }}>
                            {e.tags.map((t) => (
                              <span key={t.tagId} className="sp-pill sp-pill-muted" style={{ height: 20, fontSize: 11 }}>#{t.tag?.name}</span>
                            ))}
                          </div>
                        )}
                        <div className="sp-exp-cat-m">
                          <span className="sp-dot" style={{ background: dotColor }} />
                          {label}
                        </div>
                      </div>
                    </div>
                    <div className="sp-exp-cat">
                      <span className="sp-pill" style={{ background: dotColor + "22", color: dotColor }}>
                        <span className="sp-dot" style={{ background: dotColor }} />
                        {label}
                      </span>
                    </div>
                  </>
                );
              })()}
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{formatDate(e.date)}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{formatTime(e.date)}</div>
              </div>
              <div className="sp-exp-amt sp-num" style={{ textAlign: "right", fontSize: 14, fontWeight: 700, color: e.type === "INCOME" ? "#16a34a" : "var(--neg)" }}>
                {e.type === "INCOME" ? "+" : "−"}{formatCurrency(e.amount, user.currency)}
              </div>
              <div className="sp-exp-act" style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                <button className="sp-icon-btn" style={{ width: 30, height: 30, background: "transparent", border: "none" }} onClick={() => openEdit(e)} title="Edit">
                  <Edit2 style={{ width: 14, height: 14 }} />
                </button>
                <button
                  className="sp-icon-btn"
                  style={{ width: 30, height: 30, background: "transparent", border: "none" }}
                  onClick={() => setDeleteTarget({ id: e.id, label: e.note || (e.type === "INCOME" ? e.source?.name : e.category?.name) || "transaction" })}
                  title="Delete"
                >
                  <Trash2 style={{ width: 14, height: 14, color: "var(--neg)" }} />
                </button>
              </div>
            </div>
          ))
        )}

        {expenses.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 22px", borderTop: "1px solid var(--line)", background: "var(--surface-2)", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--ink-2)" }}><b style={{ color: "var(--ink)" }}>{expenses.length}</b> transactions</span>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {totalSpent > 0 && (
                <span className="sp-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--neg)" }}>↑ −{formatCurrency(totalSpent, user.currency)}</span>
              )}
              {totalReceived > 0 && (
                <span className="sp-num" style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>↓ +{formatCurrency(totalReceived, user.currency)}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {editExpense && (
        <ExpenseForm open={editOpen} onClose={() => { setEditOpen(false); setEditExpense(null); }} expense={editExpense} />
      )}

      <ConfirmDelete
        open={!!deleteTarget}
        label={deleteTarget?.label}
        loading={deleteExpense.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

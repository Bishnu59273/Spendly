import { useState } from "react";
import { Download, Search, Edit2, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useExpenses, useDeleteExpense } from "../api/expenses.js";
import { useCategories } from "../api/categories.js";
import { useTags } from "../api/tags.js";
import ExpenseForm from "../components/ExpenseForm.jsx";
import Pill from "../components/Pill.jsx";
import { ExpenseSkeleton } from "../components/Skeleton.jsx";
import { formatCurrency, formatDate, groupByDate } from "../utils/format.js";
import { getCycleRange, formatCycleLabel, prevCycleRef, nextCycleRef } from "../utils/cycle.js";
import api from "../api/client.js";

export default function Expenses({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [cycleRef, setCycleRef] = useState(new Date());
  const [categoryId, setCategoryId] = useState("");
  const [tagId, setTagId] = useState("");
  const [search, setSearch] = useState("");

  const { cycleStart, cycleEnd } = getCycleRange(user.salaryDay, cycleRef);
  const cycleStartParam = cycleStart.toISOString();

  const params = { cycleStart: cycleStartParam };
  if (categoryId) params.categoryId = categoryId;
  if (tagId) params.tagId = tagId;
  if (search) params.search = search;

  const { data: expenses = [], isLoading } = useExpenses(params);
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const deleteExpense = useDeleteExpense();

  const groups = groupByDate(expenses);

  const handleExport = () => {
    const url = `/api/expenses/export?cycleStart=${cycleStartParam}`;
    window.open(url, "_blank");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;
    await deleteExpense.mutateAsync(id);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
            <Download size={15} /> CSV
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* Cycle nav */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 shadow-sm">
        <button onClick={() => setCycleRef(prevCycleRef(cycleStart, user.salaryDay))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatCycleLabel(cycleStart, cycleEnd)}</span>
        <button onClick={() => setCycleRef(nextCycleRef(cycleStart, user.salaryDay))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <select
            value={tagId}
            onChange={(e) => setTagId(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense list */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
          {Array.from({ length: 8 }).map((_, i) => <ExpenseSkeleton key={i} />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 shadow-sm text-center text-gray-400">
          No expenses found
        </div>
      ) : (
        groups.map(([date, items]) => (
          <div key={date} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{formatDate(date)}</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {items.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: e.category.color + "22" }}
                  >
                    {e.category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{e.note || e.category.name}</p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      <Pill label={e.category.name} color={e.category.color} />
                      {e.tags.map((t) => (
                        <Pill key={t.tagId} icon={t.tag.icon} label={t.tag.name} color={t.tag.color} />
                      ))}
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{formatCurrency(e.amount, user.currency)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setEditExpense(e)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-500">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <ExpenseForm open={showForm} onClose={() => setShowForm(false)} />
      {editExpense && (
        <ExpenseForm open={!!editExpense} onClose={() => setEditExpense(null)} expense={editExpense} />
      )}
    </div>
  );
}

import { useState } from "react";
import Modal from "./Modal.jsx";
import Pill from "./Pill.jsx";
import { useCategories } from "../api/categories.js";
import { useTags } from "../api/tags.js";
import { useCreateExpense, useUpdateExpense } from "../api/expenses.js";

const today = () => new Date().toISOString().split("T")[0];

export default function ExpenseForm({ open, onClose, expense = null }) {
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const create = useCreateExpense();
  const update = useUpdateExpense();

  const [form, setForm] = useState({
    amount: expense?.amount?.toString() || "",
    categoryId: expense?.categoryId || "",
    date: expense ? expense.date.split("T")[0] : today(),
    note: expense?.note || "",
    tagIds: expense?.tags?.map((t) => t.tagId) || [],
    isRecurring: expense?.isRecurring || false,
    recurringDay: expense?.recurringDay?.toString() || "",
  });
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleTag = (id) => {
    set("tagIds", form.tagIds.includes(id) ? form.tagIds.filter((t) => t !== id) : [...form.tagIds, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      if (expense) {
        await update.mutateAsync({ id: expense.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Modal open={open} onClose={onClose} title={expense ? "Edit Expense" : "Add Expense"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}

        <div>
          <label className="block text-sm text-gray-500 mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            className="w-full text-2xl font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => set("categoryId", c.id)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-all border-2 ${
                  form.categoryId === c.id ? "border-current shadow-md scale-105" : "border-transparent"
                }`}
                style={{ backgroundColor: c.color + "22", color: c.color }}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Note (optional)</label>
          <input
            type="text"
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="What was this for?"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {tags.length > 0 && (
          <div>
            <label className="block text-sm text-gray-500 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  className={`rounded-full px-3 py-1 text-sm font-medium border-2 transition-all ${
                    form.tagIds.includes(t.id) ? "border-current shadow-sm scale-105" : "border-transparent"
                  }`}
                  style={{ backgroundColor: t.color + "22", color: t.color }}
                >
                  {t.icon} {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set("isRecurring", !form.isRecurring)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.isRecurring ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.isRecurring ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">Recurring expense</span>
        </div>

        {form.isRecurring && (
          <div>
            <label className="block text-sm text-gray-500 mb-1">Repeat on day of month</label>
            <input
              type="number"
              min="1"
              max="31"
              value={form.recurringDay}
              onChange={(e) => set("recurringDay", e.target.value)}
              className="w-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 transition-colors disabled:opacity-60"
        >
          {isPending ? "Saving..." : expense ? "Update Expense" : "Add Expense"}
        </button>
      </form>
    </Modal>
  );
}

import { useState } from "react";
import { Plus, Edit2, Trash2, Tag, DollarSign, X, Check } from "lucide-react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "../api/categories.js";
import { useCreateTag } from "../api/tags.js";
import Modal from "../components/Modal.jsx";
import ColorPicker from "../components/ColorPicker.jsx";
import EmojiPicker from "../components/EmojiPicker.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { formatCurrency } from "../utils/format.js";

// Inline budget editor on a category card
function BudgetEditor({ category, currency, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(category.budgetLimit?.toString() || "");

  const commit = async () => {
    await onSave(category.id, value === "" ? null : parseFloat(value));
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-500 transition-colors"
      >
        <DollarSign size={12} />
        {category.budgetLimit
          ? `Budget: ${formatCurrency(category.budgetLimit, currency)}`
          : "Set budget"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Amount"
        className="w-24 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <button onClick={commit} className="text-green-500 hover:text-green-600">
        <Check size={14} />
      </button>
      <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
        <X size={14} />
      </button>
    </div>
  );
}

// Category form used for create/edit
function CategoryForm({ category = null, onClose }) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [form, setForm] = useState({
    name: category?.name || "",
    color: category?.color || "#6366f1",
    icon: category?.icon || "📁",
    budgetLimit: category?.budgetLimit?.toString() || "",
  });
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Name is required"); return; }
    const payload = {
      name: form.name.trim(),
      color: form.color,
      icon: form.icon,
      budgetLimit: form.budgetLimit ? parseFloat(form.budgetLimit) : null,
    };
    try {
      if (category) {
        await update.mutateAsync({ id: category.id, ...payload });
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}

      <div>
        <label className="block text-sm text-gray-500 mb-1">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-2">Icon</label>
        <EmojiPicker value={form.icon} onChange={(v) => set("icon", v)} />
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-2">Color</label>
        <ColorPicker value={form.color} onChange={(v) => set("color", v)} />
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-1">Monthly Budget Limit (optional)</label>
        <input
          type="number"
          min="0"
          step="1"
          value={form.budgetLimit}
          onChange={(e) => set("budgetLimit", e.target.value)}
          placeholder="Leave blank for no limit"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-2">Preview</label>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
          style={{ backgroundColor: form.color + "22", color: form.color }}
        >
          {form.icon} {form.name || "Category name"}
        </span>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 transition-colors disabled:opacity-60"
      >
        {isPending ? "Saving..." : category ? "Update Category" : "Create Category"}
      </button>
    </form>
  );
}

// Quick-add tag modal (same as Tags page TagForm, inlined for convenience)
function QuickTagForm({ onClose }) {
  const create = useCreateTag();
  const [form, setForm] = useState({ name: "", color: "#6366f1", icon: "😀" });
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    try {
      await create.mutateAsync(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
      <div>
        <label className="block text-sm text-gray-500 mb-1">Tag Name</label>
        <input
          type="text"
          autoFocus
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-2">Icon</label>
        <EmojiPicker value={form.icon} onChange={(v) => set("icon", v)} />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-2">Color</label>
        <ColorPicker value={form.color} onChange={(v) => set("color", v)} />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-2">Preview</label>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
          style={{ backgroundColor: form.color + "22", color: form.color }}
        >
          {form.icon} {form.name || "Tag name"}
        </span>
      </div>
      <button
        type="submit"
        disabled={create.isPending}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 transition-colors disabled:opacity-60"
      >
        {create.isPending ? "Creating..." : "Create Tag"}
      </button>
    </form>
  );
}

export default function Categories({ user }) {
  const { data: categories = [], isLoading } = useCategories();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [showCreate, setShowCreate] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [showQuickTag, setShowQuickTag] = useState(false);

  const handleDelete = async (id) => {
    if (!confirm("Delete this category? Expenses using it won't be deleted.")) return;
    await deleteCategory.mutateAsync(id);
  };

  const handleBudgetSave = async (id, budgetLimit) => {
    await updateCategory.mutateAsync({ id, budgetLimit });
  };

  const totalBudget = categories.reduce((s, c) => s + (c.budgetLimit || 0), 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          {totalBudget > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              Total monthly budget: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(totalBudget, user.currency)}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQuickTag(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <Tag size={15} /> Quick Add Tag
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={16} /> New Category
          </button>
        </div>
      </div>

      {/* Budget tip */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300">
        Click <strong>"Set budget"</strong> on any category to set its monthly spending limit. The total shows on your dashboard with a progress bar.
      </div>

      {/* Category grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 shadow-sm text-center text-gray-400">
          No categories yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm flex flex-col gap-3"
            >
              {/* Category identity */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: cat.color + "22" }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{cat.name}</p>
                  {cat.isDefault && (
                    <span className="text-xs text-gray-400">Default</span>
                  )}
                </div>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
              </div>

              {/* Budget row */}
              <BudgetEditor
                category={cat}
                currency={user.currency}
                onSave={handleBudgetSave}
              />

              {/* Budget bar if set */}
              {cat.budgetLimit && (
                <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full"
                    style={{ width: "0%", backgroundColor: cat.color }}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1 pt-1 border-t border-gray-50 dark:border-gray-800">
                <button
                  onClick={() => setEditCategory(cat)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-500 text-xs transition-colors"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 text-xs transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Category">
        <CategoryForm onClose={() => setShowCreate(false)} />
      </Modal>

      {editCategory && (
        <Modal open={!!editCategory} onClose={() => setEditCategory(null)} title="Edit Category">
          <CategoryForm category={editCategory} onClose={() => setEditCategory(null)} />
        </Modal>
      )}

      <Modal open={showQuickTag} onClose={() => setShowQuickTag(false)} title="Quick Add Tag">
        <QuickTagForm onClose={() => setShowQuickTag(false)} />
      </Modal>
    </div>
  );
}

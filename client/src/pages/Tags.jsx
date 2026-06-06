import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "../api/tags.js";
import Modal from "../components/Modal.jsx";
import ColorPicker from "../components/ColorPicker.jsx";
import EmojiPicker from "../components/EmojiPicker.jsx";
import { Skeleton } from "../components/Skeleton.jsx";

function TagForm({ tag = null, onClose }) {
  const create = useCreateTag();
  const update = useUpdateTag();
  const [form, setForm] = useState({ name: tag?.name || "", color: tag?.color || "#6366f1", icon: tag?.icon || "😀" });
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Name is required"); return; }
    try {
      if (tag) {
        await update.mutateAsync({ id: tag.id, ...form });
      } else {
        await create.mutateAsync(form);
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
        disabled={isPending}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 transition-colors disabled:opacity-60"
      >
        {isPending ? "Saving..." : tag ? "Update Tag" : "Create Tag"}
      </button>
    </form>
  );
}

export default function Tags() {
  const { data: tags = [], isLoading } = useTags();
  const deleteTag = useDeleteTag();
  const [showCreate, setShowCreate] = useState(false);
  const [editTag, setEditTag] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm("Delete this tag?")) return;
    await deleteTag.mutateAsync(id);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tags</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> New Tag
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 shadow-sm text-center text-gray-400">
          <p>No tags yet. Create your first tag to organize expenses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{tag.icon}</span>
                <span
                  className="text-sm font-semibold rounded-full px-2 py-0.5"
                  style={{ backgroundColor: tag.color + "22", color: tag.color }}
                >
                  {tag.name}
                </span>
              </div>
              <div className="flex gap-1 mt-auto">
                <button
                  onClick={() => setEditTag(tag)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-500 text-xs"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 text-xs"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Tag">
        <TagForm onClose={() => setShowCreate(false)} />
      </Modal>
      {editTag && (
        <Modal open={!!editTag} onClose={() => setEditTag(null)} title="Edit Tag">
          <TagForm tag={editTag} onClose={() => setEditTag(null)} />
        </Modal>
      )}
    </div>
  );
}

import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "../api/tags.js";
import { useExpenses } from "../api/expenses.js";
import Modal from "../components/Modal.jsx";
import ConfirmDelete from "../components/ConfirmDelete.jsx";
import ColorPicker from "../components/ColorPicker.jsx";
import EmojiPicker from "../components/EmojiPicker.jsx";
import { formatCurrency } from "../utils/format.js";
import { getCycleRange } from "../utils/cycle.js";

const inputStyle = {
  width: "100%", height: 44, padding: "0 14px",
  borderRadius: "var(--r-sm)", border: "1px solid var(--line)",
  background: "var(--surface-2)", color: "var(--ink)", fontSize: 14.5, outline: "none",
};

function TagForm({ tag = null, onClose }) {
  const create = useCreateTag();
  const update = useUpdateTag();
  const [form, setForm] = useState({ name: tag?.name || "", color: tag?.color || "#6366f1", icon: tag?.icon || "🏷️" });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) return;
    if (tag) await update.mutateAsync({ id: tag.id, ...form });
    else await create.mutateAsync(form);
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 7 }}>Name</label>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. essentials" style={inputStyle} />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 7 }}>Icon</label>
        <EmojiPicker value={form.icon} onChange={(v) => set("icon", v)} />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 7 }}>Color</label>
        <ColorPicker value={form.color} onChange={(v) => set("color", v)} />
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <button className="sp-btn sp-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="sp-btn sp-btn-primary" style={{ flex: 1.4 }} onClick={save} disabled={!form.name.trim()}>
          {tag ? "Save changes" : "Create tag"}
        </button>
      </div>
    </div>
  );
}

export default function Tags({ user }) {
  const { data: tags = [] } = useTags();
  const cycleStart = getCycleRange(user?.salaryDay || 1, new Date()).cycleStart.toISOString();
  const { data: expenses = [] } = useExpenses({ cycleStart });
  const deleteTag = useDeleteTag();
  const [showCreate, setShowCreate] = useState(false);
  const [editTag, setEditTag] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const tagTotals = {};
  expenses.forEach((e) => {
    e.tags?.forEach((t) => {
      if (!tagTotals[t.tag?.name]) tagTotals[t.tag?.name] = { total: 0, count: 0 };
      tagTotals[t.tag?.name].total += e.amount;
      tagTotals[t.tag?.name].count += 1;
    });
  });

  const tagsWithTotals = tags
    .map((t) => ({ ...t, total: tagTotals[t.name]?.total || 0, count: tagTotals[t.name]?.count || 0 }))
    .sort((a, b) => b.total - a.total);

  const maxTotal = Math.max(...tagsWithTotals.map((t) => t.total), 1);

  return (
    <div>
      <div className="sp-card sp-card-pad">
        <div className="sp-card-head">
          <div>
            <div className="sp-card-title">All tags</div>
            <div className="sp-card-sub">{tags.length} tags total</div>
          </div>
          <button className="sp-btn sp-btn-ghost" style={{ height: 38 }} onClick={() => setShowCreate(true)}>
            <Plus style={{ width: 16, height: 16 }} /> New tag
          </button>
        </div>

        {tags.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            No tags yet. Create your first tag to organize expenses.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {tagsWithTotals.map((t, i) => (
              <div key={t.id} style={{
                display: "grid", gridTemplateColumns: "200px 1fr 130px 72px",
                gap: 16, alignItems: "center",
                padding: "14px 4px", borderTop: i === 0 ? "none" : "1px solid var(--line)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="sp-pill sp-pill-muted" style={{ fontSize: 13 }}>{t.icon} #{t.name}</span>
                  {t.count > 0 && <span className="sp-num" style={{ fontSize: 12, color: "var(--ink-3)" }}>{t.count}×</span>}
                </div>
                <div style={{ height: 9, borderRadius: 99, background: "var(--surface-sunken)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(t.total / maxTotal) * 100}%`, borderRadius: 99, background: t.color || "var(--brand)", transition: "width 600ms var(--e)" }} />
                </div>
                <div className="sp-num" style={{ textAlign: "right", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  {t.total > 0 ? formatCurrency(t.total, user?.currency) : "—"}
                </div>
                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  <button className="sp-icon-btn" style={{ width: 30, height: 30, background: "transparent", border: "none" }} onClick={() => setEditTag(t)} title="Edit">
                    <Edit2 style={{ width: 14, height: 14 }} />
                  </button>
                  <button
                    className="sp-icon-btn"
                    style={{ width: 30, height: 30, background: "transparent", border: "none" }}
                    onClick={() => setDeleteTarget({ id: t.id, label: `#${t.name} tag` })}
                    title="Delete"
                  >
                    <Trash2 style={{ width: 14, height: 14, color: "var(--neg)" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New tag">
        <TagForm onClose={() => setShowCreate(false)} />
      </Modal>
      {editTag && (
        <Modal open={!!editTag} onClose={() => setEditTag(null)} title="Edit tag">
          <TagForm tag={editTag} onClose={() => setEditTag(null)} />
        </Modal>
      )}

      <ConfirmDelete
        open={!!deleteTarget}
        label={deleteTarget?.label}
        loading={deleteTag.isPending}
        onConfirm={async () => { await deleteTag.mutateAsync(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

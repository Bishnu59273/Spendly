import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../api/categories.js";
import { useCycleSummary } from "../api/summary.js";
import Modal from "../components/Modal.jsx";
import ConfirmDelete from "../components/ConfirmDelete.jsx";
import ColorPicker from "../components/ColorPicker.jsx";
import EmojiPicker from "../components/EmojiPicker.jsx";
import Progress from "../components/Progress.jsx";
import { formatCurrency } from "../utils/format.js";
import { getCycleRange } from "../utils/cycle.js";

function CategoryForm({ onClose, initial }) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [name, setName] = useState(initial?.name || "");
  const [icon, setIcon] = useState(initial?.icon || "📁");
  const [color, setColor] = useState(initial?.color || "#6366f1");
  const [budget, setBudget] = useState(initial?.budgetLimit?.toString() || "");

  const save = async () => {
    const payload = {
      name,
      icon,
      color,
      budgetLimit: budget ? parseFloat(budget) : null,
    };
    if (initial) await update.mutateAsync({ id: initial.id, ...payload });
    else await create.mutateAsync(payload);
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <label style={lbl}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Housing"
          style={inp}
        />
      </div>
      <div>
        <label style={lbl}>Monthly budget (optional)</label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="0"
          style={inp}
        />
      </div>
      <div>
        <label style={lbl}>Icon</label>
        <EmojiPicker value={icon} onChange={setIcon} />
      </div>
      <div>
        <label style={lbl}>Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      {/* Live preview */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: 16,
          borderRadius: "var(--r-sm)",
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
        }}
      >
        <span
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            background: color + "22",
            fontSize: 22,
          }}
        >
          {icon}
        </span>
        <div>
          <div
            className="sp-display"
            style={{
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            {name || "Category name"}
          </div>
          {budget ? (
            <div
              className="sp-num"
              style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}
            >
              Budget ₹{parseFloat(budget).toLocaleString()} / cycle
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
              No budget set
            </div>
          )}
        </div>
        <span
          style={{
            marginLeft: "auto",
            width: 14,
            height: 14,
            borderRadius: 99,
            flexShrink: 0,
            background: color,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
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
          onClick={save}
          disabled={!name.trim()}
        >
          {initial ? "Save changes" : "Create category"}
        </button>
      </div>
    </div>
  );
}

const inp = {
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
const lbl = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
  marginBottom: 7,
};

export default function Categories({ user }) {
  const { data: categories = [] } = useCategories();
  const { data: summary } = useCycleSummary({
    cycleStart: getCycleRange(
      user.salaryDay,
      new Date(),
    ).cycleStart.toISOString(),
  });
  const deleteCategory = useDeleteCategory();
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const byCategory = summary?.byCategory || [];
  const totalBudget = categories.reduce((s, c) => s + (c.budgetLimit || 0), 0);
  const spentFor = (id) => byCategory.find((c) => c.id === id)?.spent || 0;

  return (
    <div>
      {/* <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div className="sp-num" style={{ fontSize: 14, color: "var(--ink-2)" }}>
          Total allocated{" "}
          <b className="sp-display" style={{ fontSize: 17 }}>{formatCurrency(totalBudget, user.currency)}</b>
          {" "}<span style={{ color: "var(--ink-3)" }}>/ cycle</span>
        </div>
        <button className="sp-btn sp-btn-ghost" style={{ height: 38 }} onClick={() => setShowForm(true)}>
          <Plus style={{ width: 16, height: 16 }} /> New category
        </button>
      </div> */}

      <div className="sp-grid-thirds">
        {categories.map((c) => {
          const spent = spentFor(c.id);
          const budget = c.budgetLimit || 0;
          const pct = budget > 0 ? Math.round((spent / budget) * 100) : null;
          const over = budget > 0 && spent > budget;
          const left = budget - spent;

          return (
            <div key={c.id} className="sp-card sp-card-pad">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <span
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: (c.color || "#888") + "22",
                    fontSize: 22,
                    flex: "none",
                  }}
                >
                  {c.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    className="sp-display"
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {c.name}
                  </div>
                  {pct !== null && (
                    <div
                      className="sp-num"
                      style={{ fontSize: 12, color: "var(--ink-3)" }}
                    >
                      {pct}% used
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className="sp-icon-btn"
                    style={{
                      width: 30,
                      height: 30,
                      background: "transparent",
                      border: "none",
                    }}
                    onClick={() => setEditCat(c)}
                    title="Edit"
                  >
                    <Edit2 style={{ width: 14, height: 14 }} />
                  </button>
                  <button
                    className="sp-icon-btn"
                    style={{
                      width: 30,
                      height: 30,
                      background: "transparent",
                      border: "none",
                    }}
                    onClick={() =>
                      setDeleteTarget({ id: c.id, label: `${c.name} category` })
                    }
                    title="Delete"
                  >
                    <Trash2
                      style={{ width: 14, height: 14, color: "var(--neg)" }}
                    />
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 9,
                }}
              >
                <span
                  className="sp-display sp-num"
                  style={{ fontSize: 22, fontWeight: 700 }}
                >
                  {formatCurrency(spent, user.currency)}
                </span>
                {budget > 0 && (
                  <span
                    className="sp-num"
                    style={{ fontSize: 12.5, color: "var(--ink-3)" }}
                  >
                    of {formatCurrency(budget, user.currency)}
                  </span>
                )}
              </div>

              {budget > 0 && (
                <Progress value={spent} max={budget} color={c.color} />
              )}

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {budget > 0 ? (
                  over ? (
                    <span className="sp-pill sp-pill-neg">
                      Over by {formatCurrency(-left, user.currency)}
                    </span>
                  ) : (
                    <span className="sp-pill sp-pill-pos">
                      {formatCurrency(left, user.currency)} left
                    </span>
                  )
                ) : (
                  <button
                    className="sp-pill sp-pill-muted"
                    style={{ cursor: "pointer" }}
                    onClick={() => setEditCat(c)}
                  >
                    Set budget
                  </button>
                )}
                {budget > 0 && (
                  <span
                    className="sp-num"
                    style={{ fontSize: 12, color: "var(--ink-3)" }}
                  >
                    {formatCurrency(Math.round(budget / 30), user.currency)}/day
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New category"
      >
        <CategoryForm onClose={() => setShowForm(false)} />
      </Modal>
      <Modal
        open={!!editCat}
        onClose={() => setEditCat(null)}
        title="Edit category"
      >
        <CategoryForm onClose={() => setEditCat(null)} initial={editCat} />
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        label={deleteTarget?.label}
        loading={deleteCategory.isPending}
        onConfirm={async () => {
          await deleteCategory.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

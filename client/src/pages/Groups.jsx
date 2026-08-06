import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, ArrowRight } from "lucide-react";
import { useGroups, useCreateGroup, useJoinGroup } from "../api/groups.js";
import EmojiPicker from "../components/EmojiPicker.jsx";
import Modal from "../components/Modal.jsx";
import { formatCurrency } from "../utils/format.js";

const GROUP_COLORS = ["#1d6b51", "#3B82F6", "#8B5CF6", "#EF4444", "#EC4899", "#F59E0B"];

const inputStyle = {
  width: "100%", height: 42, padding: "0 12px",
  borderRadius: "var(--r-sm)", border: "1px solid var(--line)",
  background: "var(--surface-2)", color: "var(--ink)", fontSize: 14, outline: "none",
};
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 };

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function CreateGroupModal({ open, onClose, onCreated }) {
  const create = useCreateGroup();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏠");
  const [color, setColor] = useState(GROUP_COLORS[0]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!name) return;
    setError("");
    try {
      const group = await create.mutateAsync({ name, icon, color });
      setName("");
      setIcon("🏠");
      setColor(GROUP_COLORS[0]);
      onCreated(group);
    } catch (err) {
      if (!navigator.onLine) {
        setError("You're offline. Creating a group needs an internet connection — try again once you're back online.");
      } else {
        setError(err.response?.data?.error || "Something went wrong");
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a group">
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Our Flat" autoFocus />
        </div>
        <div>
          <label style={labelStyle}>Icon</label>
          <button
            type="button"
            onClick={() => setShowIconPicker((v) => !v)}
            style={{
              width: 42, height: 42, fontSize: 22, borderRadius: 10,
              border: `2px solid ${showIconPicker ? "var(--brand)" : "var(--line)"}`,
              background: showIconPicker ? "var(--brand-soft)" : "var(--surface-2)",
              cursor: "pointer", display: "grid", placeItems: "center",
            }}
          >
            {icon}
          </button>
        </div>
      </div>
      {showIconPicker && (
        <div style={{ marginBottom: 12, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface-2)", padding: 10 }}>
          <EmojiPicker value={icon} onChange={(e) => { setIcon(e); setShowIconPicker(false); }} />
        </div>
      )}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Color</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          {GROUP_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 26, height: 26, borderRadius: 99, background: c,
              border: `3px solid ${color === c ? "var(--ink)" : "transparent"}`,
            }} />
          ))}
        </div>
      </div>
      {error && (
        <div style={{ fontSize: 13, color: "var(--neg)", background: "color-mix(in srgb, var(--neg) 10%, transparent)", borderRadius: "var(--r-sm)", padding: "10px 14px", marginBottom: 14 }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="sp-btn sp-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="sp-btn sp-btn-primary" style={{ flex: 1.4 }} onClick={save} disabled={!name || create.isPending}>
          {create.isPending ? "Creating…" : "Create group"}
        </button>
      </div>
    </Modal>
  );
}

function JoinGroupModal({ open, onClose, onJoined }) {
  const join = useJoinGroup();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const save = async () => {
    if (!code) return;
    setError("");
    try {
      const group = await join.mutateAsync(code.trim());
      setCode("");
      onJoined(group);
    } catch (err) {
      if (!navigator.onLine) {
        setError("You're offline. Joining a group needs an internet connection — try again once you're back online.");
      } else {
        setError(err.response?.data?.error || "Couldn't find that invite code");
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Join a group">
      <label style={labelStyle}>Invite code</label>
      <input
        style={{ ...inputStyle, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}
        value={code}
        onChange={(e) => { setCode(e.target.value); if (error) setError(""); }}
        placeholder="e.g. AB3XQ9K"
        autoFocus
      />
      {error && <div style={{ fontSize: 13, color: "var(--neg)", marginTop: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button className="sp-btn sp-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="sp-btn sp-btn-primary" style={{ flex: 1.4 }} onClick={save} disabled={!code || join.isPending}>
          {join.isPending ? "Joining…" : "Join group"}
        </button>
      </div>
    </Modal>
  );
}

export default function Groups() {
  const { data: groups = [], isLoading } = useGroups();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  return (
    <div>
      <div className="sp-card-head" style={{ marginBottom: 16 }}>
        <div>
          <div className="sp-card-title" style={{ fontSize: 20 }}>Groups</div>
          <div className="sp-card-sub">Split bills with flatmates and partners</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="sp-btn sp-btn-soft sp-btn-sm" onClick={() => setShowJoin(true)}>Join group</button>
          <button className="sp-btn sp-btn-primary sp-btn-sm" onClick={() => setShowCreate(true)}>
            <Plus style={{ width: 15, height: 15 }} /> Create group
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-3)" }}>Loading…</div>
      ) : groups.length === 0 ? (
        <div className="sp-card sp-card-pad" style={{ textAlign: "center", padding: "48px 24px" }}>
          <Users style={{ width: 32, height: 32, color: "var(--ink-3)", margin: "0 auto 12px" }} />
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginBottom: 4 }}>No groups yet</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 18 }}>
            Create a group for your flat or with your partner to start splitting expenses.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="sp-btn sp-btn-soft" onClick={() => setShowJoin(true)}>Join with a code</button>
            <button className="sp-btn sp-btn-primary" onClick={() => setShowCreate(true)}>
              <Plus style={{ width: 15, height: 15 }} /> Create group
            </button>
          </div>
        </div>
      ) : (
        <div className="sp-grid-thirds">
          {groups.map((g) => {
            const balance = g.myBalance ?? 0;
            const pillClass = balance > 0.01 ? "sp-pill-pos" : balance < -0.01 ? "sp-pill-neg" : "sp-pill-muted";
            const pillText = balance > 0.01
              ? `You're owed ${formatCurrency(balance, "INR")}`
              : balance < -0.01
                ? `You owe ${formatCurrency(-balance, "INR")}`
                : "Settled up";
            return (
              <button
                key={g.id}
                onClick={() => navigate(`/groups/${g.id}`)}
                style={{
                  textAlign: "left", border: "1px solid var(--line)", borderRadius: "var(--r-md)",
                  padding: 16, background: "var(--surface)", cursor: "pointer",
                  display: "flex", flexDirection: "column", gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center",
                    fontSize: 20, background: `${g.color}22`,
                  }}>
                    {g.icon}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {g.members?.length ?? 0} member{g.members?.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <ArrowRight style={{ width: 16, height: 16, color: "var(--ink-3)", marginLeft: "auto" }} />
                </div>
                <div style={{ display: "flex", marginLeft: -4 }}>
                  {(g.members ?? []).slice(0, 5).map((m) => (
                    <div key={m.userId} className="sp-avatar" style={{ width: 26, height: 26, fontSize: 10, marginLeft: -4, border: "2px solid var(--surface)" }}>
                      {getInitials(m.user?.name)}
                    </div>
                  ))}
                </div>
                <span className={`sp-pill ${pillClass}`} style={{ alignSelf: "flex-start" }}>{pillText}</span>
              </button>
            );
          })}
        </div>
      )}

      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={(g) => { setShowCreate(false); navigate(`/groups/${g.id}`); }} />
      <JoinGroupModal open={showJoin} onClose={() => setShowJoin(false)} onJoined={(g) => { setShowJoin(false); navigate(`/groups/${g.id}`); }} />
    </div>
  );
}

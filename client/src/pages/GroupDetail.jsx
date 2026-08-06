import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Copy, Check, Pencil, X, Settings as SettingsIcon, ArrowLeft, RefreshCw, LogOut, Trash2 } from "lucide-react";
import {
  useGroup, useGroupExpenses, useDeleteGroupExpense,
  useSettlements, useResolveSettlement,
  useUpdateGroup, useRegenerateInviteCode, useRemoveMember, useDeleteGroup,
} from "../api/groups.js";
import Modal from "../components/Modal.jsx";
import ConfirmDelete from "../components/ConfirmDelete.jsx";
import Spinner from "../components/Spinner.jsx";
import GroupExpenseForm from "../components/GroupExpenseForm.jsx";
import SettleUpModal from "../components/SettleUpModal.jsx";
import { formatCurrency, formatDate } from "../utils/format.js";

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function InviteModal({ open, onClose, group }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const regenerate = useRegenerateInviteCode(group?.id);
  if (!group) return null;

  const inviteUrl = `${window.location.origin}/join/${group.inviteCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(group.inviteCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite to group">
      <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 16 }}>
        Share this link, or have them enter the code under "Join group".
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          readOnly value={inviteUrl}
          style={{ flex: 1, padding: "10px 12px", borderRadius: "var(--r-md)", border: "1px solid var(--line)", background: "var(--surface-sunken)", color: "var(--ink)", fontSize: 13, outline: "none" }}
        />
        <button className="sp-btn sp-btn-primary" onClick={copyLink} style={{ whiteSpace: "nowrap", gap: 6 }}>
          {copiedLink ? <><Check style={{ width: 15, height: 15 }} /> Copied!</> : <><Copy style={{ width: 15, height: 15 }} /> Copy link</>}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <span
          className="sp-num"
          style={{
            flex: 1, padding: "10px 12px", borderRadius: "var(--r-md)",
            border: "1px solid var(--line)", background: "var(--surface-sunken)",
            color: "var(--ink)", fontSize: 15, fontWeight: 700, letterSpacing: "0.08em",
          }}
        >
          {group.inviteCode}
        </span>
        <button className="sp-btn sp-btn-soft" onClick={copyCode} style={{ whiteSpace: "nowrap", gap: 6 }}>
          {copiedCode ? <><Check style={{ width: 15, height: 15 }} /> Copied!</> : <><Copy style={{ width: 15, height: 15 }} /> Copy code</>}
        </button>
      </div>

      <button
        className="sp-btn sp-btn-ghost sp-btn-sm"
        style={{ marginTop: 14 }}
        onClick={() => regenerate.mutate()}
        disabled={regenerate.isPending}
      >
        <RefreshCw style={{ width: 13, height: 13 }} /> {regenerate.isPending ? "Regenerating…" : "Regenerate code (revokes old link)"}
      </button>
    </Modal>
  );
}

function ManageGroupModal({ open, onClose, group, members, currentUserId, isOwner, onLeftOrDeleted }) {
  const update = useUpdateGroup(group?.id);
  const removeMember = useRemoveMember(group?.id);
  const deleteGroup = useDeleteGroup();
  const [name, setName] = useState(group?.name || "");
  const [error, setError] = useState("");
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);

  if (!group) return null;

  const saveName = async () => {
    if (!name.trim() || name === group.name) return;
    setError("");
    try {
      await update.mutateAsync({ name: name.trim() });
    } catch (err) {
      if (!navigator.onLine) {
        setError("You're offline. Renaming a group needs an internet connection — try again once you're back online.");
      } else {
        setError(err.response?.data?.error || "Couldn't rename this group");
      }
    }
  };

  const handleRemove = async (userId) => {
    setError("");
    try {
      await removeMember.mutateAsync(userId);
      setConfirmRemove(null);
      if (userId === currentUserId) onLeftOrDeleted();
    } catch (err) {
      if (!navigator.onLine) {
        setError("You're offline. This needs an internet connection — try again once you're back online.");
      } else {
        setError(err.response?.data?.error || "Couldn't remove this member");
      }
      setConfirmRemove(null);
    }
  };

  const handleDeleteGroup = async () => {
    setError("");
    try {
      await deleteGroup.mutateAsync(group.id);
      onLeftOrDeleted();
    } catch (err) {
      if (!navigator.onLine) {
        setError("You're offline. Deleting a group needs an internet connection — try again once you're back online.");
      } else {
        setError(err.response?.data?.error || "Couldn't delete this group");
      }
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Group settings">
        {isOwner && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
              Group name
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                style={{ flex: 1, height: 40, padding: "0 12px", borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink)", fontSize: 14, outline: "none" }}
              />
              <button className="sp-btn sp-btn-soft sp-btn-sm" onClick={saveName} disabled={update.isPending || !name.trim() || name === group.name}>
                {update.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
            Members
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {members.map((m) => (
              <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: "var(--r-sm)", background: "var(--surface-2)" }}>
                <div className="sp-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{getInitials(m.user?.name)}</div>
                <div style={{ flex: 1, fontSize: 13.5, color: "var(--ink)" }}>
                  {m.user?.name}{m.isOwner && <span style={{ color: "var(--ink-3)", fontWeight: 500 }}> · owner</span>}
                </div>
                {(m.userId === currentUserId || isOwner) && (
                  <button className="sp-icon-btn" style={{ width: 26, height: 26 }} onClick={() => setConfirmRemove(m)} title={m.userId === currentUserId ? "Leave group" : "Remove member"}>
                    {m.userId === currentUserId ? <LogOut style={{ width: 13, height: 13 }} /> : <X style={{ width: 13, height: 13 }} />}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {isOwner && (
          <button className="sp-btn sp-btn-ghost sp-btn-sm" style={{ color: "var(--neg)" }} onClick={() => setConfirmDeleteGroup(true)}>
            <Trash2 style={{ width: 13, height: 13 }} /> Delete group
          </button>
        )}

        {error && (
          <div style={{ fontSize: 13, color: "var(--neg)", background: "color-mix(in srgb, var(--neg) 10%, transparent)", borderRadius: "var(--r-sm)", padding: "10px 14px", marginTop: 14 }}>
            {error}
          </div>
        )}
      </Modal>

      <ConfirmDelete
        open={!!confirmRemove}
        label={confirmRemove?.userId === currentUserId ? "your membership in this group" : `${confirmRemove?.user?.name} from this group`}
        loading={removeMember.isPending}
        onConfirm={() => handleRemove(confirmRemove.userId)}
        onCancel={() => setConfirmRemove(null)}
      />
      <ConfirmDelete
        open={confirmDeleteGroup}
        label={`the "${group.name}" group`}
        loading={deleteGroup.isPending}
        onConfirm={handleDeleteGroup}
        onCancel={() => setConfirmDeleteGroup(false)}
      />
    </>
  );
}

export default function GroupDetail({ user }) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { data: group, isLoading } = useGroup(groupId);
  const { data: expenses = [] } = useGroupExpenses(groupId);
  const { data: pendingSettlements = [] } = useSettlements(groupId, "PENDING");
  const deleteExpense = useDeleteGroupExpense(groupId);
  const resolveSettlement = useResolveSettlement(groupId);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState(null);
  const [settleSuggestion, setSettleSuggestion] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showManage, setShowManage] = useState(false);

  if (isLoading || !group) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
        <Spinner />
      </div>
    );
  }

  const members = group.members || [];
  const balances = group.balances || {};
  const suggestions = group.suggestions || [];
  const myMembership = members.find((m) => m.userId === user.id);
  const isOwner = !!myMembership?.isOwner;

  const nameFor = (userId) => {
    if (userId === user.id) return "You";
    return members.find((m) => m.userId === userId)?.user?.name || "Someone";
  };

  const actionable = pendingSettlements.filter(
    (s) => s.initiatedById !== user.id && (s.fromUserId === user.id || s.toUserId === user.id)
  );
  const waiting = pendingSettlements.filter((s) => s.initiatedById === user.id);

  const confirmSettlement = (id, action) => resolveSettlement.mutate({ id, action });

  const confirmDeleteExpense = async () => {
    await deleteExpense.mutateAsync(deleteExpenseTarget.id);
    setDeleteExpenseTarget(null);
  };

  return (
    <div>
      <button
        onClick={() => navigate("/groups")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--ink-3)", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} /> All groups
      </button>

      <div className="sp-card-head" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", fontSize: 22, background: `${group.color}22` }}>
            {group.icon}
          </span>
          <div>
            <div className="sp-card-title" style={{ fontSize: 19 }}>{group.name}</div>
            <div style={{ display: "flex", marginTop: 4 }}>
              {members.slice(0, 6).map((m) => (
                <div key={m.userId} className="sp-avatar" style={{ width: 22, height: 22, fontSize: 9, marginLeft: -4, border: "2px solid var(--surface)" }}>
                  {getInitials(m.user?.name)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="sp-btn sp-btn-soft sp-btn-sm" onClick={() => setShowInvite(true)}>Invite</button>
          <button className="sp-icon-btn" onClick={() => setShowManage(true)} title="Group settings">
            <SettingsIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {actionable.length > 0 && (
        <div className="sp-card sp-card-pad" style={{ marginBottom: 16, border: "1px solid color-mix(in srgb, var(--warn) 40%, transparent)", background: "var(--warn-soft)" }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)", marginBottom: 10 }}>Needs your confirmation</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {actionable.map((s) => {
              const claimsPaid = s.initiatedById === s.fromUserId;
              const text = claimsPaid
                ? `${nameFor(s.fromUserId)} says they paid you ${formatCurrency(s.amount, "INR")}`
                : `${nameFor(s.toUserId)} says they received ${formatCurrency(s.amount, "INR")} from you`;
              const iAmDebtor = s.fromUserId === user.id;
              const isThisPending = resolveSettlement.isPending && resolveSettlement.variables?.id === s.id;
              const isConfirming = isThisPending && resolveSettlement.variables?.action === "confirm";
              const isDeclining = isThisPending && resolveSettlement.variables?.action === "decline";
              return (
                <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, color: "var(--ink)", flex: 1 }}>{text}</span>
                    <button className="sp-btn sp-btn-primary sp-btn-sm" onClick={() => confirmSettlement(s.id, "confirm")} disabled={resolveSettlement.isPending}>
                      {isConfirming ? "Confirming…" : "Confirm"}
                    </button>
                    <button className="sp-btn sp-btn-ghost sp-btn-sm" onClick={() => confirmSettlement(s.id, "decline")} disabled={resolveSettlement.isPending}>
                      {isDeclining ? "Declining…" : "Decline"}
                    </button>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                    Confirming logs {iAmDebtor ? "an expense" : "income"} on your personal Dashboard.
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="sp-grid-5-7" style={{ marginBottom: 16 }}>
        <div className="sp-card sp-card-pad">
          <div className="sp-card-head">
            <div className="sp-card-title">Balances</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: suggestions.length ? 16 : 0 }}>
            {members.map((m) => {
              const bal = balances[m.userId] ?? 0;
              const pillClass = bal > 0.01 ? "sp-pill-pos" : bal < -0.01 ? "sp-pill-neg" : "sp-pill-muted";
              const label = bal > 0.01 ? `+${formatCurrency(bal, "INR")}` : bal < -0.01 ? `-${formatCurrency(-bal, "INR")}` : "Settled";
              return (
                <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="sp-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{getInitials(m.user?.name)}</div>
                  <span style={{ fontSize: 13.5, color: "var(--ink)", flex: 1 }}>{m.userId === user.id ? "You" : m.user?.name}</span>
                  <span className={`sp-pill ${pillClass} sp-num`}>{label}</span>
                </div>
              );
            })}
          </div>

          {suggestions.length > 0 && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                Suggested settlements
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {suggestions.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--ink-2)", flex: 1 }}>
                      {nameFor(s.fromUserId)} → {nameFor(s.toUserId)} <strong className="sp-num">{formatCurrency(s.amount, "INR")}</strong>
                    </span>
                    <button className="sp-btn sp-btn-soft sp-btn-sm" onClick={() => setSettleSuggestion(s)}>Settle up</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {waiting.length > 0 && (
            <div style={{ marginTop: 14, fontSize: 12, color: "var(--ink-3)" }}>
              Waiting for confirmation on {waiting.length} settlement{waiting.length !== 1 ? "s" : ""} you reported.
            </div>
          )}
        </div>

        <div className="sp-card sp-card-pad">
          <div className="sp-card-head">
            <div className="sp-card-title">Expenses</div>
            <button className="sp-btn sp-btn-primary sp-btn-sm" onClick={() => { setEditExpense(null); setShowExpenseForm(true); }}>
              <Plus style={{ width: 15, height: 15 }} /> Add expense
            </button>
          </div>

          {expenses.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
              No expenses logged yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {expenses.map((exp) => {
                const myShare = exp.splits.find((s) => s.userId === user.id)?.shareAmount;
                const canEdit = exp.createdById === user.id || isOwner;
                return (
                  <div key={exp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {exp.description}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                        {formatDate(exp.date)} · paid by {nameFor(exp.paidById)}
                        {myShare != null && ` · your share ${formatCurrency(myShare, "INR")}`}
                      </div>
                    </div>
                    <div className="sp-num" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
                      {formatCurrency(exp.amount, "INR")}
                    </div>
                    {canEdit && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="sp-icon-btn" style={{ width: 26, height: 26 }} onClick={() => { setEditExpense(exp); setShowExpenseForm(true); }}>
                          <Pencil style={{ width: 12, height: 12 }} />
                        </button>
                        <button className="sp-icon-btn" style={{ width: 26, height: 26 }} onClick={() => setDeleteExpenseTarget(exp)}>
                          <X style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showExpenseForm && (
        <GroupExpenseForm
          open={showExpenseForm}
          onClose={() => { setShowExpenseForm(false); setEditExpense(null); }}
          groupId={groupId}
          members={members}
          currentUserId={user.id}
          initial={editExpense}
        />
      )}

      <SettleUpModal
        open={!!settleSuggestion}
        onClose={() => setSettleSuggestion(null)}
        groupId={groupId}
        suggestion={settleSuggestion}
        members={members}
        currentUserId={user.id}
      />

      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} group={group} />

      <ManageGroupModal
        open={showManage}
        onClose={() => setShowManage(false)}
        group={group}
        members={members}
        currentUserId={user.id}
        isOwner={isOwner}
        onLeftOrDeleted={() => { setShowManage(false); navigate("/groups"); }}
      />

      <ConfirmDelete
        open={!!deleteExpenseTarget}
        label={deleteExpenseTarget?.description}
        loading={deleteExpense.isPending}
        onConfirm={confirmDeleteExpense}
        onCancel={() => setDeleteExpenseTarget(null)}
      />
    </div>
  );
}

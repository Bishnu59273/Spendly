import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Modal from "./Modal.jsx";
import { useCreateSettlement } from "../api/groups.js";
import { buildUpiLink } from "../utils/upi.js";
import { formatCurrency } from "../utils/format.js";

export default function SettleUpModal({ open, onClose, groupId, suggestion, members, currentUserId }) {
  const createSettlement = useCreateSettlement(groupId);
  const [error, setError] = useState("");

  if (!open || !suggestion) return null;

  const { fromUserId, toUserId, amount } = suggestion;
  const fromMember = members.find((m) => m.userId === fromUserId);
  const toMember = members.find((m) => m.userId === toUserId);
  const isDebtor = currentUserId === fromUserId;
  const isCreditor = currentUserId === toUserId;
  const payeeUpi = toMember?.user?.upiId;
  const upiLink = payeeUpi
    ? buildUpiLink({ vpa: payeeUpi, payeeName: toMember.user.name, amount, note: "Spendly settle up" })
    : null;

  const nameOf = (member, id) => (id === currentUserId ? "You" : member?.user?.name || "Someone");

  const markSettled = async () => {
    setError("");
    try {
      await createSettlement.mutateAsync({ fromUserId, toUserId, amount });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Settle up">
      <div style={{ textAlign: "center", padding: "8px 0 18px" }}>
        <div className="sp-display sp-num" style={{ fontSize: 30, fontWeight: 800, color: "var(--ink)" }}>
          {formatCurrency(amount, "INR")}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 6 }}>
          {nameOf(fromMember, fromUserId)} owes {nameOf(toMember, toUserId)}
        </div>
      </div>

      {isDebtor && (
        payeeUpi ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <a
              href={upiLink}
              className="sp-btn sp-btn-primary"
              style={{ width: "100%", justifyContent: "center", height: 46 }}
            >
              Pay via UPI app
            </a>
            <div style={{ padding: 12, background: "#fff", borderRadius: "var(--r-md)", border: "1px solid var(--line)" }}>
              <QRCodeSVG value={upiLink} size={150} />
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Scan with any UPI app</div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--ink-3)", background: "var(--surface-sunken)", borderRadius: "var(--r-sm)", padding: "12px 14px", marginBottom: 18 }}>
            {nameOf(toMember, toUserId)} hasn't added a UPI ID yet, so there's no pay link to show. Settle up another way, then mark it as paid below.
          </div>
        )
      )}

      {(isDebtor || isCreditor) ? (
        <button className="sp-btn sp-btn-soft" style={{ width: "100%" }} onClick={markSettled} disabled={createSettlement.isPending}>
          {createSettlement.isPending ? "Recording…" : isDebtor ? "I've paid this" : "Mark as received"}
        </button>
      ) : (
        <div style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center" }}>
          Waiting on {nameOf(fromMember, fromUserId)} and {nameOf(toMember, toUserId)} to settle this.
        </div>
      )}

      {(isDebtor || isCreditor) && (
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", textAlign: "center", marginTop: 10 }}>
          {isDebtor ? nameOf(toMember, toUserId) : nameOf(fromMember, fromUserId)} will need to confirm before this counts toward your balance.
          Once confirmed, it's logged as {isDebtor ? "an expense" : "income"} on your personal Dashboard too.
        </div>
      )}

      {error && (
        <div style={{ fontSize: 13, color: "var(--neg)", background: "color-mix(in srgb, var(--neg) 10%, transparent)", borderRadius: "var(--r-sm)", padding: "10px 14px", marginTop: 14 }}>
          {error}
        </div>
      )}
    </Modal>
  );
}

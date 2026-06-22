import { useState } from "react";
import { Copy, Check } from "lucide-react";
import Modal from "./Modal.jsx";

export const APP_URL = "https://spendly.it.com";

export function triggerShare(onFallback) {
  if (navigator.share) {
    navigator
      .share({
        title: "Spendly",
        text: "Track your expenses effortlessly with Spendly.",
        url: APP_URL,
      })
      .catch(() => {});
  } else {
    onFallback();
  }
}

export default function ShareModal({ open, onClose }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(APP_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Share Spendly">
      <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 20 }}>
        Invite your friends to track expenses with Spendly.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          readOnly
          value={APP_URL}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--line)",
            background: "var(--surface-sunken)",
            color: "var(--ink)",
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          className="sp-btn sp-btn-primary"
          onClick={copyLink}
          style={{ whiteSpace: "nowrap", gap: 6 }}
        >
          {copied ? (
            <>
              <Check style={{ width: 15, height: 15 }} /> Copied!
            </>
          ) : (
            <>
              <Copy style={{ width: 15, height: 15 }} /> Copy link
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

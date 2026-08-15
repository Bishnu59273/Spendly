import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";
import { useSubmitFeedback } from "../api/feedback.js";
import { useHasAnyExpense } from "../api/expenses.js";
import { useUpdateOnboarding } from "../api/auth.js";

function shouldShow(user) {
  if (user?.hasSubmittedFeedback) return false;
  if (user?.feedbackRemindAt) return Date.now() > new Date(user.feedbackRemindAt).getTime();
  return true;
}

export default function FeedbackPrompt({ user }) {
  const [open, setOpen]         = useState(false);
  const [stars, setStars]       = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [note, setNote]         = useState("");
  const [done, setDone]         = useState(false);
  const submit = useSubmitFeedback();
  const updateOnboarding = useUpdateOnboarding();
  const { data: recentExpenses } = useHasAnyExpense();

  useEffect(() => {
    // Only prompt users who have actually logged at least one expense
    if ((recentExpenses?.length ?? 0) < 5) return;
    const t = setTimeout(() => { if (shouldShow(user)) setOpen(true); }, 30_000);
    return () => clearTimeout(t);
  }, [recentExpenses, user]);

  const handleRemind = () => {
    updateOnboarding.mutate({ feedbackRemindLater: true });
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!stars) return;
    await submit.mutateAsync({ stars, recommendation: note || undefined });
    setDone(true);
    setTimeout(() => setOpen(false), 2200);
  };

  if (!open) return null;

  const isMobile = window.innerWidth < 600;

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
        onClick={handleRemind}
      />
      <div style={{
        position: "fixed", zIndex: 201,
        left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        width: "100%", maxWidth: 420,
        background: "var(--surface)", borderRadius: "var(--r-xl)",
        border: "1px solid var(--line)", boxShadow: "var(--sh-lg)",
        padding: isMobile ? "20px 18px 18px" : "32px 28px 28px",
        display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20,
      }}>
        <button
          onClick={handleRemind}
          style={{ position: "absolute", top: 14, right: 14, background: "var(--surface-sunken)", border: "none", borderRadius: 99, width: 30, height: 30, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--ink-3)" }}
        >
          <X style={{ width: 15, height: 15 }} />
        </button>

        {done ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <div className="sp-display" style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Thank you!</div>
            <div style={{ fontSize: 14, color: "var(--ink-3)" }}>Your feedback helps make Spendly better.</div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: isMobile ? 26 : 36, marginBottom: isMobile ? 8 : 12 }}>💬</div>
              <div className="sp-display" style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 6 }}>
                How are we doing?
              </div>
              <div style={{ fontSize: isMobile ? 13 : 14, color: "var(--ink-3)" }}>
                Rate your experience with Spendly
              </div>
            </div>

            {/* Stars */}
            <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? 6 : 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, transition: "transform 0.1s" }}
                >
                  <Star
                    style={{
                      width: isMobile ? 28 : 36, height: isMobile ? 28 : 36,
                      fill: n <= (hovered || stars) ? "#f59e0b" : "none",
                      stroke: n <= (hovered || stars) ? "#f59e0b" : "var(--line-strong)",
                      transition: "fill 0.15s, stroke 0.15s",
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Recommendation */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 7 }}>
                Any suggestions? <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What could we improve?"
                rows={isMobile ? 2 : 3}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: "var(--r-sm)",
                  border: "1px solid var(--line)", background: "var(--surface-2)",
                  color: "var(--ink)", fontSize: 14, resize: "none", outline: "none",
                  fontFamily: "var(--body)", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={handleSubmit}
                disabled={!stars || submit.isPending}
                className="sp-btn sp-btn-primary"
                style={{ width: "100%", height: isMobile ? 40 : 46, justifyContent: "center", fontSize: isMobile ? 14 : 15, opacity: !stars ? 0.5 : 1 }}
              >
                {submit.isPending ? "Submitting…" : "Submit feedback"}
              </button>
              <button
                onClick={handleRemind}
                style={{ width: "100%", height: 38, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--ink-3)", fontWeight: 500 }}
              >
                Remind me later
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

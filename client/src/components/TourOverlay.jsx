import { useState, useEffect, useCallback } from "react";

const PAD = 10;
const TOOLTIP_W = 272;
const SPOT_T =
  "left 0.4s cubic-bezier(0.4,0,0.2,1), top 0.4s cubic-bezier(0.4,0,0.2,1), width 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1)";

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(v, hi));
}

function computePos(rect, preferredSide, vw, vh) {
  const GAP = 14;
  let side = preferredSide;

  if (side === "right" && rect.right + GAP + TOOLTIP_W > vw - 10)
    side = "bottom";
  if (side === "top" && rect.top - GAP - 200 < 10) side = "bottom";

  let x, y;
  if (side === "right") {
    x = rect.right + GAP;
    y = rect.top + rect.height / 2 - 80;
  } else if (side === "top") {
    x = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    y = rect.top - GAP - 200;
  } else {
    x = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    y = rect.bottom + GAP;
  }

  return {
    left: clamp(x, 10, vw - TOOLTIP_W - 10),
    top: clamp(y, 10, vh - 250),
  };
}

export default function TourOverlay({ steps, onDone, onStep }) {
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const advance = useCallback(
    (to) => {
      if (to >= steps.length) {
        onDone();
        return;
      }
      setCurrent(to);
    },
    [steps.length, onDone],
  );

  useEffect(() => {
    // Hide tooltip immediately; keep old rect so spotlight stays visible and
    // slides to the next target instead of blinking out.
    setTooltipVisible(false);
    onStep?.(current);
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      const el = document.querySelector(steps[current].selector);
      if (!el) {
        advance(current + 1);
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(() => {
        if (cancelled) return;
        setRect(el.getBoundingClientRect());
        setTooltipVisible(true);
      }, 100);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  const recompute = useCallback(() => {
    const el = document.querySelector(steps[current]?.selector);
    if (el) setRect(el.getBoundingClientRect());
  }, [current, steps]);

  useEffect(() => {
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [recompute]);

  const step = steps[current];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pos = rect ? computePos(rect, step.side, vw, vh) : null;

  return (
    <>
      <style>{`
        @keyframes sp-tour-pulse {
          0%,100% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand) 25%, transparent); }
          50%      { box-shadow: 0 0 0 9px color-mix(in srgb, var(--brand) 10%, transparent); }
        }
      `}</style>

      {/* Blocks all app clicks while tour is active */}
      {step.overlay !== false && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 199,
            cursor: "default",
          }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Spotlight - the div itself is the clear window; box-shadow is the dark overlay.
          CSS transitions on left/top/width/height make it slide to each new target. */}
      {rect && step.overlay !== false && (
        <div
          style={{
            position: "fixed",
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 10,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.62)",
            pointerEvents: "none",
            zIndex: 200,
            transition: SPOT_T,
          }}
        />
      )}

      {/* Pulsing highlight ring - same position transitions so it slides with the spotlight */}
      {rect && (
        <div
          style={{
            position: "fixed",
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 10,
            border: "2px solid var(--brand)",
            animation: "sp-tour-pulse 2s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 201,
            transition: SPOT_T,
          }}
        />
      )}

      {/* Tooltip - kept in DOM always so opacity can cross-fade instead of mount/unmount */}
      <div
        style={{
          position: "fixed",
          left: pos?.left ?? -9999,
          top: pos?.top ?? -9999,
          width: TOOLTIP_W,
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-md)",
          boxShadow: "var(--sh-lg)",
          padding: "18px 18px 16px",
          zIndex: 202,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          opacity: pos && tooltipVisible ? 1 : 0,
          transition: "opacity 0.22s ease",
          pointerEvents: pos && tooltipVisible ? "auto" : "none",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--brand)",
          }}
        >
          {current + 1} of {steps.length}
        </div>

        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {step.title}
        </div>

        <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
          {step.desc}
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                height: 6,
                borderRadius: 99,
                flexShrink: 0,
                width: i === current ? 16 : 6,
                background:
                  i === current ? "var(--brand)" : "var(--line-strong)",
                transition: "width 0.2s, background 0.2s",
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 2,
          }}
        >
          <button
            onClick={onDone}
            style={{
              fontSize: 12.5,
              color: "var(--ink-3)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            Skip tour
          </button>
          <button
            className="sp-btn sp-btn-primary"
            style={{ height: 34, padding: "0 16px", fontSize: 13 }}
            onClick={() => advance(current + 1)}
          >
            {current === steps.length - 1 ? "Got it!" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}

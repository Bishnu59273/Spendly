import { useState, useEffect, useRef } from "react";

function evaluate(tokens, lastDisplay) {
  const lastNum = parseFloat(lastDisplay) || 0;
  const all = [...tokens, { type: "num", value: lastNum }];

  const nums = [];
  const ops = [];
  for (const tok of all) {
    if (tok.type === "num") nums.push(tok.value);
    else ops.push(tok.value);
  }

  // Pass 1: fold * and /
  const acc = [nums[0]];
  const remainOps = [];
  for (let i = 0; i < ops.length; i++) {
    if (ops[i] === "*") {
      acc[acc.length - 1] *= nums[i + 1];
    } else if (ops[i] === "/") {
      if (nums[i + 1] === 0) throw new Error("DIV0");
      acc[acc.length - 1] /= nums[i + 1];
    } else {
      remainOps.push(ops[i]);
      acc.push(nums[i + 1]);
    }
  }

  // Pass 2: + and -
  let result = acc[0];
  for (let i = 0; i < remainOps.length; i++) {
    if (remainOps[i] === "+") result += acc[i + 1];
    else result -= acc[i + 1];
  }
  return result;
}

function formatResult(n) {
  if (!isFinite(n) || isNaN(n)) return "Error";
  const clean = parseFloat(parseFloat(n).toPrecision(10));
  if (Number.isInteger(clean)) return String(clean);
  return clean.toFixed(2).replace(/\.?0+$/, "");
}

const OP_SYMBOL = { "+": "+", "-": "−", "*": "×", "/": "÷" };

function expressionString(tokens) {
  return tokens
    .map((t) => (t.type === "op" ? OP_SYMBOL[t.value] : String(t.value)))
    .join(" ");
}

const BUTTONS = [
  { label: "C",   action: "clear" },
  { label: "⌫",   action: "back" },
  { label: "%",   action: "percent" },
  { label: "÷",   action: "op", value: "/" },
  { label: "7",   action: "digit" },
  { label: "8",   action: "digit" },
  { label: "9",   action: "digit" },
  { label: "×",   action: "op", value: "*" },
  { label: "4",   action: "digit" },
  { label: "5",   action: "digit" },
  { label: "6",   action: "digit" },
  { label: "−",   action: "op", value: "-" },
  { label: "1",   action: "digit" },
  { label: "2",   action: "digit" },
  { label: "3",   action: "digit" },
  { label: "+",   action: "op", value: "+" },
  { label: ".",   action: "dot" },
  { label: "0",   action: "digit" },
  { label: "00",  action: "double0" },
  { label: "=",   action: "equals" },
];

function btnStyle(btn) {
  const base = {
    height: 44, borderRadius: "var(--r-xs)", border: "none",
    fontSize: 17, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    userSelect: "none", WebkitUserSelect: "none",
    touchAction: "manipulation",
    transition: "background var(--d1) var(--e)",
  };
  if (btn.action === "clear")
    return { ...base, background: "var(--neg-soft)", color: "var(--neg)" };
  if (btn.action === "equals")
    return { ...base, background: "var(--brand)", color: "#fff" };
  if (btn.action === "op")
    return { ...base, background: "var(--brand-soft)", color: "var(--brand)", fontWeight: 700 };
  if (btn.action === "back" || btn.action === "percent")
    return { ...base, background: "var(--surface-2)", color: "var(--ink-2)" };
  return { ...base, background: "var(--surface)", border: "1px solid var(--line)", color: "var(--ink)" };
}

const INFO_PATTERNS = [
  { keys: "1000 × 10 %",      desc: "10% of 1000",             result: "= 100" },
  { keys: "1000 + 18 % =",    desc: "Add 18% GST",             result: "= 1180" },
  { keys: "500 − 10 % =",     desc: "10% discount on 500",     result: "= 450" },
  { keys: "300 ÷ 3 =",        desc: "Split ₹300 among 3",      result: "= 100" },
  { keys: "100 + 200 + 50 =", desc: "Add multiple items",      result: "= 350" },
];

export default function InlineCalculator({ open, onConfirm, initialValue }) {
  const [tokens, setTokens] = useState([]);
  const [display, setDisplay] = useState("0");
  const [justEvaled, setJustEvaled] = useState(false);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const justPercented = useRef(false);

  useEffect(() => {
    if (open) {
      const seed = initialValue && parseFloat(initialValue) ? String(parseFloat(initialValue)) : "0";
      setDisplay(seed);
      setTokens([]);
      justPercented.current = false;
      setJustEvaled(false);
      setError(null);
      setShowInfo(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // True when an operator was just pressed and we're waiting for the second operand
  const awaitingOperand =
    tokens.length > 0 &&
    tokens[tokens.length - 1].type === "op" &&
    display === "0" &&
    !justEvaled;

  const liveResult = (() => {
    if (awaitingOperand) return null;
    try {
      const r = evaluate(tokens, display);
      if (!isFinite(r) || Math.abs(r) > 999_999_999) return null;
      return formatResult(r);
    } catch {
      return null;
    }
  })();

  function handleBtn(btn) {
    if (btn.action !== "percent") justPercented.current = false;
    if (btn.action === "clear") {
      setTokens([]); setDisplay("0"); setJustEvaled(false); setError(null); return;
    }
    if (btn.action === "back") {
      if (justEvaled) { setTokens([]); setDisplay("0"); setJustEvaled(false); return; }
      // If awaiting operand, back should pop the last operator token
      if (awaitingOperand) {
        setTokens((prev) => prev.slice(0, -2)); // remove last op + num pair
        setDisplay("0");
        return;
      }
      setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0")); return;
    }
    if (btn.action === "percent") {
      if (justPercented.current) return;
      const n = parseFloat(display);
      if (isNaN(n)) return;
      justPercented.current = true;
      if (tokens.length >= 2) {
        const lastOp = tokens[tokens.length - 1];
        const base = tokens[0].value;
        if (lastOp.type === "op" && (lastOp.value === "+" || lastOp.value === "-")) {
          // e.g. 1000 + 18% → show 180 (18% of 1000), press = to get 1180
          setDisplay(formatResult(base * n / 100));
        } else {
          // e.g. 760 × 15% → immediately show 114
          const result = lastOp.value === "*" ? base * n / 100 : base / (n / 100);
          setDisplay(formatResult(result));
          setTokens([]);
          setJustEvaled(true);
        }
      } else {
        setDisplay(formatResult(n / 100));
      }
      return;
    }
    if (btn.action === "digit") {
      const d = btn.label;
      if (justEvaled) { setDisplay(d); setJustEvaled(false); return; }
      setDisplay((prev) => {
        if (prev === "0") return d;
        if (prev.length >= 16) return prev;
        return prev + d;
      });
      return;
    }
    if (btn.action === "double0") {
      if (justEvaled) { setDisplay("0"); setJustEvaled(false); return; }
      setDisplay((prev) => {
        if (prev === "0") return "0";
        if (prev.length >= 15) return prev;
        return prev + "00";
      });
      return;
    }
    if (btn.action === "dot") {
      if (justEvaled) { setDisplay("0."); setJustEvaled(false); return; }
      setDisplay((prev) => (prev.includes(".") ? prev : prev + "."));
      return;
    }
    if (btn.action === "op") {
      setError(null);
      setJustEvaled(false);
      setTokens((prev) => {
        // Replace last operator only when no new number has been typed yet
        if (awaitingOperand) {
          return [...prev.slice(0, -1), { type: "op", value: btn.value }];
        }
        return [
          ...prev,
          { type: "num", value: parseFloat(display) || 0 },
          { type: "op", value: btn.value },
        ];
      });
      setDisplay("0");
      return;
    }
    if (btn.action === "equals") {
      try {
        const result = evaluate(tokens, display);
        if (!isFinite(result) || isNaN(result)) { setError("ERR"); setDisplay("Error"); return; }
        if (Math.abs(result) > 999_999_999) { setError("OVERFLOW"); setDisplay("Too large"); return; }
        setDisplay(formatResult(result));
        setTokens([]);
        setJustEvaled(true);
        setError(null);
      } catch {
        setError("DIV0");
        setDisplay("Error");
      }
      return;
    }
  }

  // If there's an active expression with a live result, confirm uses that result.
  // Otherwise confirm uses whatever is in the display (after = was pressed).
  const effectiveConfirm = (() => {
    if (error || awaitingOperand) return null;
    if (tokens.length > 0 && liveResult !== null) return liveResult !== "0" ? liveResult : null;
    if (display !== "Error" && display !== "Too large" && display !== "0") return display;
    return null;
  })();

  // Expression tape: show completed tokens; when awaiting operand, append the operator symbol hint
  const tapeParts = expressionString(tokens);
  const showTape = tokens.length > 0;

  return (
    <div
      style={{
        overflow: "hidden",
        maxHeight: open ? "440px" : "0",
        opacity: open ? 1 : 0,
        marginTop: open ? 10 : 0,
        transition: "max-height var(--d2) var(--e), opacity var(--d1) var(--e), margin-top var(--d2) var(--e)",
      }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: "var(--r-sm)",
          background: "var(--surface-sunken)",
          border: "1px solid var(--line)",
          padding: "12px 12px 10px",
        }}
      >
        {/* Info toggle */}
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          title="How to use"
          style={{
            position: "absolute", top: 8, left: 10,
            width: 22, height: 22, borderRadius: "50%",
            border: `1px solid ${showInfo ? "var(--brand)" : "var(--line)"}`,
            background: showInfo ? "var(--brand)" : "transparent",
            color: showInfo ? "#fff" : "var(--ink-3)",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1, transition: "all var(--d1) var(--e)",
          }}
        >
          i
        </button>

        {/* Info overlay */}
        {showInfo && (
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "var(--r-sm)",
            background: "var(--surface-sunken)",
            padding: "10px 14px 14px",
            overflowY: "auto",
            zIndex: 3,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-3)" }}>How to use</span>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                style={{ width: 20, height: 20, borderRadius: "50%", border: "none", background: "var(--surface-2)", color: "var(--ink-3)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {INFO_PATTERNS.map((p) => (
                <div key={p.keys} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 10px", borderRadius: "var(--r-xs)", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontSize: 12.5, fontWeight: 700, color: "var(--brand)", fontFamily: "var(--display)", letterSpacing: "0.02em" }}>{p.keys}</code>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)" }}>{p.result}</span>
                  </div>
                  <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expression tape — LTR, shows completed tokens only */}
        <div
          style={{
            minHeight: 20, textAlign: "right", fontSize: 12,
            color: "var(--ink-3)", letterSpacing: "0.01em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontFamily: "var(--display)",
            visibility: showTape ? "visible" : "hidden",
          }}
        >
          {tapeParts}
        </div>

        {/* Result display */}
        <div
          style={{
            fontFamily: "var(--display)", fontSize: 32, fontWeight: 700,
            letterSpacing: "-0.03em", textAlign: "right", lineHeight: 1.15,
            marginBottom: 10, fontVariantNumeric: "tabular-nums",
            // Muted color when awaiting second operand (placeholder 0) or on error
            color: error
              ? "var(--neg)"
              : awaitingOperand
              ? "var(--ink-3)"
              : "var(--ink)",
            transition: "color var(--d1) var(--e)",
          }}
        >
          {display}
          {!error && !awaitingOperand && liveResult && liveResult !== display && tokens.length > 0 && (
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-3)", marginLeft: 8 }}>
              = {liveResult}
            </span>
          )}
        </div>

        {/* Button grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, touchAction: "manipulation" }}>
          {BUTTONS.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={() => handleBtn(btn)}
              style={btnStyle(btn)}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Confirm button */}
        <button
          type="button"
          className="sp-btn sp-btn-primary"
          disabled={!effectiveConfirm}
          onClick={() => effectiveConfirm && onConfirm(effectiveConfirm)}
          style={{
            width: "100%", marginTop: 10, height: 44,
            borderRadius: "var(--r-sm)", fontSize: 14, fontWeight: 600,
            opacity: effectiveConfirm ? 1 : 0.45,
            transition: "opacity var(--d1) var(--e)",
          }}
        >
          {effectiveConfirm ? `Use ₹${effectiveConfirm}` : "Enter an amount"}
        </button>
      </div>
    </div>
  );
}

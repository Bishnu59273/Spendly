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
  { label: "C", action: "clear" },
  { label: "⌫", action: "back" },
  { label: "%", action: "percent" },
  { label: "÷", action: "op", value: "/" },
  { label: "7", action: "digit" },
  { label: "8", action: "digit" },
  { label: "9", action: "digit" },
  { label: "×", action: "op", value: "*" },
  { label: "4", action: "digit" },
  { label: "5", action: "digit" },
  { label: "6", action: "digit" },
  { label: "−", action: "op", value: "-" },
  { label: "1", action: "digit" },
  { label: "2", action: "digit" },
  { label: "3", action: "digit" },
  { label: "+", action: "op", value: "+" },
  { label: ".", action: "dot" },
  { label: "0", action: "digit" },
  { label: "00", action: "double0" },
  { label: "=", action: "equals" },
];

function btnStyle(btn) {
  const base = {
    height: 44,
    borderRadius: "var(--r-xs)",
    border: "none",
    fontSize: 17,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "manipulation",
    transition: "background var(--d1) var(--e)",
  };
  if (btn.action === "clear")
    return { ...base, background: "var(--neg-soft)", color: "var(--neg)" };
  if (btn.action === "equals")
    return { ...base, background: "var(--brand)", color: "#fff" };
  if (btn.action === "op")
    return {
      ...base,
      background: "var(--brand-soft)",
      color: "var(--brand)",
      fontWeight: 700,
    };
  if (btn.action === "back" || btn.action === "percent")
    return { ...base, background: "var(--surface-2)", color: "var(--ink-2)" };
  return {
    ...base,
    background: "var(--surface)",
    border: "1px solid var(--line)",
    color: "var(--ink)",
  };
}

const INFO_PATTERNS = [
  {
    title: "Percentage of a number",
    formula: "A × B %",
    effect: "B% of A",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <circle cx="6.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
        <line x1="19" y1="5" x2="5" y2="19" />
      </svg>
    ),
  },
  {
    title: "Add GST or tax",
    formula: "A + B %",
    effect: "A plus B% tax",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="13" y2="13" />
      </svg>
    ),
  },
  {
    title: "Apply a discount",
    formula: "A − B %",
    effect: "A minus B% off",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.6 13.4 13 21l-9-9V4h8z" />
        <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: "Split a bill",
    formula: "A ÷ B",
    effect: "A split B ways",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
        <path d="M17 11a3 3 0 0 0 0-6" />
        <path d="M21 20c0-2.5-1.3-4.2-3.5-4.8" />
      </svg>
    ),
  },
  {
    title: "Add up several items",
    formula: "A + B + C",
    effect: "all added together",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
];

export default function InlineCalculator({
  open,
  onConfirm,
  initialValue,
  currencySymbol = "₹",
}) {
  const [tokens, setTokens] = useState([]);
  const [display, setDisplay] = useState("0");
  const [justEvaled, setJustEvaled] = useState(false);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [lastAnswer, setLastAnswer] = useState(null);
  const justPercented = useRef(false);
  const prevExprRef = useRef("");

  useEffect(() => {
    if (open) {
      const seed =
        initialValue && parseFloat(initialValue)
          ? String(parseFloat(initialValue))
          : "0";
      setDisplay(seed);
      setTokens([]);
      justPercented.current = false;
      prevExprRef.current = "";
      setJustEvaled(false);
      setError(null);
      setLastAnswer(null);
      setShowInfo(false);
      setShowHint(true);
      const t = setTimeout(() => setShowHint(false), 4600);
      return () => clearTimeout(t);
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
      setTokens([]);
      setDisplay("0");
      setJustEvaled(false);
      setError(null);
      setLastAnswer(null);
      prevExprRef.current = "";
      return;
    }
    if (btn.action === "back") {
      if (justEvaled) {
        setTokens([]);
        setDisplay("0");
        setJustEvaled(false);
        return;
      }
      // If awaiting operand, back should pop the last operator token
      if (awaitingOperand) {
        setTokens((prev) => prev.slice(0, -2)); // remove last op + num pair
        setDisplay("0");
        return;
      }
      setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
      return;
    }
    if (btn.action === "percent") {
      if (justPercented.current) return;
      const n = parseFloat(display);
      if (isNaN(n)) return;
      justPercented.current = true;
      if (tokens.length >= 2) {
        const lastOp = tokens[tokens.length - 1];
        const base = tokens[0].value;
        let result;
        if (lastOp.value === "+") result = base + (base * n) / 100;
        else if (lastOp.value === "-") result = base - (base * n) / 100;
        else if (lastOp.value === "*") result = (base * n) / 100;
        else result = base / (n / 100);
        prevExprRef.current = expressionString(tokens) + " " + display + "%";
        setDisplay(formatResult(result));
        setTokens([]);
        setJustEvaled(true);
      } else {
        setDisplay(formatResult(n / 100));
      }
      return;
    }
    if (btn.action === "digit") {
      const d = btn.label;
      if (justEvaled) {
        setDisplay(d);
        setJustEvaled(false);
        return;
      }
      setDisplay((prev) => {
        if (prev === "0") return d;
        if (prev.length >= 16) return prev;
        return prev + d;
      });
      return;
    }
    if (btn.action === "double0") {
      if (justEvaled) {
        setDisplay("0");
        setJustEvaled(false);
        return;
      }
      setDisplay((prev) => {
        if (prev === "0") return "0";
        if (prev.length >= 15) return prev;
        return prev + "00";
      });
      return;
    }
    if (btn.action === "dot") {
      if (justEvaled) {
        setDisplay("0.");
        setJustEvaled(false);
        return;
      }
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
        if (!isFinite(result) || isNaN(result)) {
          setError("ERR");
          setDisplay("Error");
          return;
        }
        if (Math.abs(result) > 999_999_999) {
          setError("OVERFLOW");
          setDisplay("Too large");
          return;
        }
        prevExprRef.current = expressionString(tokens) + " " + display;
        const formatted = formatResult(result);
        setDisplay(formatted);
        setLastAnswer(formatted);
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
    if (tokens.length > 0 && liveResult !== null)
      return liveResult !== "0" ? liveResult : null;
    if (display !== "Error" && display !== "Too large" && display !== "0")
      return display;
    return null;
  })();

  // Large display: expression being built, or result after =
  const displayToken = display + (justPercented.current ? "%" : "");
  const bigText = (() => {
    if (justEvaled) return display;
    if (awaitingOperand) return expressionString(tokens);
    if (tokens.length > 0) return expressionString(tokens) + " " + displayToken;
    return display;
  })();

  // Small context line above: result preview, completed expression, or previous answer
  const smallText = (() => {
    if (error) return null;
    if (justEvaled && prevExprRef.current) return prevExprRef.current + " =";
    if (!justEvaled && liveResult && tokens.length > 0)
      return "= " + liveResult;
    if (lastAnswer && tokens.length === 0 && !justEvaled)
      return "Ans = " + lastAnswer;
    return null;
  })();

  return (
    <div
      style={{
        overflow: "hidden",
        maxHeight: open ? "440px" : "0",
        opacity: open ? 1 : 0,
        marginTop: open ? 10 : 0,
        transition:
          "max-height var(--d2) var(--e), opacity var(--d1) var(--e), margin-top var(--d2) var(--e)",
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
        {/* Info toggle + animated hint label */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setShowInfo((v) => !v);
              setShowHint(false);
            }}
            title="What can I do here?"
            style={{
              flexShrink: 0,
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: `1.5px solid ${showInfo ? "var(--brand)" : "var(--brand)"}`,
              background: showInfo ? "var(--brand)" : "var(--brand-soft)",
              color: showInfo ? "#fff" : "var(--brand)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              transition: "all var(--d1) var(--e)",
            }}
          >
            i
          </button>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--brand)",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              opacity: showHint && !showInfo ? 1 : 0,
              transform:
                showHint && !showInfo ? "translateX(0)" : "translateX(-6px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            formulas
          </span>
        </div>

        {/* Info overlay - Variation 2: Iconed cause → effect */}
        {showInfo && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "var(--r-sm)",
              background: "var(--surface-sunken)",
              padding: "12px 14px 14px",
              overflowY: "auto",
              zIndex: 3,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}
              >
                What can I do here?
              </span>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.05)",
                  color: "var(--ink-3)",
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {INFO_PATTERNS.map((p, i) => (
                <div key={p.title}>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 4px",
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        background: "var(--brand-soft)",
                        color: "var(--brand)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {p.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: "var(--ink)",
                        }}
                      >
                        {p.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--ink-2)",
                          marginTop: 3,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--display)",
                            color: "var(--brand)",
                            fontWeight: 600,
                          }}
                        >
                          {p.formula}
                        </span>
                        {" gives "}
                        <strong
                          style={{ color: "var(--ink)", fontWeight: 600 }}
                        >
                          {p.effect}
                        </strong>
                      </div>
                    </div>
                  </div>
                  {i < INFO_PATTERNS.length - 1 && (
                    <div
                      style={{
                        height: 1,
                        background: "rgba(0,0,0,0.05)",
                        margin: "0 4px",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Small context line: result preview or previous answer */}
        <div
          style={{
            minHeight: 20,
            textAlign: "right",
            fontSize: 12,
            color: "var(--ink-3)",
            letterSpacing: "0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "var(--display)",
            visibility: smallText ? "visible" : "hidden",
          }}
        >
          {smallText}
        </div>

        {/* Large display: the expression being built, or the result */}
        <div
          style={{
            fontFamily: "var(--display)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            textAlign: "right",
            lineHeight: 1.15,
            marginBottom: 10,
            fontVariantNumeric: "tabular-nums",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: error ? "var(--neg)" : "var(--ink)",
            transition: "color var(--d1) var(--e)",
          }}
        >
          {bigText}
        </div>

        {/* Button grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 6,
            touchAction: "manipulation",
          }}
        >
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
            width: "100%",
            marginTop: 10,
            height: 44,
            borderRadius: "var(--r-sm)",
            fontSize: 14,
            fontWeight: 600,
            opacity: effectiveConfirm ? 1 : 0.45,
            transition: "opacity var(--d1) var(--e)",
          }}
        >
          {effectiveConfirm
            ? `Use ${currencySymbol}${effectiveConfirm}`
            : "Enter an amount"}
        </button>
      </div>
    </div>
  );
}

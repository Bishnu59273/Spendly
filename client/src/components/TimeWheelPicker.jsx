import { useEffect, useRef } from "react";

const ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const PAD = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function parseValue(value) {
  const [hStr, mStr] = (value || "00:00").split(":");
  const h24 = parseInt(hStr, 10) || 0;
  const minute = parseInt(mStr, 10) || 0;
  const period = h24 >= 12 ? "PM" : "AM";
  const hour12 = h24 % 12 || 12;
  return { hour12, minute, period };
}

function toValue(hour12, minute, period) {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function nowValue() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Wheel({ items, format, selectedIndex, onSettle }) {
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastEmitted = useRef(selectedIndex);
  const dragRef = useRef(null);
  const draggedRef = useRef(false);

  // Mount: snap to the initial value with no animation.
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = selectedIndex * ITEM_HEIGHT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External value changes (e.g. "Now" button, opening a different expense)
  // snap instantly; changes this wheel itself just emitted are ignored.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || lastEmitted.current === selectedIndex) return;
    lastEmitted.current = selectedIndex;
    el.scrollTop = selectedIndex * ITEM_HEIGHT;
  }, [selectedIndex]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleScroll = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const idx = Math.min(
        items.length - 1,
        Math.max(0, Math.round(el.scrollTop / ITEM_HEIGHT)),
      );
      el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
      if (idx !== selectedIndex) {
        lastEmitted.current = idx;
        onSettle(idx);
      }
    }, 120);
  };

  const handleClick = (idx) => {
    if (draggedRef.current) return; // suppress the click a drag-release fires
    containerRef.current?.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
  };

  // Mouse-only click-and-drag scrolling: touch already scrolls natively, and
  // dragging plain text with a mouse would otherwise just select it instead
  // of moving the wheel, since there's no visible scrollbar to grab.
  const handlePointerDown = (e) => {
    if (e.pointerType !== "mouse") return;
    const el = containerRef.current;
    if (!el) return;
    dragRef.current = { startY: e.clientY, startScrollTop: el.scrollTop };
    draggedRef.current = false;
    el.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const delta = e.clientY - dragRef.current.startY;
    if (Math.abs(delta) > 3) draggedRef.current = true;
    el.scrollTop = dragRef.current.startScrollTop - delta;
  };

  const endDrag = (e) => {
    if (!dragRef.current) return;
    containerRef.current?.releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
    // handleScroll's own debounce settles the final row; clear the
    // drag-suppresses-click flag just after so a real next click still works.
    setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      className="sp-wheel-col"
      style={{
        height: WHEEL_HEIGHT,
        overflowY: "auto",
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: "grab",
        flex: 1,
        zIndex: 1,
      }}
    >
      <div style={{ height: PAD }} />
      {items.map((item, idx) => (
        <div
          key={item}
          onClick={() => handleClick(idx)}
          style={{
            height: ITEM_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            scrollSnapAlign: "center",
            fontSize: idx === selectedIndex ? 20 : 16,
            fontWeight: idx === selectedIndex ? 700 : 500,
            color: idx === selectedIndex ? "var(--ink)" : "var(--ink-3)",
            fontVariantNumeric: "tabular-nums",
            cursor: "pointer",
            transition: "color var(--d1) var(--e), font-size var(--d1) var(--e)",
          }}
        >
          {format ? format(item) : item}
        </div>
      ))}
      <div style={{ height: PAD }} />
    </div>
  );
}

export default function TimeWheelPicker({ open, value, onChange }) {
  const { hour12, minute, period } = parseValue(value);
  const hourIndex = HOURS.indexOf(hour12);

  const setHour = (idx) => onChange(toValue(HOURS[idx], minute, period));
  const setMinute = (idx) => onChange(toValue(hour12, MINUTES[idx], period));
  const setPeriod = (p) => onChange(toValue(hour12, minute, p));
  const setNow = () => onChange(nowValue());

  return (
    <div
      style={{
        overflow: "hidden",
        maxHeight: open ? 260 : 0,
        opacity: open ? 1 : 0,
        marginTop: open ? 10 : 0,
        flexShrink: 0,
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
          padding: "12px 14px 14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--ink-3)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Set time
          </span>
          <button
            type="button"
            onClick={setNow}
            style={{
              height: 24,
              padding: "0 10px",
              borderRadius: 99,
              border: "1px solid var(--brand)",
              background: "var(--brand-soft)",
              color: "var(--brand)",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Now
          </button>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: PAD,
              height: ITEM_HEIGHT,
              background: "var(--brand-soft)",
              borderRadius: "var(--r-xs)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: PAD,
              background: "linear-gradient(to bottom, var(--surface-sunken), transparent)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: PAD,
              background: "linear-gradient(to top, var(--surface-sunken), transparent)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />

          <Wheel items={HOURS} selectedIndex={hourIndex} onSettle={setHour} />
          <span style={{ fontWeight: 700, fontSize: 20, color: "var(--ink-3)", zIndex: 1 }}>
            :
          </span>
          <Wheel
            items={MINUTES}
            format={(m) => String(m).padStart(2, "0")}
            selectedIndex={minute}
            onSettle={setMinute}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginLeft: 6,
              zIndex: 1,
            }}
          >
            {["AM", "PM"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                style={{
                  height: 26,
                  padding: "0 10px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: period === p ? "var(--brand)" : "var(--surface-2)",
                  color: period === p ? "#fff" : "var(--ink-3)",
                  transition: "all var(--d1) var(--e)",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

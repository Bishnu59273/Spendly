import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowDown,
  Pencil,
  Plus,
} from "lucide-react";
import { useCycleSummary, useTrend } from "../api/summary.js";
import { useExpenses } from "../api/expenses.js";
import { useGoals } from "../api/goals.js";
import { formatCurrency, formatDate } from "../utils/format.js";
import {
  getCycleRange,
  formatCycleLabel,
  prevCycleRef,
  nextCycleRef,
} from "../utils/cycle.js";
import Donut from "../components/Donut.jsx";
import DailyChart from "../components/DailyChart.jsx";
import Progress from "../components/Progress.jsx";
import SavingsGoal from "../components/SavingsGoal.jsx";
import Modal from "../components/Modal.jsx";
import BudgetModal from "../components/BudgetModal.jsx";

function StatCard({
  icon: Icon,
  tint,
  label,
  value,
  sub,
  onEdit,
  editIcon: EditIcon = Pencil,
  tourId,
}) {
  return (
    <div
      className="sp-card sp-card-pad"
      data-tour={tourId}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            background: `color-mix(in srgb, ${tint} 14%, transparent)`,
            color: tint,
          }}
        >
          <Icon style={{ width: 20, height: 20 }} />
        </div>
        <div>{sub}</div>
      </div>
      <div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--ink-3)",
            fontWeight: 500,
            marginBottom: 3,
          }}
        >
          {label}
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
        >
          <div
            className="sp-display sp-num sp-stat-val"
            style={{
              fontSize: "clamp(14px, 5vw, 28px)",
              fontWeight: 700,
              color: "var(--ink)",
              lineHeight: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              title="Set budget"
              className="sp-stat-edit"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                display: "grid",
                placeItems: "center",
                background: "var(--surface-sunken)",
                border: "none",
                color: "var(--ink-3)",
                cursor: "pointer",
              }}
            >
              <EditIcon style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RecentTxns({ expenses, currency, onViewAll }) {
  return (
    <div
      className="sp-card"
      style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      <div className="sp-card-head" style={{ padding: "22px 22px 0" }}>
        <div>
          <div className="sp-card-title">Recent transactions</div>
          <div className="sp-card-sub">{expenses.length} most recent</div>
        </div>
        <button className="sp-btn sp-btn-soft sp-btn-sm" onClick={onViewAll}>
          View all
        </button>
      </div>
      <div style={{ marginTop: 8 }}>
        {expenses.length === 0 && (
          <div
            style={{
              padding: "40px 22px",
              textAlign: "center",
              color: "var(--ink-3)",
              fontSize: 13,
            }}
          >
            No expenses yet this cycle
          </div>
        )}
        {expenses.map((e, i) => (
          <div
            key={e.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              padding: "11px 22px",
              borderTop: i === 0 ? "none" : "1px solid var(--line)",
              transition: "background var(--d1) var(--e)",
            }}
            onMouseEnter={(ev) =>
              (ev.currentTarget.style.background = "var(--surface-2)")
            }
            onMouseLeave={(ev) =>
              (ev.currentTarget.style.background = "transparent")
            }
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                display: "grid",
                placeItems: "center",
                background:
                  e.categoryId
                    ? (e.category?.color || "#888") + "22"
                    : "#16a34a22",
                fontSize: 18,
                flex: "none",
              }}
            >
              {e.categoryId
                ? e.category?.icon || "💸"
                : e.source?.icon || "💰"}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {e.note ||
                  (e.categoryId ? e.category?.name : e.source?.name) ||
                  "Transaction"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {e.categoryId ? e.category?.name : e.source?.name} ·{" "}
                {formatDate(e.date)}
              </div>
            </div>
            <div
              className="sp-num"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: e.type === "INCOME" ? "#16a34a" : "var(--ink)",
              }}
            >
              {e.type === "INCOME" ? "+" : "−"}
              {formatCurrency(e.amount, currency)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [cycleRef, setCycleRef] = useState(new Date());
  const [hoverCat, setHoverCat] = useState(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [catTab, setCatTab] = useState("category");
  const [includeRent, setIncludeRent] = useState(false);
  const tabPanelRef = useRef(null);
  const [lockedHeight, setLockedHeight] = useState(null);

  const switchTab = (tab) => {
    if (tab !== "category" && catTab === "category" && tabPanelRef.current) {
      setLockedHeight(tabPanelRef.current.offsetHeight);
    }
    if (tab === "category") setLockedHeight(null);
    setCatTab(tab);
  };

  const { data: goals = [] } = useGoals();
  const goal = goals.find((g) => g.isPrimary) || null;

  const { cycleStart, cycleEnd } = getCycleRange(user.salaryDay, cycleRef);
  const cycleStartParam = cycleStart.toISOString();
  const isCurrentCycle = new Date() >= cycleStart && new Date() <= cycleEnd;

  const { data: summary } = useCycleSummary({ cycleStart: cycleStartParam });
  const { data: expenses = [] } = useExpenses({ cycleStart: cycleStartParam });

  const autoPromptedRef = useRef(null);
  useEffect(() => {
    if (
      summary?.needsBudgetInput &&
      isCurrentCycle &&
      autoPromptedRef.current !== cycleStartParam
    ) {
      setBudgetOpen(true);
      autoPromptedRef.current = cycleStartParam;
    }
  }, [summary?.needsBudgetInput, isCurrentCycle, cycleStartParam]);

  const byCategory = summary?.byCategory || [];
  const totalSpent = summary?.totalSpent || 0;
  const totalBudget = summary?.totalBudget || 0;
  const remaining = summary?.remaining ?? totalBudget - totalSpent;
  const daysLeft = summary?.daysLeft ?? "—";
  const topCategory = [...byCategory].sort((a, b) => b.spent - a.spent)[0];
  const pctUsed =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : null;
  const categoryTotalSpent = byCategory.reduce((s, c) => s + c.spent, 0);

  const donutData = byCategory
    .filter((c) => c.spent > 0)
    .map((c) => ({
      id: c.id,
      value: c.spent,
      color: c.color || "#888",
      name: c.name,
    }));

  const todayKey = new Date().toISOString().substring(0, 10);
  const dailyData = useMemo(() => {
    const start = new Date(cycleStart);
    const end = new Date(cycleEnd);

    const rentKeywords = ["rent", "vara"];
    const filtered = expenses.filter((e) => {
      if (e.type === "INCOME" && !e.categoryId) return false;
      if (!includeRent) {
        const note = e.note?.toLowerCase() ?? "";
        if (rentKeywords.some((kw) => note.includes(kw))) return false;
      }
      return true;
    });

    const byDay = {};
    filtered.forEach((e) => {
      const key = e.date.substring(0, 10);
      const amt = e.type === "INCOME" ? -e.amount : e.amount;
      byDay[key] = (byDay[key] || 0) + amt;
    });

    const MONTHS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().substring(0, 10);
      days.push({
        label: d.getUTCDate().toString(),
        dateLabel: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`,
        total: Math.max(0, byDay[key] || 0),
        isToday: key === todayKey,
      });
    }
    return days;
  }, [expenses, cycleStart, cycleEnd, includeRent, todayKey]);

  const activeCat = hoverCat ? byCategory.find((c) => c.id === hoverCat) : null;

  return (
    <div>
      {/* Cycle switcher */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <button
          className="sp-icon-btn"
          style={{ width: 38, height: 38 }}
          onClick={() => setCycleRef(prevCycleRef(cycleStart, user.salaryDay))}
        >
          <ChevronLeft style={{ width: 18, height: 18 }} />
        </button>
        <div style={{ textAlign: "center", minWidth: 230 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              marginBottom: 2,
            }}
          >
            Pay Cycle
          </div>
          <div
            className="sp-display"
            style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {formatCycleLabel(cycleStart, cycleEnd)}
          </div>
        </div>
        <button
          className="sp-icon-btn"
          style={{ width: 38, height: 38 }}
          onClick={() => setCycleRef(nextCycleRef(cycleStart, user.salaryDay))}
        >
          <ChevronRight style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* KPI cards */}
      <div className="sp-kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard
          icon={Wallet}
          tint="var(--cat-1)"
          label="Total spent"
          value={formatCurrency(totalSpent, user.currency)}
          sub={
            pctUsed !== null && (
              <span className="sp-pill sp-pill-muted sp-num">
                {pctUsed}% used
              </span>
            )
          }
        />
        <StatCard
          icon={TrendingUp}
          tint="var(--brand)"
          label="Remaining budget"
          value={
            totalBudget > 0
              ? formatCurrency(remaining, user.currency)
              : "Set budget"
          }
          sub={
            totalBudget > 0 && (
              <span className="sp-pill sp-pill-pos">
                <ArrowDown style={{ width: 12, height: 12 }} />
                On track
              </span>
            )
          }
          onEdit={() => setBudgetOpen(true)}
          editIcon={totalBudget > 0 ? Pencil : Plus}
          tourId="budget-btn"
        />
        <StatCard
          icon={Clock}
          tint="var(--cat-2)"
          label="Days left"
          value={`${daysLeft} days`}
          sub={<span className="sp-pill sp-pill-muted sp-num">of 30</span>}
        />
        <StatCard
          icon={Sparkles}
          tint="var(--cat-5)"
          label="Top category"
          value={topCategory ? topCategory.name : "—"}
          sub={
            topCategory && (
              <span className="sp-pill sp-pill-muted sp-num">
                {formatCurrency(topCategory.spent, user.currency)}
              </span>
            )
          }
        />
      </div>

      {/* Donut + Recent transactions */}
      <div className="sp-grid-5-7" style={{ marginBottom: 16 }}>
        {/* Donut */}
        <div className="sp-card sp-card-pad" style={{ minWidth: 0 }}>
          <div className="sp-card-head" style={{ flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="sp-card-title">
                  {catTab === "category"
                    ? "Spending by category"
                    : "Daily spending"}
                </div>
                {catTab === "daily" && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--ink-3)",
                        fontWeight: 500,
                      }}
                    >
                      Include rent
                    </span>
                    <button
                      onClick={() => setIncludeRent((r) => !r)}
                      style={{
                        width: 32,
                        height: 18,
                        borderRadius: 9,
                        border: "none",
                        cursor: "pointer",
                        background: includeRent
                          ? "var(--brand)"
                          : "var(--surface-sunken)",
                        position: "relative",
                        transition: "background 200ms var(--e)",
                        padding: 0,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 2,
                          left: includeRent ? 16 : 2,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "white",
                          transition: "left 200ms var(--e)",
                          boxShadow: "var(--sh-xs)",
                          display: "block",
                        }}
                      />
                    </button>
                  </div>
                )}
              </div>
              <div className="sp-card-sub">This pay cycle</div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 3,
                background: "var(--surface-sunken)",
                borderRadius: 10,
                padding: 3,
              }}
            >
              {["category", "daily"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  style={{
                    padding: "4px 11px",
                    borderRadius: 7,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    background:
                      catTab === tab ? "var(--surface)" : "transparent",
                    color: catTab === tab ? "var(--ink)" : "var(--ink-3)",
                    boxShadow: catTab === tab ? "var(--sh-xs)" : "none",
                    transition: "all var(--d1) var(--e)",
                  }}
                >
                  {tab === "category" ? "By Category" : "Daily"}
                </button>
              ))}
            </div>
          </div>
          <div
            ref={tabPanelRef}
            style={{
              height: lockedHeight ?? undefined,
              overflow: lockedHeight ? "hidden" : undefined,
            }}
          >
            {catTab === "category" ? (
              donutData.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: "var(--ink-3)",
                    fontSize: 13,
                  }}
                >
                  No expenses yet this cycle
                </div>
              ) : (
                <>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 18,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: 208,
                      }}
                    >
                      <Donut
                        data={donutData}
                        size={208}
                        stroke={28}
                        active={hoverCat}
                        onHover={setHoverCat}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          pointerEvents: "none",
                        }}
                      >
                        {activeCat ? (
                          <>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--ink-3)",
                                fontWeight: 600,
                              }}
                            >
                              {activeCat.name}
                            </div>
                            <div
                              className="sp-display sp-num"
                              style={{ fontSize: 24, fontWeight: 700 }}
                            >
                              {formatCurrency(activeCat.spent, user.currency)}
                            </div>
                            <div
                              className="sp-num"
                              style={{
                                fontSize: 12,
                                color: activeCat.color,
                                fontWeight: 700,
                              }}
                            >
                              {categoryTotalSpent > 0
                                ? Math.round(
                                    (activeCat.spent / categoryTotalSpent) * 100,
                                  )
                                : 0}
                              %
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--ink-3)",
                                fontWeight: 600,
                              }}
                            >
                              Total spent
                            </div>
                            <div
                              className="sp-display sp-num"
                              style={{ fontSize: 26, fontWeight: 700 }}
                            >
                              {formatCurrency(categoryTotalSpent, user.currency)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 9 }}
                  >
                    {donutData.map((d) => (
                      <div
                        key={d.id}
                        onMouseEnter={() => setHoverCat(d.id)}
                        onMouseLeave={() => setHoverCat(null)}
                        onClick={() =>
                          setHoverCat(hoverCat === d.id ? null : d.id)
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          cursor: "pointer",
                          opacity: hoverCat && hoverCat !== d.id ? 0.5 : 1,
                          transition: "opacity var(--d1) var(--e)",
                        }}
                      >
                        <span
                          className="sp-swatch"
                          style={{ background: d.color }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--ink-2)",
                            flex: 1,
                          }}
                        >
                          {d.name}
                        </span>
                        <span
                          className="sp-num"
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--ink)",
                          }}
                        >
                          {formatCurrency(d.value, user.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )
            ) : (
              <div>
                <DailyChart data={dailyData} currency={user.currency} />
                {(() => {
                  const spent = dailyData.filter((d) => d.total > 0);
                  if (spent.length === 0) return null;
                  const avg =
                    spent.reduce((s, d) => s + d.total, 0) / spent.length;
                  const peakDay = spent.reduce((a, b) =>
                    b.total > a.total ? b : a,
                  );
                  const lowDay = spent.reduce((a, b) =>
                    b.total < a.total ? b : a,
                  );
                  const stat = (label, val, date) => (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--ink-3)",
                          fontWeight: 500,
                          marginBottom: 3,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        className="sp-num"
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--ink)",
                        }}
                      >
                        {formatCurrency(val, user.currency)}
                      </div>
                      {date && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--ink-3)",
                            marginTop: 2,
                            fontWeight: 500,
                          }}
                        >
                          {date}
                        </div>
                      )}
                    </div>
                  );
                  return (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 16,
                        padding: "10px 12px",
                        background: "var(--surface-sunken)",
                        borderRadius: 10,
                      }}
                    >
                      {stat("Avg daily spend", avg)}
                      <div
                        style={{
                          width: 1,
                          background: "var(--border)",
                          flexShrink: 0,
                        }}
                      />
                      {stat("Peak spend", peakDay.total, peakDay.dateLabel)}
                      <div
                        style={{
                          width: 1,
                          background: "var(--border)",
                          flexShrink: 0,
                        }}
                      />
                      {stat("Lowest spend", lowDay.total, lowDay.dateLabel)}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <RecentTxns
          expenses={expenses.slice(0, 6)}
          currency={user.currency}
          onViewAll={() => navigate("/expenses")}
        />
      </div>

      {/* Savings goal + Budget by category */}
      <div className="sp-grid-5-7">
        {goal ? (
          <SavingsGoal goal={goal} currency={user.currency} />
        ) : (
          <div
            className="sp-card sp-card-pad"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              minHeight: 180,
            }}
          >
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
              No savings goal set
            </div>
            <a
              href="/goals"
              style={{
                fontSize: 13,
                color: "var(--brand)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Set a goal →
            </a>
          </div>
        )}

        {/* Budget by category */}
        <div className="sp-card sp-card-pad">
          <div className="sp-card-head">
            <div>
              <div className="sp-card-title">Budget by category</div>
              <div className="sp-card-sub">
                {formatCurrency(totalSpent, user.currency)} of{" "}
                {formatCurrency(totalBudget, user.currency)} used
              </div>
            </div>
          </div>
          {byCategory.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "var(--ink-3)",
                fontSize: 13,
              }}
            >
              No categories with budgets yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 17 }}>
              {byCategory
                .filter((c) => c.budget)
                .map((c) => {
                  const over = c.spent > c.budget;
                  return (
                    <div key={c.id}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            display: "grid",
                            placeItems: "center",
                            background: (c.color || "#888") + "22",
                            fontSize: 14,
                            flex: "none",
                          }}
                        >
                          {c.icon}
                        </span>
                        <span
                          style={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: "var(--ink)",
                            flex: 1,
                          }}
                        >
                          {c.name}
                        </span>
                        <span
                          className="sp-num"
                          style={{
                            fontSize: 12.5,
                            color: "var(--ink-2)",
                            fontWeight: 500,
                          }}
                        >
                          {formatCurrency(c.spent, user.currency)}{" "}
                          <span style={{ color: "var(--ink-3)" }}>
                            / {formatCurrency(c.budget, user.currency)}
                          </span>
                        </span>
                        {over && (
                          <span
                            className="sp-pill sp-pill-neg"
                            style={{ height: 22, fontSize: 11 }}
                          >
                            Over
                          </span>
                        )}
                      </div>
                      <Progress
                        value={c.spent}
                        max={c.budget}
                        color={c.color}
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <BudgetModal
        open={budgetOpen}
        onClose={() => setBudgetOpen(false)}
        currency={user.currency}
        initialValue={
          summary?.totalBudget ? summary.totalBudget.toString() : (user.monthlyBudget?.toString() ?? "")
        }
        month={cycleStart.getMonth() + 1}
        year={cycleStart.getFullYear()}
        useDefaultBudget={summary?.useDefaultBudget ?? true}
      />
    </div>
  );
}

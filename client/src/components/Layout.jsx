import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Receipt, FolderOpen, Tag, Target, Settings,
  Wallet, ChevronRight, LogOut, Moon, Sun, X, PlusCircle, LifeBuoy, Share2,
} from "lucide-react";
import { useLogout } from "../api/auth.js";
import BudgetModal from "./BudgetModal.jsx";
import ShareModal, { triggerShare } from "./ShareModal.jsx";
import { useGoals, useUpdateGoal } from "../api/goals.js";
import { formatCurrency } from "../utils/format.js";
import { getCycleRange } from "../utils/cycle.js";
import { useDarkMode } from "../hooks/useDarkMode.js";
import TopBar from "./TopBar.jsx";
import SmartAddModal from "./SmartAddModal.jsx";
import InstallBanner from "./InstallBanner.jsx";
import FeedbackPrompt from "./FeedbackPrompt.jsx";
import TourOverlay from "./TourOverlay.jsx";

const FORM_TYPE = {
  "/categories": "category",
  "/goals":      "goal",
  "/tags":       "tag",
};

function getFormType(pathname) {
  for (const [prefix, type] of Object.entries(FORM_TYPE)) {
    if (pathname.startsWith(prefix)) return type;
  }
  return "expense";
}

const FAB_LABELS = {
  expense:  "Add expense",
  category: "New category",
  goal:     "New goal",
  tag:      "New tag",
};

const NAV = [
  { to: "/dashboard",  icon: LayoutDashboard, label: "Dashboard",      tourId: "nav-dashboard"  },
  { to: "/expenses",   icon: Receipt,          label: "Expenses",       tourId: "nav-expenses"   },
  { to: "/categories", icon: FolderOpen,       label: "Categories",     tourId: "nav-categories" },
  { to: "/goals",      icon: Target,           label: "Goals",          tourId: "nav-goals"      },
  { to: "/tags",       icon: Tag,              label: "Tags",           tourId: "nav-tags"       },
  { to: "/settings",   icon: Settings,         label: "Settings",       tourId: "nav-settings"   },
  { to: "/support",    icon: LifeBuoy,         label: "Help & Support", tourId: "nav-support"    },
];

const TOUR_STEPS = [
  {
    selector: '[data-tour="budget-btn"]',
    title: "Set your monthly budget",
    desc: "Tap + to tell Spendly your spending limit for this pay cycle. Your remaining budget will appear here instantly.",
    side: "bottom",
  },
  {
    selector: '[data-tour="nav-expenses"]',
    title: "Expenses",
    desc: "Every transaction you log lives here — filter, search, and review your spending history.",
    side: "right",
  },
  {
    selector: '[data-tour="nav-categories"]',
    title: "Categories",
    desc: "Organise spending into categories like Food or Transport, each with its own budget limit.",
    side: "right",
  },
  {
    selector: '[data-tour="nav-goals"]',
    title: "Goals",
    desc: "Set savings targets and track how close you are each pay cycle.",
    side: "right",
  },
  {
    selector: '[data-tour="goals-section"]',
    title: "Track your savings",
    desc: "Create a primary savings goal and log progress each cycle. Spendly shows how close you are at a glance.",
    side: "bottom",
    navigate: "/goals",
  },
  {
    selector: '[data-tour="nav-tags"]',
    title: "Tags",
    desc: "Add tags to expenses for flexible cross-category grouping — useful for trips, events, or any custom label.",
    side: "right",
  },
  {
    selector: '[data-tour="nav-settings"]',
    title: "Settings",
    desc: "Update your name, currency, budget cycle, and appearance preferences.",
    side: "right",
  },
  {
    selector: '[data-tour="settings-profile"]',
    title: "Personalize Spendly",
    desc: "Set your monthly budget limit here — it's what drives the Remaining Budget card on your dashboard.",
    side: "bottom",
    navigate: "/settings",
  },
  {
    selector: '[data-tour="nav-support"]',
    title: "Help & Support",
    desc: "Have a question or want to suggest something? Reach out directly from the app.",
    side: "right",
  },
  {
    selector: '[data-tour="support-form"]',
    title: "Get help anytime",
    desc: "Send feedback, report a bug, or ask a question — we read and respond to everything.",
    side: "bottom",
    navigate: "/support",
  },
  {
    selector: '[data-tour="fab-add"]',
    title: "Add expense or income",
    desc: "This button adapts to where you are — it adds an expense from the dashboard or expenses page, a category from Categories, a goal from Goals, and a tag from Tags.",
    side: "top",
  },
];

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function Layout({ user, children }) {
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [budgetGateOpen, setBudgetGateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const logout = useLogout();
  const { cycleStart: gateCycleStart } = getCycleRange(user?.salaryDay);

  const { data: goals = [] } = useGoals();
  const updateGoal = useUpdateGoal();
  const primaryGoal = goals.find((g) => g.isPrimary);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem("sp_savings_reminder") || "{}");
      return v.month === currentMonth;
    } catch { return false; }
  });
  const [bannerAmount, setBannerAmount] = useState("");
  const [bannerAdding, setBannerAdding] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState(null);

  const showBanner = !!primaryGoal && !bannerDismissed && !pathname.startsWith("/settings");

  const dismissBanner = () => {
    localStorage.setItem("sp_savings_reminder", JSON.stringify({ month: currentMonth }));
    setBannerDismissed(true);
  };

  const handleBannerAddSavings = async () => {
    const amount = parseFloat(bannerAmount);
    if (!amount || amount <= 0 || !primaryGoal) return;
    setBannerAdding(true);
    try {
      const newSaved = (primaryGoal.saved || 0) + amount;
      await updateGoal.mutateAsync({ id: primaryGoal.id, saved: newSaved });
      const newPct = Math.min(Math.round((newSaved / primaryGoal.target) * 100), 100);
      const left = Math.max(primaryGoal.target - newSaved, 0);
      const monthsLeft = primaryGoal.monthly > 0 ? Math.ceil(left / primaryGoal.monthly) : null;
      setBannerSuccess({ added: amount, newPct, monthsLeft });
      setBannerAmount("");
      setTimeout(() => {
        dismissBanner();
        setBannerSuccess(null);
      }, 3500);
    } finally {
      setBannerAdding(false);
    }
  };

  const [tourDone, setTourDone] = useState(
    () => !!localStorage.getItem("sp_tour_v1"),
  );
  const [tourSidebarStep, setTourSidebarStep] = useState(false);
  const navigateTo = useNavigate();

  const handleTourStep = (stepIndex) => {
    const step = TOUR_STEPS[stepIndex];
    const sidebarSteps = new Set([1, 2, 3, 5, 7]);
    const needsMenu = sidebarSteps.has(stepIndex);
    setMenu(needsMenu);
    setTourSidebarStep(needsMenu);
    if (step?.navigate) navigateTo(step.navigate);
  };

  const handleTourDone = () => {
    localStorage.setItem("sp_tour_v1", "1");
    setMenu(false);
    setTourSidebarStep(false);
    setTourDone(true);
    navigateTo("/dashboard");
  };

  return (
    <div className="sp-app" data-menu={menu}>
      {/* Sidebar */}
      <aside className="sp-sidebar">
        {/* Brand + close btn (close only visible on mobile) */}
        <div className="sp-brand">
          <div className="sp-brand-mark">
            <Wallet style={{ width: 20, height: 20 }} />
          </div>
          <div className="sp-brand-name">Spendly</div>
          <button
            className="sp-icon-btn sp-sidebar-close"
            onClick={() => setMenu(false)}
            style={{ marginLeft: "auto", width: 32, height: 32 }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <nav className="sp-nav">
          {NAV.map(({ to, icon: Icon, label, tourId }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`sp-nav-item${active ? " active" : ""}`}
                data-tour={tourId}
                onClick={() => setMenu(false)}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sp-sidebar-foot">
          {/* Mobile-only controls */}
          <div className="sp-sidebar-mobile-only">
            {/* User row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 10px", marginBottom: 4,
              borderRadius: "var(--r-sm)", background: "var(--surface-2)",
              border: "1px solid var(--line)",
            }}>
              <div className="sp-avatar" style={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>
                {getInitials(user?.name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Refer a friend */}
            <button
              onClick={() => triggerShare(() => setShareOpen(true))}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                height: 42, padding: "0 14px",
                borderRadius: "var(--r-sm)", color: "var(--brand)",
                fontSize: 14, fontWeight: 600,
                background: "color-mix(in srgb, var(--brand) 8%, transparent)",
                border: "none",
                transition: "background var(--d1) var(--e)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--brand) 15%, transparent)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--brand) 8%, transparent)")}
            >
              <Share2 style={{ width: 18, height: 18 }} />
              Refer a friend
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                height: 42, padding: "0 14px",
                borderRadius: "var(--r-sm)", color: "var(--ink-2)",
                fontSize: 14, fontWeight: 500,
                transition: "background var(--d1) var(--e)",
                justifyContent: "space-between",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--ink) 5%, transparent)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {dark ? <Moon style={{ width: 18, height: 18 }} /> : <Sun style={{ width: 18, height: 18 }} />}
                {dark ? "Dark mode" : "Light mode"}
              </span>
              <div style={{
                width: 40, height: 24, borderRadius: 99, flexShrink: 0,
                background: dark ? "var(--brand)" : "var(--line)",
                position: "relative", transition: "background var(--d1) var(--e)",
              }}>
                <div style={{
                  position: "absolute", top: 3, left: dark ? 19 : 3,
                  width: 18, height: 18, borderRadius: 50, background: "var(--surface)",
                  transition: "left var(--d1) var(--e)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </div>
            </button>

          </div>

          {/* Desktop upsell card */}
          <div className="sp-upsell sp-sidebar-desktop-only">
            <div className="sp-upsell-title">Track your goals 🌱</div>
            <div className="sp-upsell-desc">Stay on budget this cycle to hit your savings goal faster.</div>
            <Link to="/goals" className="sp-upsell-btn" onClick={() => setMenu(false)}>
              View goals <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          {/* Sign out — always visible */}
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 6 }}>
            <button
              onClick={() => logout.mutate()}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                height: 44, padding: "0 14px",
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--line)",
                background: "var(--surface-2)",
                color: "var(--ink-2)",
                fontSize: 14, fontWeight: 600,
                transition: "background var(--d1) var(--e), color var(--d1) var(--e), border-color var(--d1) var(--e)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "color-mix(in srgb, var(--neg) 10%, transparent)"; e.currentTarget.style.color = "var(--neg)"; e.currentTarget.style.borderColor = "var(--neg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--ink-2)"; e.currentTarget.style.borderColor = "var(--line)"; }}
            >
              <LogOut style={{ width: 16, height: 16 }} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="sp-main">
        <TopBar
          user={user}
          pathname={pathname}
          dark={dark}
          onToggleDark={toggleDark}
          onMenu={() => setMenu((m) => !m)}
          setAddOpen={setAddOpen}
        />
        <div className="sp-content">
          <div className="sp-content-inner">
            {showBanner && (
              <div style={{
                marginBottom: 16, borderRadius: "var(--r-md)",
                border: "1px solid color-mix(in srgb, var(--brand) 30%, transparent)",
                background: "var(--brand-soft)", padding: "14px 16px",
                display: "flex", flexDirection: "column", gap: 10, position: "relative",
              }}>
                <button
                  onClick={dismissBanner}
                  style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", display: "grid", placeItems: "center", padding: 4 }}
                >
                  <X size={14} />
                </button>

                {!bannerSuccess ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 24 }}>
                      <span style={{ fontSize: 20 }}>🐖</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>Time to log this month's savings</div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                          You're {Math.min(Math.round(((primaryGoal.saved || 0) / primaryGoal.target) * 100), 100)}% toward <strong>{primaryGoal.name}</strong>.
                          {primaryGoal.monthly > 0 && ` Add your ${formatCurrency(primaryGoal.monthly, user.currency)} contribution.`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="number"
                        min="0"
                        placeholder={primaryGoal.monthly > 0 ? `e.g. ${primaryGoal.monthly}` : "Amount saved"}
                        value={bannerAmount}
                        onChange={(e) => setBannerAmount(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleBannerAddSavings()}
                        style={{ flex: 1, height: 36, padding: "0 10px", borderRadius: "var(--r-sm)", border: "1px solid color-mix(in srgb, var(--brand) 50%, transparent)", background: "var(--surface)", color: "var(--ink)", fontSize: 14, outline: "none" }}
                      />
                      <button onClick={handleBannerAddSavings} disabled={bannerAdding} className="sp-btn sp-btn-primary" style={{ height: 36, padding: "0 16px", fontSize: 13 }}>
                        {bannerAdding ? "…" : "Add savings"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28 }}>🎉</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--brand)" }}>You're now {bannerSuccess.newPct}% funded!</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>
                        {formatCurrency(bannerSuccess.added, user.currency)} added to {primaryGoal.name}.
                        {bannerSuccess.monthsLeft != null && ` Just ${bannerSuccess.monthsLeft} month${bannerSuccess.monthsLeft !== 1 ? "s" : ""} to go 🚀`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {typeof children === "function" ? children({ addOpen, setAddOpen }) : children}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        className="sp-fab"
        data-tour="fab-add"
        aria-label={FAB_LABELS[getFormType(pathname)]}
        onClick={() => {
          if (getFormType(pathname) === "expense" && !user?.monthlyBudget) {
            setBudgetGateOpen(true);
          } else {
            setAddOpen(true);
          }
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <SmartAddModal open={addOpen} onClose={() => setAddOpen(false)} type={getFormType(pathname)} />

      <BudgetModal
        open={budgetGateOpen}
        onClose={() => setBudgetGateOpen(false)}
        currency={user?.currency}
        initialValue=""
        hint="You need to set a monthly budget before logging your first expense."
        onSaved={() => setAddOpen(true)}
        month={gateCycleStart.getMonth() + 1}
        year={gateCycleStart.getFullYear()}
        useDefaultBudget={user?.useDefaultBudget ?? true}
      />

      {/* Mobile menu scrim */}
      {menu && (
        <div
          onClick={tourSidebarStep ? undefined : () => setMenu(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 94,
            background: tourSidebarStep ? "transparent" : "rgba(0,0,0,0.35)",
            backdropFilter: tourSidebarStep ? "none" : "blur(2px)",
          }}
        />
      )}

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />

      <InstallBanner />
      <FeedbackPrompt />

      {!tourDone && (
        <TourOverlay
          steps={TOUR_STEPS}
          onStep={handleTourStep}
          onDone={handleTourDone}
        />
      )}
    </div>
  );
}


import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Receipt, FolderOpen, Tag, Target, Settings,
  Wallet, ChevronRight, LogOut, Moon, Sun, X,
} from "lucide-react";
import { useLogout } from "../api/auth.js";
import TopBar from "./TopBar.jsx";
import SmartAddModal from "./SmartAddModal.jsx";

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
  { to: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { to: "/expenses",   icon: Receipt,          label: "Expenses" },
  { to: "/categories", icon: FolderOpen,       label: "Categories" },
  { to: "/goals",      icon: Target,           label: "Goals" },
  { to: "/tags",       icon: Tag,              label: "Tags" },
  { to: "/settings",   icon: Settings,         label: "Settings" },
];

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function Layout({ user, children }) {
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const logout = useLogout();

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
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
          {NAV.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`sp-nav-item${active ? " active" : ""}`}
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

            {/* Sign out */}
            <button
              onClick={() => logout.mutate()}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                height: 42, padding: "0 14px",
                borderRadius: "var(--r-sm)", color: "var(--ink-3)",
                fontSize: 14, fontWeight: 500,
                transition: "background var(--d1) var(--e), color var(--d1) var(--e)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "color-mix(in srgb, var(--neg) 10%, transparent)"; e.currentTarget.style.color = "var(--neg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-3)"; }}
            >
              <LogOut style={{ width: 18, height: 18 }} />
              Sign out
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
            {typeof children === "function" ? children({ addOpen, setAddOpen }) : children}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button className="sp-fab" onClick={() => setAddOpen(true)} aria-label={FAB_LABELS[getFormType(pathname)]}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <SmartAddModal open={addOpen} onClose={() => setAddOpen(false)} type={getFormType(pathname)} />

      {/* Mobile menu scrim */}
      {menu && (
        <div
          onClick={() => setMenu(false)}
          style={{ position: "fixed", inset: 0, zIndex: 94, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}
        />
      )}
    </div>
  );
}


import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Receipt, FolderOpen, Tag, Target, Settings, Wallet, ChevronRight,
} from "lucide-react";
import TopBar from "./TopBar.jsx";

const NAV = [
  { to: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { to: "/expenses",   icon: Receipt,          label: "Expenses" },
  { to: "/categories", icon: FolderOpen,       label: "Categories" },
  { to: "/goals",      icon: Target,           label: "Goals" },
  { to: "/tags",       icon: Tag,              label: "Tags" },
  { to: "/settings",   icon: Settings,         label: "Settings" },
];

export default function Layout({ user, children }) {
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="sp-app" data-menu={menu}>
      {/* Sidebar */}
      <aside className="sp-sidebar">
        <div className="sp-brand">
          <div className="sp-brand-mark">
            <Wallet style={{ width: 20, height: 20 }} />
          </div>
          <div className="sp-brand-name">Spendly</div>
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
          <div className="sp-upsell">
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
          onAdd={() => setAddOpen(true)}
          onMenu={() => setMenu((m) => !m)}
          addOpen={addOpen}
          setAddOpen={setAddOpen}
        />
        <div className="sp-content">
          <div className="sp-content-inner">
            {typeof children === "function" ? children({ addOpen, setAddOpen }) : children}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button className="sp-fab" onClick={() => setAddOpen(true)} aria-label="Add expense">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Mobile menu scrim */}
      {menu && (
        <div
          onClick={() => setMenu(false)}
          style={{ position: "fixed", inset: 0, zIndex: 94, background: "rgba(0,0,0,0.3)" }}
        />
      )}
    </div>
  );
}

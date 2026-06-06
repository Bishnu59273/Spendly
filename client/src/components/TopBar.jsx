import { useState, useEffect } from "react";
import { Search, Moon, Sun, Plus, Menu, LogOut } from "lucide-react";
import { useLogout } from "../api/auth.js";
import ExpenseForm from "./ExpenseForm.jsx";
import NotificationPanel from "./NotificationPanel.jsx";

const TITLES = {
  "/dashboard":  { eyebrow: "Overview",          title: "Dashboard" },
  "/expenses":   { eyebrow: "This pay cycle",     title: "Expenses" },
  "/categories": { eyebrow: "Budget allocation",  title: "Categories" },
  "/goals":      { eyebrow: "Saving toward",      title: "Goals" },
  "/tags":       { eyebrow: "Organise",           title: "Tags" },
  "/settings":   { eyebrow: "Account",            title: "Settings" },
};

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function TopBar({ user, pathname, onMenu, addOpen, setAddOpen }) {
  const logout = useLogout();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const t = Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] || TITLES["/dashboard"];

  return (
    <>
      <header className="sp-topbar">
        <button className="sp-icon-btn sp-menu-btn" style={{ display: "none" }} onClick={onMenu}>
          <Menu style={{ width: 20, height: 20 }} />
        </button>

        <div className="sp-topbar-titles">
          <div className="sp-topbar-eyebrow">{t.eyebrow}</div>
          <div className="sp-topbar-title">{t.title}</div>
        </div>

        <div className="sp-topbar-spacer" />

        <div className="sp-topbar-right">
          <div className="sp-search">
            <Search style={{ width: 17, height: 17 }} />
            <input placeholder="Search…" />
          </div>

          <button
            className="sp-icon-btn"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle theme"
          >
            {dark
              ? <Sun style={{ width: 18, height: 18 }} />
              : <Moon style={{ width: 18, height: 18 }} />
            }
          </button>

          <NotificationPanel currency={user?.currency} />

          <button className="sp-btn sp-btn-primary" onClick={() => setAddOpen(true)}>
            <Plus style={{ width: 17, height: 17 }} />
            Add expense
          </button>

          <div className="sp-user-chip">
            <div className="sp-avatar">{getInitials(user?.name)}</div>
            <span className="sp-uname">{user?.name?.split(" ")[0]}</span>
          </div>

          <button
            className="sp-icon-btn"
            onClick={() => logout.mutate()}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut style={{ width: 17, height: 17 }} />
          </button>
        </div>
      </header>

      <ExpenseForm open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

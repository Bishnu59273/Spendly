import { Menu, Moon, Sun, Plus, Share2 } from "lucide-react";
import { useState } from "react";
import NotificationPanel from "./NotificationPanel.jsx";
import ShareModal, { triggerShare } from "./ShareModal.jsx";

const TITLES = {
  "/dashboard":  { eyebrow: "Overview",          title: "Dashboard" },
  "/expenses":   { eyebrow: "This pay cycle",     title: "Expenses" },
  "/categories": { eyebrow: "Budget allocation",  title: "Categories" },
  "/goals":      { eyebrow: "Saving toward",      title: "Goals" },
  "/tags":       { eyebrow: "Organise",           title: "Tags" },
  "/settings":   { eyebrow: "Account",            title: "Settings" },
  "/support":    { eyebrow: "We're here to help",  title: "Help & Support" },
};

const ADD_LABELS = {
  "/categories": "New category",
  "/goals":      "New goal",
  "/tags":       "New tag",
};

function getAddLabel(pathname) {
  for (const [prefix, label] of Object.entries(ADD_LABELS)) {
    if (pathname.startsWith(prefix)) return label;
  }
  return "Add expense";
}

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function TopBar({ user, pathname, dark, onToggleDark, onMenu, setAddOpen }) {
  const t = Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] || TITLES["/dashboard"];
  const addLabel = getAddLabel(pathname);
  const [shareOpen, setShareOpen] = useState(false);

  function handleShare() {
    triggerShare(() => setShareOpen(true));
  }

  return (
    <header className="sp-topbar">
      {/* Hamburger — mobile only */}
      <button className="sp-icon-btn sp-menu-btn" style={{ display: "none" }} onClick={onMenu}>
        <Menu style={{ width: 20, height: 20 }} />
      </button>

      {/* Page title */}
      <div className="sp-topbar-titles">
        <div className="sp-topbar-eyebrow">{t.eyebrow}</div>
        <div className="sp-topbar-title">{t.title}</div>
      </div>

      <div className="sp-topbar-spacer" />

      {/* Always visible, even on mobile */}
      <NotificationPanel />

      {/* Desktop-only right section */}
      <div className="sp-topbar-right sp-hide-mobile">
        <button className="sp-icon-btn" onClick={handleShare} aria-label="Share Spendly">
          <Share2 style={{ width: 18, height: 18 }} />
        </button>

        <button
          className="sp-icon-btn"
          onClick={onToggleDark}
          aria-label="Toggle theme"
        >
          {dark
            ? <Sun style={{ width: 18, height: 18 }} />
            : <Moon style={{ width: 18, height: 18 }} />
          }
        </button>

        <button className="sp-btn sp-btn-primary" onClick={() => setAddOpen(true)}>
          <Plus style={{ width: 17, height: 17 }} />
          {addLabel}
        </button>

        <div className="sp-user-chip">
          <div className="sp-avatar">{getInitials(user?.name)}</div>
          <span className="sp-uname">{user?.name?.split(" ")[0]}</span>
        </div>
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </header>
  );
}

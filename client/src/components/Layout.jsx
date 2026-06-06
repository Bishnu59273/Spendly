import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Receipt, Tags, FolderOpen } from "lucide-react";
import TopBar from "./TopBar.jsx";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/expenses", icon: Receipt, label: "Expenses" },
  { to: "/categories", icon: FolderOpen, label: "Categories" },
  { to: "/tags", icon: Tags, label: "Tags" },
];

export default function Layout({ user, children }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar user={user} />
      <div className="flex">
        <nav className="hidden md:flex flex-col w-56 min-h-[calc(100vh-57px)] border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(to)
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-around py-2 z-20">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
              pathname.startsWith(to) ? "text-indigo-600" : "text-gray-400"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

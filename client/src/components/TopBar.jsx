import { LogOut, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useLogout } from "../api/auth.js";

export default function TopBar({ user }) {
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <Link to="/dashboard" className="flex items-center gap-2">
        <span className="text-xl font-bold text-indigo-600">Spendly</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link to="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <Settings size={18} />
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800">
          <User size={16} className="text-indigo-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
            {user?.name}
          </span>
        </div>
        <button
          onClick={() => logout.mutate()}
          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

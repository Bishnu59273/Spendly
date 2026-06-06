import { useState } from "react";
import { Moon, Sun, Save, Wallet, X } from "lucide-react";
import { useUpdateProfile } from "../api/auth.js";
import { formatCurrency } from "../utils/format.js";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD"];

export default function Settings({ user }) {
  const update = useUpdateProfile();
  const [form, setForm] = useState({
    name: user.name,
    salaryDay: user.salaryDay,
    currency: user.currency,
    monthlyBudget: user.monthlyBudget?.toString() || "",
  });
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await update.mutateAsync({
        name: form.name,
        salaryDay: parseInt(form.salaryDay),
        currency: form.currency,
        monthlyBudget: form.monthlyBudget ? parseFloat(form.monthlyBudget) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save");
    }
  };

  const clearBudget = async () => {
    set("monthlyBudget", "");
    await update.mutateAsync({ monthlyBudget: null });
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">Profile</h2>

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget Start Day</label>
            <input
              type="number"
              min="1"
              max="31"
              required
              value={form.salaryDay}
              onChange={(e) => set("salaryDay", e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">Day 1–31. Auto-caps if the month is shorter.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Monthly Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monthly Budget
          </label>
          <div className="relative">
            <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="number"
              min="0"
              step="1"
              value={form.monthlyBudget}
              onChange={(e) => set("monthlyBudget", e.target.value)}
              placeholder="e.g. 30000"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {form.monthlyBudget && (
              <button
                type="button"
                onClick={() => set("monthlyBudget", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Your total spending limit per cycle. Shows as "Remaining Budget" on the dashboard.
            {user.monthlyBudget && (
              <span className="ml-1 text-indigo-500 font-medium">
                Current: {formatCurrency(user.monthlyBudget, form.currency)}
              </span>
            )}
          </p>
        </div>

        {/* Live preview */}
        {form.monthlyBudget && (
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-indigo-700 dark:text-indigo-300">Monthly Budget</span>
            <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
              {formatCurrency(parseFloat(form.monthlyBudget) || 0, form.currency)}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={update.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-60"
        >
          <Save size={16} />
          {saved ? "Saved!" : update.isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
            <p className="text-xs text-gray-400 mt-0.5">Switch between light and dark theme</p>
          </div>
          <button
            onClick={toggleDark}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              darkMode ? "bg-indigo-600" : "bg-gray-200"
            }`}
          >
            <span className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-7" : "translate-x-1"}`}>
              {darkMode ? <Moon size={12} className="text-indigo-600" /> : <Sun size={12} className="text-amber-500" />}
            </span>
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Account</h2>
        <p className="text-sm text-gray-500">{user.email}</p>
        <p className="text-xs text-gray-400 mt-1">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

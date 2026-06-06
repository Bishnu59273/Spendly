import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, TrendingUp, Wallet, Clock, Tag } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { useCycleSummary, useChartData, useTrend } from "../api/summary.js";
import { useExpenses } from "../api/expenses.js";
import { CardSkeleton, ExpenseSkeleton } from "../components/Skeleton.jsx";
import ExpenseForm from "../components/ExpenseForm.jsx";
import Pill from "../components/Pill.jsx";
import { formatCurrency, formatDate } from "../utils/format.js";
import { getCycleRange, formatCycleLabel, prevCycleRef, nextCycleRef } from "../utils/cycle.js";

function SummaryCard({ label, value, icon: Icon, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600",
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function BudgetBar({ category, currency }) {
  if (!category.budget) return null;
  const pct = Math.min((category.spent / category.budget) * 100, 100);
  const over = category.spent > category.budget;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-300">{category.icon} {category.name}</span>
        <span className={over ? "text-red-500 font-semibold" : "text-gray-500"}>
          {formatCurrency(category.spent, currency)} / {formatCurrency(category.budget, currency)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-indigo-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [cycleRef, setCycleRef] = useState(new Date());

  const { cycleStart, cycleEnd } = getCycleRange(user.salaryDay, cycleRef);
  const cycleStartParam = cycleStart.toISOString();

  const { data: summary, isLoading: summaryLoading } = useCycleSummary({ cycleStart: cycleStartParam });
  const { data: chartData, isLoading: chartLoading } = useChartData({ cycleStart: cycleStartParam });
  const { data: trend } = useTrend();
  const { data: expenses = [], isLoading: expLoading } = useExpenses({ cycleStart: cycleStartParam });

  const remaining = summary ? summary.remaining : 0;
  const remainingPct = summary?.totalBudget ? (remaining / summary.totalBudget) * 100 : null;
  const remainingColor = remainingPct === null ? "indigo" : remainingPct > 50 ? "green" : remainingPct > 20 ? "amber" : "red";

  const topCategory = summary?.byCategory?.sort((a, b) => b.spent - a.spent)[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Cycle navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl px-5 py-4 shadow-sm">
        <button
          onClick={() => setCycleRef(prevCycleRef(cycleStart, user.salaryDay))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pay Cycle</p>
          <p className="font-semibold text-gray-900 dark:text-white">{formatCycleLabel(cycleStart, cycleEnd)}</p>
        </div>
        <button
          onClick={() => setCycleRef(nextCycleRef(cycleStart, user.salaryDay))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <SummaryCard label="Total Spent" value={formatCurrency(summary?.totalSpent || 0, user.currency)} icon={Wallet} color="indigo" />
            <SummaryCard
              label={summary?.totalBudget ? "Remaining Budget" : "Monthly Budget"}
              value={
                summary?.totalBudget
                  ? formatCurrency(remaining, user.currency)
                  : <span className="text-sm text-gray-400 font-normal">Not set — go to Settings</span>
              }
              icon={TrendingUp}
              color={remainingColor}
            />
            <SummaryCard label="Days Left" value={`${summary?.daysLeft ?? "—"} days`} icon={Clock} color="amber" />
            <SummaryCard
              label="Top Category"
              value={topCategory ? `${topCategory.icon} ${topCategory.name}` : "—"}
              icon={Tag}
              color="indigo"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h3>
          {chartLoading ? (
            <div className="h-48 flex items-center justify-center"><div className="animate-pulse w-36 h-36 rounded-full bg-gray-200 dark:bg-gray-700" /></div>
          ) : (chartData?.pieData?.length || 0) === 0 ? (
            <p className="text-gray-400 text-center py-10 text-sm">No expenses this cycle</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                  {chartData.pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, user.currency)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Last 6 Cycles</h3>
          {!trend ? (
            <div className="h-48 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trend.barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v, user.currency)} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Budget bars */}
      {summary?.byCategory?.some((c) => c.budget) && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Budget Progress</h3>
          {summary.byCategory.filter((c) => c.budget).map((c) => (
            <BudgetBar key={c.id} category={c} currency={user.currency} />
          ))}
        </div>
      )}

      {/* Recent expenses */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Expenses</h3>
        {expLoading ? (
          Array.from({ length: 5 }).map((_, i) => <ExpenseSkeleton key={i} />)
        ) : expenses.length === 0 ? (
          <p className="text-gray-400 text-center py-8 text-sm">No expenses yet this cycle</p>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {expenses.slice(0, 10).map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: e.category.color + "22" }}
                >
                  {e.category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {e.note || e.category.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400">{formatDate(e.date)}</span>
                    {e.tags.map((t) => (
                      <Pill key={t.tagId} icon={t.tag.icon} label={t.tag.name} color={t.tag.color} />
                    ))}
                  </div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white text-sm ml-2">
                  {formatCurrency(e.amount, user.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 md:bottom-8 right-6 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-colors z-10"
      >
        <Plus size={24} />
      </button>

      <ExpenseForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}

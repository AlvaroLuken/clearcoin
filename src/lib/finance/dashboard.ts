import type { BudgetHealth, SyncedTransaction } from "./budget";

export type TopCategory = {
  category: string;
  spend: number;
  count: number;
};

export type BudgetTone = {
  label: string;
  accent: string;
  badge: string;
  surface: string;
};

const money = (value: number) => Math.round(value * 100) / 100;

type ToneStatus = BudgetHealth["status"] | "healthy" | "watch" | "over-budget";

export function summarizeTopCategories(transactions: SyncedTransaction[], limit = 5): TopCategory[] {
  const totals = new Map<string, TopCategory>();

  for (const transaction of transactions) {
    if (transaction.amount <= 0) continue;
    const category = transaction.category || "Other";
    const current = totals.get(category) ?? { category, spend: 0, count: 0 };
    totals.set(category, {
      category,
      spend: money(current.spend + transaction.amount),
      count: current.count + 1,
    });
  }

  return Array.from(totals.values())
    .sort((a, b) => b.spend - a.spend)
    .slice(0, limit);
}

export function getBudgetTone(status: ToneStatus): BudgetTone {
  if (status === "monthly-overrun" || status === "over-budget") {
    return {
      label: "Over budget",
      accent: "text-red-700 dark:text-red-300",
      badge: "border-red-200 bg-red-50 text-red-800 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-200",
      surface: "border-red-200 bg-red-50 dark:border-red-400/20 dark:bg-red-400/10",
    };
  }

  if (status === "weekly-overrun" || status === "watch") {
    return {
      label: "Watch closely",
      accent: "text-amber-700 dark:text-amber-300",
      badge: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200",
      surface: "border-amber-200 bg-amber-50 dark:border-amber-400/20 dark:bg-amber-400/10",
    };
  }

  return {
    label: "On track",
    accent: "text-emerald-700 dark:text-emerald-300",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200",
    surface: "border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10",
  };
}

export function buildDashboardInsights(input: { connectedCount: number; monthlyRemaining: number; weeklyRemaining: number }) {
  const insights: string[] = [];

  if (input.connectedCount === 0) {
    insights.push("Connect Chase or card accounts to replace estimates with synced transactions.");
  }

  if (input.monthlyRemaining < 0) {
    insights.push("Monthly spend is above plan. Review the largest categories before the next statement closes.");
  } else if (input.weeklyRemaining < 0) {
    insights.push("This week is running hot. Slow discretionary spend before it becomes a monthly problem.");
  } else {
    insights.push("Budget is currently on track. Watch category drift instead of total spend only.");
  }

  if (input.connectedCount > 0) {
    insights.push("Connected data is flowing. Keep manual entry as a fallback, not the source of truth.");
  }

  return insights;
}

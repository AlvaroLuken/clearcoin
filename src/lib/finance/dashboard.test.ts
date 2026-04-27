import { describe, expect, it } from "vitest";
import { buildDashboardInsights, getBudgetTone, summarizeTopCategories } from "./dashboard";
import type { SyncedTransaction } from "./budget";

const transactions: SyncedTransaction[] = [
  { id: "1", amount: 120, date: "2026-04-02", category: "Dining", merchantName: "Tacos El Franc" },
  { id: "2", amount: 80, date: "2026-04-04", category: "Groceries", merchantName: "Market" },
  { id: "3", amount: 45, date: "2026-04-05", category: "Dining", merchantName: "Coffee" },
  { id: "4", amount: -2500, date: "2026-04-06", category: "Income", merchantName: "Payroll" },
];

describe("dashboard presentation helpers", () => {
  it("groups and sorts top spend categories without counting income", () => {
    expect(summarizeTopCategories(transactions)).toEqual([
      { category: "Dining", spend: 165, count: 2 },
      { category: "Groceries", spend: 80, count: 1 },
    ]);
  });

  it("returns accessible budget tones for status labels", () => {
    expect(getBudgetTone("healthy")).toMatchObject({ label: "On track", accent: "text-emerald-700 dark:text-emerald-300" });
    expect(getBudgetTone("watch")).toMatchObject({ label: "Watch closely", accent: "text-amber-700 dark:text-amber-300" });
    expect(getBudgetTone("over-budget")).toMatchObject({ label: "Over budget", accent: "text-red-700 dark:text-red-300" });
  });

  it("builds next-action insights from connection and spend state", () => {
    expect(buildDashboardInsights({ connectedCount: 0, monthlyRemaining: 500, weeklyRemaining: 100 })).toContain("Connect Chase or card accounts to replace estimates with synced transactions.");
    expect(buildDashboardInsights({ connectedCount: 2, monthlyRemaining: -50, weeklyRemaining: 100 })).toContain("Monthly spend is above plan. Review the largest categories before the next statement closes.");
    expect(buildDashboardInsights({ connectedCount: 2, monthlyRemaining: 500, weeklyRemaining: 100 })).toContain("Budget is currently on track. Watch category drift instead of total spend only.");
  });
});

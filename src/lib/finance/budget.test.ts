import { describe, expect, it } from "vitest";
import { calculateBudgetHealth, summarizeTransactions } from "./budget";

const tx = (amount: number, date: string, category: string) => ({
  id: `${amount}-${date}-${category}`,
  amount,
  date,
  category,
  merchantName: category,
});

describe("summarizeTransactions", () => {
  it("separates income from spend and groups card spend by week and month", () => {
    const summary = summarizeTransactions([
      tx(-4200, "2026-04-01", "Payroll"),
      tx(88.5, "2026-04-02", "Food"),
      tx(140, "2026-04-08", "Transport"),
      tx(22, "2026-05-01", "Food"),
    ]);

    expect(summary.income).toBe(4200);
    expect(summary.spend).toBe(250.5);
    expect(summary.byMonth["2026-04"].spend).toBe(228.5);
    expect(summary.byMonth["2026-05"].spend).toBe(22);
    expect(Object.values(summary.byWeek).reduce((sum, row) => sum + row.spend, 0)).toBe(250.5);
  });
});

describe("calculateBudgetHealth", () => {
  it("computes weekly and monthly runway from salary, income, and synced spend", () => {
    const health = calculateBudgetHealth({
      monthlySalary: 6500,
      extraIncome: 400,
      monthlyBudget: 3200,
      weeklyBudget: 800,
      monthlySpend: 2400,
      weeklySpend: 620,
    });

    expect(health.monthlyRemaining).toBe(800);
    expect(health.weeklyRemaining).toBe(180);
    expect(health.savingsPotential).toBe(3700);
    expect(health.status).toBe("safe");
  });

  it("flags over-budget weeks before the month is blown", () => {
    const health = calculateBudgetHealth({
      monthlySalary: 6500,
      extraIncome: 0,
      monthlyBudget: 3200,
      weeklyBudget: 800,
      monthlySpend: 2100,
      weeklySpend: 940,
    });

    expect(health.status).toBe("weekly-overrun");
  });
});

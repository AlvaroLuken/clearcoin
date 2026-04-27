export type SyncedTransaction = {
  id: string;
  amount: number;
  date: string;
  category: string;
  merchantName: string;
};

export type PeriodSummary = {
  spend: number;
  income: number;
  transactionCount: number;
};

export type BudgetInput = {
  monthlySalary: number;
  extraIncome: number;
  monthlyBudget: number;
  weeklyBudget: number;
  monthlySpend: number;
  weeklySpend: number;
};

export type BudgetHealth = {
  monthlyRemaining: number;
  weeklyRemaining: number;
  savingsPotential: number;
  burnRate: number;
  status: "safe" | "weekly-overrun" | "monthly-overrun";
};

const money = (value: number) => Math.round(value * 100) / 100;

const getWeekKey = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const addToPeriod = (summary: Record<string, PeriodSummary>, key: string, transaction: SyncedTransaction) => {
  const current = summary[key] ?? { spend: 0, income: 0, transactionCount: 0 };
  const isIncome = transaction.amount < 0;

  summary[key] = {
    spend: money(current.spend + (isIncome ? 0 : transaction.amount)),
    income: money(current.income + (isIncome ? Math.abs(transaction.amount) : 0)),
    transactionCount: current.transactionCount + 1,
  };
};

export function summarizeTransactions(transactions: SyncedTransaction[]) {
  const byWeek: Record<string, PeriodSummary> = {};
  const byMonth: Record<string, PeriodSummary> = {};

  for (const transaction of transactions) {
    addToPeriod(byWeek, getWeekKey(transaction.date), transaction);
    addToPeriod(byMonth, transaction.date.slice(0, 7), transaction);
  }

  return {
    spend: money(transactions.reduce((sum, transaction) => sum + (transaction.amount > 0 ? transaction.amount : 0), 0)),
    income: money(transactions.reduce((sum, transaction) => sum + (transaction.amount < 0 ? Math.abs(transaction.amount) : 0), 0)),
    byWeek,
    byMonth,
  };
}

export function calculateBudgetHealth(input: BudgetInput): BudgetHealth {
  const monthlyRemaining = money(input.monthlyBudget - input.monthlySpend);
  const weeklyRemaining = money(input.weeklyBudget - input.weeklySpend);
  const savingsPotential = money(input.monthlySalary + input.extraIncome - input.monthlyBudget);
  const burnRate = input.monthlyBudget === 0 ? 0 : money(input.monthlySpend / input.monthlyBudget);

  let status: BudgetHealth["status"] = "safe";
  if (monthlyRemaining < 0) {
    status = "monthly-overrun";
  } else if (weeklyRemaining < 0) {
    status = "weekly-overrun";
  }

  return { monthlyRemaining, weeklyRemaining, savingsPotential, burnRate, status };
}

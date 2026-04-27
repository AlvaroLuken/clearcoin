import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateBudgetHealth, summarizeTransactions, type SyncedTransaction } from "@/lib/finance/budget";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const [{ data: settings }, { data: transactions, error }] = await Promise.all([
    supabase.from("budget_settings").select("*").eq("user_id", data.user.id).maybeSingle(),
    supabase
      .from("transactions")
      .select("id, amount, transaction_date, category, merchant_name")
      .eq("user_id", data.user.id)
      .order("transaction_date", { ascending: false })
      .limit(500),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped: SyncedTransaction[] = (transactions ?? []).map((transaction) => ({
    id: transaction.id,
    amount: Number(transaction.amount),
    date: transaction.transaction_date,
    category: transaction.category ?? "Other",
    merchantName: transaction.merchant_name ?? "Unknown",
  }));

  const summary = summarizeTransactions(mapped);
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const currentWeek = Object.keys(summary.byWeek).sort().at(-1) ?? "";
  const monthlySpend = summary.byMonth[currentMonth]?.spend ?? 0;
  const weeklySpend = summary.byWeek[currentWeek]?.spend ?? 0;

  const health = calculateBudgetHealth({
    monthlySalary: Number(settings?.monthly_salary ?? 0),
    extraIncome: Number(settings?.extra_income ?? 0),
    monthlyBudget: Number(settings?.monthly_budget ?? 0),
    weeklyBudget: Number(settings?.weekly_budget ?? 0),
    monthlySpend,
    weeklySpend,
  });

  return NextResponse.json({ summary, health, settings, transactions: mapped.slice(0, 20) });
}

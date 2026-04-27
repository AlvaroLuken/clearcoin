import { redirect } from "next/navigation";
import { PlaidConnectButton } from "@/components/plaid-connect-button";
import { BudgetSettingsForm } from "@/components/budget-settings-form";
import { calculateBudgetHealth, summarizeTransactions, type SyncedTransaction } from "@/lib/finance/budget";
import { recommendProvider } from "@/lib/finance/providers";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const [{ data: settings }, { data: transactions }, { data: items }] = await Promise.all([
    supabase.from("budget_settings").select("*").eq("user_id", data.user.id).maybeSingle(),
    supabase.from("transactions").select("id, amount, transaction_date, category, merchant_name").eq("user_id", data.user.id).order("transaction_date", { ascending: false }).limit(500),
    supabase.from("connected_items").select("id, provider, institution_name, status").eq("user_id", data.user.id),
  ]);

  const mapped: SyncedTransaction[] = (transactions ?? []).map((transaction) => ({
    id: transaction.id,
    amount: Number(transaction.amount),
    date: transaction.transaction_date,
    category: transaction.category ?? "Other",
    merchantName: transaction.merchant_name ?? "Unknown",
  }));
  const summary = summarizeTransactions(mapped);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentWeek = Object.keys(summary.byWeek).sort().at(-1) ?? "";
  const monthlySpend = summary.byMonth[currentMonth]?.spend ?? 0;
  const weeklySpend = summary.byWeek[currentWeek]?.spend ?? 0;
  const health = calculateBudgetHealth({
    monthlySalary: Number(settings?.monthly_salary ?? 6500),
    extraIncome: Number(settings?.extra_income ?? 0),
    monthlyBudget: Number(settings?.monthly_budget ?? 3200),
    weeklyBudget: Number(settings?.weekly_budget ?? 800),
    monthlySpend,
    weeklySpend,
  });
  const recommendation = recommendProvider(["chase", "apple-card", "robinhood"]);

  return (
    <main className="min-h-screen bg-[#050807] px-5 py-8 text-white sm:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-200/80">Clearcoin</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight sm:text-7xl">No more living in the dark.</h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-300">API-first finance visibility for credit-card spend, weekly burn, monthly budget drift, salary, and income. Manual entry only exists as a last-resort fallback.</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-5 text-sm text-emerald-100">
            <p className="font-bold">Provider call: {recommendation.primary.name}</p>
            <p className="mt-1 text-emerald-100/80">Best MVP tradeoff for Chase/card transactions. Teller fallback; MX/Finicity/Akoya later if this becomes enterprise-grade.</p>
          </div>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Monthly spend", currency.format(monthlySpend), `${currency.format(health.monthlyRemaining)} left`],
            ["Weekly spend", currency.format(weeklySpend), `${currency.format(health.weeklyRemaining)} left`],
            ["Savings target", currency.format(health.savingsPotential), "salary + income - planned budget"],
            ["Connected APIs", String(items?.length ?? 0), health.status.replace("-", " ")],
          ].map(([label, value, detail]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-zinc-400">{label}</p>
              <p className="mt-3 text-3xl font-black">{value}</p>
              <p className="mt-2 text-sm text-zinc-400">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-6">
            <PlaidConnectButton />
            <BudgetSettingsForm settings={settings} />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Latest synced transactions</h2>
                <p className="mt-1 text-sm text-zinc-400">Pulled from connected financial APIs, not typed in by hand.</p>
              </div>
            </div>
            <div className="mt-5 divide-y divide-white/10">
              {mapped.slice(0, 12).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-semibold">{transaction.merchantName}</p>
                    <p className="text-sm text-zinc-400">{transaction.date} · {transaction.category}</p>
                  </div>
                  <p className={transaction.amount < 0 ? "text-emerald-200" : "text-white"}>{currency.format(Math.abs(transaction.amount))}</p>
                </div>
              ))}
              {mapped.length === 0 ? <p className="py-10 text-center text-zinc-400">No API transactions yet. Connect Plaid once env vars are configured.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Landmark, ListChecks, WalletCards } from "lucide-react";
import { PlaidConnectButton } from "@/components/plaid-connect-button";
import { BudgetSettingsForm } from "@/components/budget-settings-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { calculateBudgetHealth, summarizeTransactions, type SyncedTransaction } from "@/lib/finance/budget";
import { buildDashboardInsights, getBudgetTone, summarizeTopCategories } from "@/lib/finance/dashboard";
import { recommendProvider } from "@/lib/finance/providers";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 });

function ProgressBar({ value, tone }: { value: number; tone: "green" | "amber" | "red" }) {
  const width = `${Math.min(Math.max(value, 0), 1.2) * 100}%`;
  const color = tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" aria-hidden="true">
      <div className={`h-full rounded-full ${color}`} style={{ width }} />
    </div>
  );
}

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
  const monthlyBudget = Number(settings?.monthly_budget ?? 3200);
  const weeklyBudget = Number(settings?.weekly_budget ?? 800);
  const monthlySpend = summary.byMonth[currentMonth]?.spend ?? 0;
  const weeklySpend = summary.byWeek[currentWeek]?.spend ?? 0;
  const health = calculateBudgetHealth({
    monthlySalary: Number(settings?.monthly_salary ?? 6500),
    extraIncome: Number(settings?.extra_income ?? 0),
    monthlyBudget,
    weeklyBudget,
    monthlySpend,
    weeklySpend,
  });
  const recommendation = recommendProvider(["chase", "apple-card", "robinhood"]);
  const tone = getBudgetTone(health.status);
  const topCategories = summarizeTopCategories(mapped);
  const connectedCount = items?.length ?? 0;
  const insights = buildDashboardInsights({ connectedCount, monthlyRemaining: health.monthlyRemaining, weeklyRemaining: health.weeklyRemaining });
  const monthRatio = monthlyBudget === 0 ? 0 : monthlySpend / monthlyBudget;
  const weekRatio = weeklyBudget === 0 ? 0 : weeklySpend / weeklyBudget;
  const progressTone = health.status === "monthly-overrun" ? "red" : health.status === "weekly-overrun" ? "amber" : "green";

  return (
    <main className="min-h-[100dvh] bg-[#f7f5ee] text-slate-950 dark:bg-[#080b0a] dark:text-white">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f7f5ee]/90 backdrop-blur dark:border-white/10 dark:bg-[#080b0a]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Clearcoin</Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className={`hidden rounded-full border px-3 py-1 text-xs font-bold sm:inline-flex ${tone.badge}`}>{tone.label}</span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <section className={`rounded-[2rem] border p-6 shadow-sm ${tone.surface}`}>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Financial visibility</p>
            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="max-w-3xl text-5xl font-black leading-[0.9] tracking-tight sm:text-7xl">Know where the money is going.</h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 dark:text-slate-300">Connected accounts feed the budget. Clearcoin turns weekly burn, monthly drift, and category pressure into a readable control panel.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                <p className={`text-sm font-bold ${tone.accent}`}>{tone.label}</p>
                <p className="number-font mt-2 text-4xl font-black tracking-tight">{currency.format(health.monthlyRemaining)}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">left in monthly plan</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#9fe870] p-2 text-[#163300]"><ListChecks aria-hidden="true" className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Next actions</p>
                <h2 className="text-xl font-semibold tracking-tight">What to watch now</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {insights.map((insight) => (
                <p key={insight} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-white/[0.04] dark:text-slate-300">{insight}</p>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Monthly spend", value: currency.format(monthlySpend), detail: `${percent.format(monthRatio)} of ${currency.format(monthlyBudget)}`, icon: ArrowUpRight },
            { label: "Weekly spend", value: currency.format(weeklySpend), detail: `${percent.format(weekRatio)} of ${currency.format(weeklyBudget)}`, icon: AlertTriangle },
            { label: "Savings target", value: currency.format(health.savingsPotential), detail: "salary + income - planned budget", icon: ArrowDownRight },
            { label: "Connected APIs", value: String(connectedCount), detail: connectedCount ? "sync source active" : "connect provider next", icon: Landmark },
          ].map((metric) => (
            <section key={metric.label} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.label}</p>
                <metric.icon aria-hidden="true" className="h-5 w-5 text-slate-400" />
              </div>
              <p className="number-font mt-3 text-3xl font-black tracking-tight">{metric.value}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{metric.detail}</p>
            </section>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-slate-100 p-2 text-slate-700 dark:bg-white/10 dark:text-slate-200"><WalletCards aria-hidden="true" className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Budget burn</p>
                  <h2 className="text-xl font-semibold tracking-tight">Actual vs planned</h2>
                </div>
              </div>
              <div className="mt-5 space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm"><span>Month</span><span className="number-font font-semibold">{percent.format(monthRatio)}</span></div>
                  <ProgressBar value={monthRatio} tone={progressTone} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm"><span>Week</span><span className="number-font font-semibold">{percent.format(weekRatio)}</span></div>
                  <ProgressBar value={weekRatio} tone={health.status === "weekly-overrun" ? "amber" : progressTone} />
                </div>
              </div>
            </section>
            <PlaidConnectButton />
            <BudgetSettingsForm settings={settings} />
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Latest synced transactions</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">Reality, not guesses</h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Pulled from connected financial APIs.</p>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">{mapped.length} synced</span>
              </div>
              <div className="mt-5 divide-y divide-slate-100 dark:divide-white/10">
                {mapped.slice(0, 12).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">{transaction.merchantName}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{transaction.date} · {transaction.category}</p>
                    </div>
                    <p className={`number-font font-semibold ${transaction.amount < 0 ? "text-emerald-700 dark:text-emerald-300" : "text-slate-950 dark:text-white"}`}>{currency.format(Math.abs(transaction.amount))}</p>
                  </div>
                ))}
                {mapped.length === 0 ? <p className="rounded-3xl bg-slate-50 px-4 py-10 text-center text-sm leading-6 text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">No API transactions yet. Once Plaid credentials are configured, connect accounts here and this table becomes the source of truth.</p> : null}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Top categories</p>
                <div className="mt-4 space-y-3">
                  {topCategories.map((category) => (
                    <div key={category.category}>
                      <div className="flex items-center justify-between gap-4 text-sm"><span className="font-semibold">{category.category}</span><span className="number-font text-slate-500 dark:text-slate-400">{currency.format(category.spend)}</span></div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-slate-950 dark:bg-white" style={{ width: `${Math.min((category.spend / Math.max(topCategories[0]?.spend ?? 1, 1)) * 100, 100)}%` }} /></div>
                    </div>
                  ))}
                  {topCategories.length === 0 ? <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">Connect accounts to see category pressure.</p> : null}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Provider map</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">Use {recommendation.primary.name} first</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Best MVP tradeoff for Chase/card transactions. Teller fallback; MX/Finicity/Akoya later if this gets enterprise-grade.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {recommendation.fallbacks.slice(0, 4).map((provider) => (
                    <span key={provider.id} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300">{provider.name}</span>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

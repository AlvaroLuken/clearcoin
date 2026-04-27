import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Landmark, ListChecks, ReceiptText, SlidersHorizontal, WalletCards } from "lucide-react";
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
  const currentWeek = Object.keys(summary.byWeek).sort().at(-1) ?? "No synced week";
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
  const monthLabel = new Date(`${currentMonth}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const metrics = [
    { label: "Monthly spend", value: currency.format(monthlySpend), detail: `${percent.format(monthRatio)} of ${currency.format(monthlyBudget)}`, icon: ArrowUpRight },
    { label: "Weekly spend", value: currency.format(weeklySpend), detail: `${percent.format(weekRatio)} of ${currency.format(weeklyBudget)}`, icon: AlertTriangle },
    { label: "Cash left", value: currency.format(health.monthlyRemaining), detail: `${tone.label.toLowerCase()} for ${monthLabel}`, icon: ArrowDownRight },
    { label: "Connected APIs", value: String(connectedCount), detail: connectedCount ? "sync source active" : "connect provider next", icon: Landmark },
  ];

  return (
    <main className="min-h-[100dvh] bg-[#f7f5ee] text-slate-950 dark:bg-[#080b0a] dark:text-white">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f7f5ee]/90 backdrop-blur dark:border-white/10 dark:bg-[#080b0a]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-5">
            <Link href="/" className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Clearcoin</Link>
            <nav className="hidden items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400 md:flex" aria-label="Dashboard sections">
              <a className="rounded-full bg-slate-950 px-3 py-1.5 text-white dark:bg-white dark:text-slate-950" href="#overview">Overview</a>
              <a className="rounded-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/10" href="#transactions">Transactions</a>
              <a className="rounded-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/10" href="#settings">Settings</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className={`hidden rounded-full border px-3 py-1 text-xs font-bold sm:inline-flex ${tone.badge}`}>{tone.label}</span>
          </div>
        </div>
      </header>

      <section id="overview" className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{monthLabel} · {currentWeek}</p>
            <h1 className="mt-2 text-4xl font-black leading-none tracking-tight sm:text-5xl">Overview</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Budget, card spend, account sync, and category pressure in one view.</p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[520px]">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Monthly budget</p>
              <p className="number-font mt-1 font-semibold">{currency.format(monthlyBudget)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Weekly budget</p>
              <p className="number-font mt-1 font-semibold">{currency.format(weeklyBudget)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Transactions</p>
              <p className="number-font mt-1 font-semibold">{mapped.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <section key={metric.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{metric.label}</p>
                <metric.icon aria-hidden="true" className="h-4 w-4 text-slate-400" />
              </div>
              <p className="number-font mt-3 text-3xl font-black tracking-tight">{metric.value}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{metric.detail}</p>
            </section>
          ))}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <section id="transactions" className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ReceiptText aria-hidden="true" className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  <h2 className="text-xl font-semibold tracking-tight">Recent transactions</h2>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Newest synced spend and income rows.</p>
              </div>
              <span className="w-fit rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">{mapped.length} synced</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-bold">Merchant</th>
                    <th className="px-5 py-3 font-bold">Category</th>
                    <th className="px-5 py-3 font-bold">Date</th>
                    <th className="px-5 py-3 text-right font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {mapped.slice(0, 8).map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-5 py-4 font-semibold text-slate-950 dark:text-white">{transaction.merchantName}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{transaction.category}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{transaction.date}</td>
                      <td className={`number-font px-5 py-4 text-right font-semibold ${transaction.amount < 0 ? "text-emerald-700 dark:text-emerald-300" : "text-slate-950 dark:text-white"}`}>{currency.format(Math.abs(transaction.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mapped.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="font-semibold text-slate-950 dark:text-white">No synced transactions yet.</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">Add Plaid credentials, connect Chase or card accounts, then sync transactions into this table.</p>
                </div>
              ) : null}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#9fe870] p-2 text-[#163300]"><ListChecks aria-hidden="true" className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Next actions</p>
                  <h2 className="text-lg font-semibold tracking-tight">Open items</h2>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {insights.map((insight) => (
                  <p key={insight} className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:bg-white/[0.04] dark:text-slate-300">{insight}</p>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-slate-100 p-2 text-slate-700 dark:bg-white/10 dark:text-slate-200"><WalletCards aria-hidden="true" className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Budget burn</p>
                  <h2 className="text-lg font-semibold tracking-tight">Actual vs planned</h2>
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
          </aside>
        </div>

        <div id="settings" className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <PlaidConnectButton />
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <SlidersHorizontal aria-hidden="true" className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Connector coverage</p>
                  <h2 className="text-lg font-semibold tracking-tight">{recommendation.primary.name} first</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Chase/card transaction sync is the first target. Apple Card and brokerage data stay tracked as coverage gaps until a reliable provider path is confirmed.</p>
              <div className="mt-4 divide-y divide-slate-100 dark:divide-white/10">
                {(items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold">{item.institution_name ?? item.provider}</p>
                      <p className="text-slate-500 dark:text-slate-400">{item.provider}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">{item.status}</span>
                  </div>
                ))}
                {connectedCount === 0 ? <p className="py-3 text-sm leading-6 text-slate-500 dark:text-slate-400">No connected items yet.</p> : null}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Top categories</p>
              <div className="mt-4 space-y-3">
                {topCategories.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center justify-between gap-4 text-sm"><span className="font-semibold">{category.category}</span><span className="number-font text-slate-500 dark:text-slate-400">{currency.format(category.spend)}</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-slate-950 dark:bg-white" style={{ width: `${Math.min((category.spend / Math.max(topCategories[0]?.spend ?? 1, 1)) * 100, 100)}%` }} /></div>
                  </div>
                ))}
                {topCategories.length === 0 ? <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">Connect accounts to see category pressure.</p> : null}
              </div>
            </section>
            <BudgetSettingsForm settings={settings} />
          </div>
        </div>
      </section>
    </main>
  );
}

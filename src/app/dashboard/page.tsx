import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  DatabaseZap,
  Landmark,
  LineChart,
  ReceiptText,
  Settings2,
  WalletCards,
} from "lucide-react";
import { PlaidConnectButton } from "@/components/plaid-connect-button";
import { BudgetSettingsForm } from "@/components/budget-settings-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { calculateBudgetHealth, summarizeTransactions, type SyncedTransaction } from "@/lib/finance/budget";
import { buildDashboardInsights, getBudgetTone, summarizeTopCategories } from "@/lib/finance/dashboard";
import { recommendProvider } from "@/lib/finance/providers";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const compactCurrency = new Intl.NumberFormat("en-US", { compactDisplay: "short", currency: "USD", notation: "compact", style: "currency" });
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 });

type Tone = "green" | "amber" | "red" | "neutral" | "purple";

function ProgressBar({ value, tone = "purple" }: { value: number; tone?: Tone }) {
  const width = `${Math.min(Math.max(value, 0), 1.08) * 100}%`;
  const color = {
    amber: "bg-[#9b6829]",
    green: "bg-[#15be53]",
    neutral: "bg-[#64748d]",
    purple: "bg-[#533afd]",
    red: "bg-[#ea2261]",
  }[tone];

  return (
    <div className="h-1.5 overflow-hidden rounded-[4px] bg-[#e5edf5] dark:bg-white/10" aria-hidden="true">
      <div className={`h-full rounded-[4px] ${color}`} style={{ width }} />
    </div>
  );
}

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  const classes = {
    amber: "border-[#f1d9b9] bg-[#fff7ea] text-[#9b6829] dark:border-[#9b6829]/40 dark:bg-[#9b6829]/12 dark:text-[#f0c98f]",
    green: "border-[#15be53]/40 bg-[#15be53]/15 text-[#108c3d] dark:border-[#15be53]/35 dark:bg-[#15be53]/12 dark:text-[#7fe4a4]",
    neutral: "border-[#e5edf5] bg-white text-[#64748d] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
    purple: "border-[#d6d9fc] bg-[#f7f7ff] text-[#533afd] dark:border-[#665efd]/35 dark:bg-[#665efd]/12 dark:text-[#b9b9f9]",
    red: "border-[#ffd7ef] bg-[#fff1f7] text-[#c5164f] dark:border-[#ea2261]/35 dark:bg-[#ea2261]/12 dark:text-[#ff8db4]",
  }[tone];

  return <span className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-medium ${classes}`}>{children}</span>;
}

function connectionTone(status?: string | null): Tone {
  const normalized = status?.toLowerCase() ?? "";
  if (["active", "connected", "healthy", "ok"].includes(normalized)) return "green";
  if (["disconnected", "error", "failed", "revoked"].includes(normalized)) return "red";
  if (["needs_update", "pending", "requires_update"].includes(normalized)) return "amber";
  return normalized ? "neutral" : "amber";
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
  const monthlySalary = Number(settings?.monthly_salary ?? 6500);
  const extraIncome = Number(settings?.extra_income ?? 0);
  const income = monthlySalary + extraIncome;
  const monthlySpend = summary.byMonth[currentMonth]?.spend ?? 0;
  const weeklySpend = summary.byWeek[currentWeek]?.spend ?? 0;
  const health = calculateBudgetHealth({
    extraIncome,
    monthlyBudget,
    monthlySalary,
    monthlySpend,
    weeklyBudget,
    weeklySpend,
  });
  const recommendation = recommendProvider(["chase", "apple-card", "robinhood"]);
  const tone = getBudgetTone(health.status);
  const topCategories = summarizeTopCategories(mapped);
  const connectedCount = (items ?? []).filter((item) => connectionTone(item.status) === "green").length;
  const insights = buildDashboardInsights({ connectedCount, monthlyRemaining: health.monthlyRemaining, weeklyRemaining: health.weeklyRemaining });
  const monthRatio = monthlyBudget === 0 ? 0 : monthlySpend / monthlyBudget;
  const weekRatio = weeklyBudget === 0 ? 0 : weeklySpend / weeklyBudget;
  const savingsRatio = income === 0 ? 0 : Math.max(health.monthlyRemaining, 0) / income;
  const budgetTone: Tone = health.status === "monthly-overrun" ? "red" : health.status === "weekly-overrun" ? "amber" : "green";
  const monthLabel = new Date(`${currentMonth}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysLeftInWeek = Math.max(1, 7 - new Date().getDay());
  const safeToSpendToday = Math.max(health.weeklyRemaining, 0) / daysLeftInWeek;
  const accountCoverage = [
    { detail: connectedCount ? "Sync source active" : "Ready for Plaid", icon: Landmark, label: "Chase", status: connectedCount ? "Connected" : "Not connected", tone: connectedCount ? "green" : "amber" },
    { detail: "Export/provider support required", icon: CreditCard, label: "Apple Card", status: "Gap", tone: "amber" },
    { detail: "Keep investments separate from spend", icon: LineChart, label: "Robinhood", status: "Later", tone: "neutral" },
  ] as const;
  const operatingRows = [
    { label: "Income", value: compactCurrency.format(income), detail: `${compactCurrency.format(monthlySalary)} salary${extraIncome ? ` + ${compactCurrency.format(extraIncome)} extra` : ""}` },
    { label: "Monthly cap", value: compactCurrency.format(monthlyBudget), detail: `${percent.format(monthRatio)} used` },
    { label: "Weekly cap", value: compactCurrency.format(weeklyBudget), detail: `${percent.format(weekRatio)} used` },
    { label: "Synced rows", value: String(mapped.length), detail: connectedCount ? `${connectedCount} source active` : "Needs API source" },
  ];
  const controlRows = [
    { label: "Spent this month", progress: monthRatio, tone: budgetTone, value: currency.format(monthlySpend), context: `${currency.format(Math.max(monthlyBudget - monthlySpend, 0))} left in ${monthLabel}` },
    { label: "Spent this week", progress: weekRatio, tone: weekRatio > 1 ? "red" : "green", value: currency.format(weeklySpend), context: `${currency.format(Math.max(health.weeklyRemaining, 0))} left for ${daysLeftInWeek} day${daysLeftInWeek === 1 ? "" : "s"}` },
    { label: "Cash left", progress: savingsRatio, tone: health.monthlyRemaining < 0 ? "red" : "purple", value: currency.format(health.monthlyRemaining), context: `${percent.format(savingsRatio)} of income still free` },
  ] as const;

  return (
    <main className="min-h-[100dvh] bg-[#f6f9fc] text-[#061b31] dark:bg-[#0d253d] dark:text-white">
      <header className="sticky top-0 z-20 border-b border-[#e5edf5]/90 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d253d]/86">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/" className="text-base font-medium tracking-[-0.01em] text-[#061b31] dark:text-white">Clearcoin</Link>
            <nav className="hidden items-center gap-5 text-sm text-[#64748d] md:flex" aria-label="Dashboard sections">
              <a className="font-medium text-[#533afd]" href="#overview">Overview</a>
              <a className="transition hover:text-[#061b31] dark:hover:text-white" href="#activity">Activity</a>
              <a className="transition hover:text-[#061b31] dark:hover:text-white" href="#settings">Settings</a>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <StatusPill tone={budgetTone}>{tone.label}</StatusPill>
          </div>
        </div>
      </header>

      <section id="overview" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <p className="text-sm font-medium text-[#533afd]">{monthLabel}</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-light leading-[1.05] tracking-[-0.045em] text-[#061b31] dark:text-white sm:text-5xl">Financial control room</h1>
            <p className="mt-3 max-w-2xl text-lg font-light leading-7 text-[#64748d] dark:text-slate-300">Account coverage, cash left, and spending rows in one operational view.</p>
          </div>
          <section className="rounded-[6px] border border-[#e5edf5] bg-white p-4 shadow-[rgba(50,50,93,0.18)_0px_30px_45px_-30px,rgba(0,0,0,0.08)_0px_18px_36px_-18px] dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#64748d] dark:text-slate-300">Safe to spend today</p>
                <p className="number-font mt-1 text-4xl font-light tracking-[-0.04em] text-[#061b31] dark:text-white">{currency.format(safeToSpendToday)}</p>
              </div>
              <StatusPill tone={budgetTone}>{percent.format(weekRatio)} week</StatusPill>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#64748d] dark:text-slate-300">Based on the weekly guardrail and the next {daysLeftInWeek} day{daysLeftInWeek === 1 ? "" : "s"}.</p>
            <div className="mt-4"><ProgressBar value={weekRatio} tone={weekRatio > 1 ? "red" : "purple"} /></div>
          </section>
        </div>

        <section className="mt-5 overflow-hidden rounded-[6px] border border-[#e5edf5] bg-white shadow-[rgba(23,23,23,0.06)_0px_3px_6px] dark:border-white/10 dark:bg-white/[0.04]" aria-label="Operating snapshot">
          <div className="grid divide-y divide-[#e5edf5] dark:divide-white/10 md:grid-cols-4 md:divide-x md:divide-y-0">
            {operatingRows.map((item) => (
              <div key={item.label} className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#64748d] dark:text-slate-400">{item.label}</p>
                <p className="number-font mt-2 text-2xl font-light tracking-[-0.03em] text-[#061b31] dark:text-white">{item.value}</p>
                <p className="mt-1 text-sm text-[#64748d] dark:text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_390px]">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-[6px] border border-[#e5edf5] bg-white dark:border-white/10 dark:bg-white/[0.04]">
              <div className="border-b border-[#e5edf5] px-4 py-3 dark:border-white/10 sm:px-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-medium tracking-[-0.01em] text-[#061b31] dark:text-white">Budget controls</h2>
                    <p className="mt-1 text-sm text-[#64748d] dark:text-slate-300">A row for each number that should drive decisions.</p>
                  </div>
                  <WalletCards aria-hidden="true" className="h-5 w-5 text-[#533afd]" />
                </div>
              </div>
              <div className="divide-y divide-[#e5edf5] dark:divide-white/10">
                {controlRows.map((row) => (
                  <div key={row.label} className="grid gap-3 px-4 py-4 sm:grid-cols-[180px_1fr_150px] sm:items-center sm:px-5">
                    <div>
                      <p className="font-medium text-[#273951] dark:text-slate-100">{row.label}</p>
                      <p className="mt-1 text-sm text-[#64748d] dark:text-slate-400">{row.context}</p>
                    </div>
                    <ProgressBar value={row.progress} tone={row.tone} />
                    <p className="number-font text-left text-xl font-light tracking-[-0.02em] text-[#061b31] dark:text-white sm:text-right">{row.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="activity" className="overflow-hidden rounded-[6px] border border-[#e5edf5] bg-white dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex flex-col gap-3 border-b border-[#e5edf5] px-4 py-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <div className="flex items-center gap-2">
                    <ReceiptText aria-hidden="true" className="h-4 w-4 text-[#64748d]" />
                    <h2 className="text-lg font-medium tracking-[-0.01em] text-[#061b31] dark:text-white">Transaction rows</h2>
                  </div>
                  <p className="mt-1 text-sm text-[#64748d] dark:text-slate-300">Every synced charge, credit, and income row.</p>
                </div>
                <StatusPill tone={connectedCount ? "green" : "amber"}>{connectedCount ? `${connectedCount} API source` : "Needs connection"}</StatusPill>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <caption className="sr-only">Recent synced transactions with merchant, category, date, and amount</caption>
                  <thead className="border-b border-[#e5edf5] text-xs uppercase tracking-[0.14em] text-[#64748d] dark:border-white/10 dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-medium">Merchant</th>
                      <th className="px-5 py-3 font-medium">Category</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5edf5] dark:divide-white/10">
                    {mapped.slice(0, 10).map((transaction) => (
                      <tr key={transaction.id} className="transition hover:bg-[#f6f9fc] dark:hover:bg-white/[0.03]">
                        <td className="px-5 py-3.5 font-medium text-[#061b31] dark:text-white">{transaction.merchantName}</td>
                        <td className="px-5 py-3.5 text-[#64748d] dark:text-slate-300">{transaction.category}</td>
                        <td className="number-font px-5 py-3.5 text-[#64748d] dark:text-slate-400">{transaction.date}</td>
                        <td className={`number-font px-5 py-3.5 text-right font-medium ${transaction.amount < 0 ? "text-[#108c3d] dark:text-[#7fe4a4]" : "text-[#061b31] dark:text-white"}`}>{transaction.amount < 0 ? "+" : "-"}{currency.format(Math.abs(transaction.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mapped.length === 0 ? (
                  <div className="px-5 py-8">
                    <div className="rounded-[6px] border border-dashed border-[#b9b9f9] bg-[#f7f7ff] p-5 text-center dark:bg-[#665efd]/10">
                      <p className="font-medium text-[#061b31] dark:text-white">No transactions synced yet.</p>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748d] dark:text-slate-300">Connect Chase first. Apple Card and Robinhood stay visible as coverage gaps until their data is reliable.</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="overflow-hidden rounded-[6px] border border-[#e5edf5] bg-white dark:border-white/10 dark:bg-white/[0.04]">
              <div className="border-b border-[#e5edf5] px-4 py-3 dark:border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-medium tracking-[-0.01em] text-[#061b31] dark:text-white">Needs attention</h2>
                  <AlertCircle aria-hidden="true" className="h-4 w-4 text-[#9b6829]" />
                </div>
              </div>
              <div className="divide-y divide-[#e5edf5] dark:divide-white/10">
                {insights.map((insight) => (
                  <p key={insight} className="px-4 py-3 text-sm leading-6 text-[#273951] dark:text-slate-200">{insight}</p>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-[6px] border border-[#e5edf5] bg-white dark:border-white/10 dark:bg-white/[0.04]">
              <div className="border-b border-[#e5edf5] px-4 py-3 dark:border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-medium tracking-[-0.01em] text-[#061b31] dark:text-white">Account coverage</h2>
                  <DatabaseZap aria-hidden="true" className="h-4 w-4 text-[#533afd]" />
                </div>
              </div>
              <div className="divide-y divide-[#e5edf5] dark:divide-white/10">
                {accountCoverage.map((account) => (
                  <div key={account.label} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <account.icon aria-hidden="true" className="h-4 w-4 shrink-0 text-[#64748d]" />
                      <div className="min-w-0">
                        <p className="font-medium text-[#273951] dark:text-slate-100">{account.label}</p>
                        <p className="truncate text-sm text-[#64748d] dark:text-slate-400">{account.detail}</p>
                      </div>
                    </div>
                    <StatusPill tone={account.tone}>{account.status}</StatusPill>
                  </div>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-[6px] border border-[#e5edf5] bg-white dark:border-white/10 dark:bg-white/[0.04]">
              <div className="border-b border-[#e5edf5] px-4 py-3 dark:border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-medium tracking-[-0.01em] text-[#061b31] dark:text-white">Category leakage</h2>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#64748d]" />
                </div>
              </div>
              <div className="divide-y divide-[#e5edf5] dark:divide-white/10">
                {topCategories.map((category, index) => (
                  <div key={category.category} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-[#273951] dark:text-slate-100">{index + 1}. {category.category}</span>
                      <span className="number-font text-[#061b31] dark:text-white">{currency.format(category.spend)}</span>
                    </div>
                    <div className="mt-2"><ProgressBar value={category.spend / Math.max(topCategories[0]?.spend ?? 1, 1)} tone={index === 0 ? "purple" : "neutral"} /></div>
                  </div>
                ))}
                {topCategories.length === 0 ? <p className="px-4 py-5 text-sm leading-6 text-[#64748d] dark:text-slate-300">Once transactions sync, this becomes a ranked burn list.</p> : null}
              </div>
            </section>
          </aside>
        </div>

        <div id="settings" className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <PlaidConnectButton />
            <section className="overflow-hidden rounded-[6px] border border-[#e5edf5] bg-white dark:border-white/10 dark:bg-white/[0.04]">
              <div className="border-b border-[#e5edf5] px-4 py-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Settings2 aria-hidden="true" className="h-4 w-4 text-[#64748d]" />
                  <h2 className="text-lg font-medium tracking-[-0.01em] text-[#061b31] dark:text-white">Provider strategy</h2>
                </div>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm leading-6 text-[#64748d] dark:text-slate-300">Use {recommendation.primary.name} for reliable bank and card rows first. Keep Apple Card and Robinhood explicit as coverage gaps.</p>
                <div className="mt-3 divide-y divide-[#e5edf5] dark:divide-white/10">
                  {(items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-[#273951] dark:text-slate-100">{item.institution_name ?? item.provider}</p>
                        <p className="text-[#64748d] dark:text-slate-400">{item.provider}</p>
                      </div>
                      <StatusPill tone={connectionTone(item.status)}>{item.status}</StatusPill>
                    </div>
                  ))}
                  {connectedCount === 0 ? <p className="py-3 text-sm leading-6 text-[#64748d] dark:text-slate-400">No connected items yet.</p> : null}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <BudgetSettingsForm settings={settings} />
            <section className="overflow-hidden rounded-[6px] border border-[#e5edf5] bg-white dark:border-white/10 dark:bg-white/[0.04]">
              <div className="border-b border-[#e5edf5] px-4 py-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[#15be53]" />
                  <h2 className="text-lg font-medium tracking-[-0.01em] text-[#061b31] dark:text-white">Completion checklist</h2>
                </div>
              </div>
              <div className="divide-y divide-[#e5edf5] dark:divide-white/10">
                {["Chase checking and credit cards syncing", "Apple Card gap clearly marked", "Robinhood tracked separately from spend", "Weekly budget visible before every purchase"].map((item) => (
                  <p key={item} className="px-4 py-3 text-sm text-[#273951] dark:text-slate-200">{item}</p>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

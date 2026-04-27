import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  DatabaseZap,
  Landmark,
  LineChart,
  ReceiptText,
  SlidersHorizontal,
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

function ProgressBar({ value, tone = "slate" }: { value: number; tone?: "green" | "amber" | "red" | "blue" | "slate" }) {
  const width = `${Math.min(Math.max(value, 0), 1.08) * 100}%`;
  const color = {
    amber: "bg-amber-500",
    blue: "bg-blue-600",
    green: "bg-emerald-500",
    red: "bg-red-500",
    slate: "bg-slate-950 dark:bg-white",
  }[tone];

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" aria-hidden="true">
      <div className={`h-full rounded-full ${color}`} style={{ width }} />
    </div>
  );
}

function MiniTrend({ value, tone }: { value: number; tone: "green" | "amber" | "red" }) {
  const segments = Array.from({ length: 18 }, (_, index) => index);
  const active = Math.round(Math.min(Math.max(value, 0), 1) * segments.length);
  const color = tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="flex h-12 items-end gap-1" aria-hidden="true">
      {segments.map((segment) => (
        <span
          key={segment}
          className={`w-full rounded-t-sm ${segment < active ? color : "bg-slate-100 dark:bg-white/10"}`}
          style={{ height: `${24 + ((segment * 17) % 28)}px` }}
        />
      ))}
    </div>
  );
}

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "green" | "amber" | "red" | "neutral" | "blue" }) {
  const classes = {
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200",
    blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200",
    neutral: "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
    red: "border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200",
  }[tone];
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classes}`}>{children}</span>;
}

function connectionTone(status?: string | null): "green" | "amber" | "red" | "neutral" {
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
  const budgetTone = health.status === "monthly-overrun" ? "red" : health.status === "weekly-overrun" ? "amber" : "green";
  const monthLabel = new Date(`${currentMonth}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysLeftInWeek = Math.max(1, 7 - new Date().getDay());
  const safeToSpendToday = Math.max(health.weeklyRemaining, 0) / daysLeftInWeek;
  const accountCoverage = [
    { detail: connectedCount ? "Sync source active" : "Ready for Plaid", icon: Landmark, label: "Chase", status: connectedCount ? "Connected" : "Not connected", tone: connectedCount ? "green" : "amber" },
    { detail: "Coverage depends on export/provider support", icon: CreditCard, label: "Apple Card", status: "Gap", tone: "amber" },
    { detail: "Investing view after bank/card core", icon: LineChart, label: "Robinhood", status: "Later", tone: "neutral" },
  ] as const;
  const snapshot = [
    { detail: `${percent.format(monthRatio)} of ${currency.format(monthlyBudget)}`, icon: WalletCards, label: "Spent this month", tone: budgetTone, value: currency.format(monthlySpend) },
    { detail: `${percent.format(weekRatio)} of ${currency.format(weeklyBudget)}`, icon: CalendarDays, label: "Spent this week", tone: weekRatio > 1 ? "amber" : "green", value: currency.format(weeklySpend) },
    { detail: `${percent.format(savingsRatio)} of income still free`, icon: CircleDollarSign, label: "Cash left", tone: health.monthlyRemaining < 0 ? "red" : "green", value: currency.format(health.monthlyRemaining) },
  ] as const;

  return (
    <main className="min-h-[100dvh] bg-[#f6f4ed] text-slate-950 dark:bg-[#0b0d0c] dark:text-white">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f6f4ed]/90 backdrop-blur dark:border-white/10 dark:bg-[#0b0d0c]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-5">
            <Link href="/" className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Clearcoin</Link>
            <nav className="hidden items-center gap-1 text-sm font-semibold text-slate-500 dark:text-slate-400 md:flex" aria-label="Dashboard sections">
              <a className="rounded-full bg-slate-950 px-3 py-1.5 text-white dark:bg-white dark:text-slate-950" href="#money">Money</a>
              <a className="rounded-full px-3 py-1.5 hover:bg-white dark:hover:bg-white/10" href="#transactions">Activity</a>
              <a className="rounded-full px-3 py-1.5 hover:bg-white dark:hover:bg-white/10" href="#settings">Settings</a>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <StatusPill tone={budgetTone}>{tone.label}</StatusPill>
          </div>
        </div>
      </header>

      <section id="money" className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{monthLabel} · personal finance cockpit</p>
            <h1 className="mt-2 text-3xl font-black leading-none tracking-tight sm:text-5xl">Money right now</h1>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:min-w-[560px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Income</p>
              <p className="number-font mt-1 font-black">{compactCurrency.format(income)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Monthly cap</p>
              <p className="number-font mt-1 font-black">{compactCurrency.format(monthlyBudget)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Weekly cap</p>
              <p className="number-font mt-1 font-black">{compactCurrency.format(weeklyBudget)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Synced</p>
              <p className="number-font mt-1 font-black">{mapped.length}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.06fr_0.94fr]">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="bg-slate-950 p-6 text-white dark:bg-white dark:text-slate-950 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-300 dark:text-slate-600">Safe to spend today</p>
                    <p className="number-font mt-2 text-5xl font-black tracking-tight sm:text-6xl">{currency.format(safeToSpendToday)}</p>
                  </div>
                  <span className="rounded-full bg-[#9fe870] p-2 text-[#163300]"><BadgeCheck aria-hidden="true" className="h-5 w-5" /></span>
                </div>
                <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300 dark:text-slate-600">Based on what is left for the next {daysLeftInWeek} day{daysLeftInWeek === 1 ? "" : "s"} of this week. This is the number I would check before spending.</p>
                <div className="mt-7 rounded-[1.5rem] bg-white/10 p-4 dark:bg-slate-950/5">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-slate-300 dark:text-slate-600">Weekly burn</span>
                    <span className="number-font font-bold">{percent.format(weekRatio)}</span>
                  </div>
                  <ProgressBar value={weekRatio} tone={weekRatio > 1 ? "red" : "green"} />
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {snapshot.map((item) => (
                    <section key={item.label} className="rounded-[1.5rem] border border-slate-100 bg-[#fbfaf6] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{item.label}</p>
                          <p className="number-font mt-2 text-2xl font-black tracking-tight">{item.value}</p>
                        </div>
                        <item.icon aria-hidden="true" className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.detail}</p>
                      <div className="mt-4"><ProgressBar value={item.label === "Spent this week" ? weekRatio : item.label === "Cash left" ? savingsRatio : monthRatio} tone={item.tone} /></div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Attention</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">What needs action</h2>
                </div>
                <AlertTriangle aria-hidden="true" className="h-5 w-5 text-amber-500" />
              </div>
              <div className="mt-4 space-y-2">
                {insights.map((insight) => (
                  <p key={insight} className="rounded-2xl bg-[#fbfaf6] p-3 text-sm leading-6 text-slate-700 dark:bg-white/[0.04] dark:text-slate-300">{insight}</p>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">API coverage</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">Accounts to connect</h2>
                </div>
                <DatabaseZap aria-hidden="true" className="h-5 w-5 text-blue-600" />
              </div>
              <div className="mt-4 divide-y divide-slate-100 dark:divide-white/10">
                {accountCoverage.map((account) => (
                  <div key={account.label} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-slate-100 p-2 text-slate-700 dark:bg-white/10 dark:text-slate-200"><account.icon aria-hidden="true" className="h-4 w-4" /></span>
                      <div>
                        <p className="font-semibold">{account.label}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{account.detail}</p>
                      </div>
                    </div>
                    <StatusPill tone={account.tone}>{account.status}</StatusPill>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section id="transactions" className="rounded-[2rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ReceiptText aria-hidden="true" className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  <h2 className="text-xl font-black tracking-tight">Activity feed</h2>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Every synced charge, credit, and income row. No mystery statement math.</p>
              </div>
              <StatusPill tone={connectedCount ? "green" : "amber"}>{connectedCount ? `${connectedCount} API source` : "Needs connection"}</StatusPill>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">Recent synced transactions with merchant, category, date, and amount</caption>
                <thead className="border-b border-slate-100 text-xs uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-bold">Merchant</th>
                    <th className="px-5 py-3 font-bold">Category</th>
                    <th className="px-5 py-3 font-bold">Date</th>
                    <th className="px-5 py-3 text-right font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {mapped.slice(0, 9).map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-[#fbfaf6] dark:hover:bg-white/[0.03]">
                      <td className="px-5 py-4 font-semibold text-slate-950 dark:text-white">{transaction.merchantName}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{transaction.category}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{transaction.date}</td>
                      <td className={`number-font px-5 py-4 text-right font-black ${transaction.amount < 0 ? "text-emerald-700 dark:text-emerald-300" : "text-slate-950 dark:text-white"}`}>{transaction.amount < 0 ? "+" : "-"}{currency.format(Math.abs(transaction.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mapped.length === 0 ? (
                <div className="px-5 py-10">
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-[#fbfaf6] p-5 text-center dark:border-white/15 dark:bg-white/[0.03]">
                    <p className="font-black text-slate-950 dark:text-white">No transactions synced yet.</p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">Connect Chase first. Keep Apple Card and Robinhood visible as coverage gaps instead of pretending the data is complete.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Categories</p>
                <h2 className="mt-1 text-xl font-black tracking-tight">Where spend is leaking</h2>
              </div>
              <ArrowUpRight aria-hidden="true" className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-5 space-y-4">
              {topCategories.map((category, index) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold">{index + 1}. {category.category}</span>
                    <span className="number-font font-black text-slate-700 dark:text-slate-200">{currency.format(category.spend)}</span>
                  </div>
                  <div className="mt-2"><ProgressBar value={category.spend / Math.max(topCategories[0]?.spend ?? 1, 1)} tone={index === 0 ? "blue" : "slate"} /></div>
                </div>
              ))}
              {topCategories.length === 0 ? (
                <div className="rounded-[1.5rem] bg-[#fbfaf6] p-4 dark:bg-white/[0.04]">
                  <MiniTrend value={0.45} tone="green" />
                  <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Once transactions sync, this turns into a ranked category burn list like the best card and budgeting apps.</p>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div id="settings" className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <PlaidConnectButton />
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-slate-100 p-2 text-slate-700 dark:bg-white/10 dark:text-slate-200"><SlidersHorizontal aria-hidden="true" className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Provider strategy</p>
                  <h2 className="text-lg font-black tracking-tight">{recommendation.primary.name} first</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Start with reliable card and bank transaction coverage. Apple Card and Robinhood stay explicit as data gaps until the integration path is reliable.</p>
              <div className="mt-4 divide-y divide-slate-100 dark:divide-white/10">
                {(items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold">{item.institution_name ?? item.provider}</p>
                      <p className="text-slate-500 dark:text-slate-400">{item.provider}</p>
                    </div>
                    <StatusPill tone={connectionTone(item.status)}>{item.status}</StatusPill>
                  </div>
                ))}
                {connectedCount === 0 ? <p className="py-3 text-sm leading-6 text-slate-500 dark:text-slate-400">No connected items yet.</p> : null}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <BudgetSettingsForm settings={settings} />
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#9fe870] p-2 text-[#163300]"><CheckCircle2 aria-hidden="true" className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Clarity checklist</p>
                  <h2 className="text-lg font-black tracking-tight">What complete looks like</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                {["Chase checking and credit cards syncing", "Apple Card gap clearly marked", "Robinhood tracked separately from spend", "Weekly budget visible before every purchase"].map((item) => (
                  <p key={item} className="rounded-2xl bg-[#fbfaf6] p-3 dark:bg-white/[0.04]">{item}</p>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

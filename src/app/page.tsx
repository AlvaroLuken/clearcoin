import Link from "next/link";
import { ArrowRight, BadgeCheck, LockKeyhole, WalletCards } from "lucide-react";
import { LoginButton } from "@/components/login-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { recommendProvider } from "@/lib/finance/providers";

const recommendation = recommendProvider(["chase", "apple-card", "robinhood"]);

export default function Home() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f7f5ee] text-slate-950 dark:bg-[#080b0a] dark:text-white">
      <section className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-6 py-6 sm:px-8">
        <nav className="relative z-10 flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-black tracking-tight">Clearcoin</Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard" className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10 sm:inline-flex">Dashboard</Link>
          </div>
        </nav>

        <div className="relative z-10 grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <p className="mb-6 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">Clear access to your financial data</p>
            <h1 className="max-w-4xl text-6xl font-black leading-[0.86] tracking-tight sm:text-8xl">Stop guessing where your money went.</h1>
            <p className="mt-8 max-w-2xl text-xl leading-8 text-slate-700 dark:text-slate-300">Connect financial accounts, track weekly burn against salary and income, and see the budget drift before the statement closes.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LoginButton />
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                Open dashboard <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-[1.15fr_0.9fr_1fr]">
              {[
                [BadgeCheck, "API-first, manual fallback last"],
                [LockKeyhole, "Supabase Auth + RLS baseline"],
                [WalletCards, "Built for Chase, cards, cash flow"],
              ].map(([Icon, label]) => (
                <div key={label as string} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <Icon aria-hidden="true" className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                  <span>{label as string}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white dark:bg-[#050806]">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Live budget snapshot</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["Weekly burn", "$642", "80% of plan"],
                  ["Monthly left", "$1,148", "safe this cycle"],
                  ["Dining", "$318", "+22% vs normal"],
                  ["Connected APIs", "0", "Plaid pending"],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="number-font mt-3 text-3xl font-black">{value}</p>
                    <p className="mt-2 text-sm text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Provider strategy</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Use {recommendation.primary.name} first.</h2>
              <div className="mt-4 space-y-3">
                {recommendation.notes.slice(0, 3).map((note) => (
                  <p key={note} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-white/[0.04] dark:text-slate-300">{note}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

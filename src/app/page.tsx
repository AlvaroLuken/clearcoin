import Link from "next/link";
import { ArrowRight, BadgeCheck, LockKeyhole, WalletCards } from "lucide-react";
import { LoginButton } from "@/components/login-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { recommendProvider } from "@/lib/finance/providers";

const recommendation = recommendProvider(["chase", "apple-card", "robinhood"]);

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-[#f6f9fc] text-[#061b31] dark:bg-[#0d253d] dark:text-white">
      <section className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <nav className="relative z-10 flex items-center justify-between gap-4 border-b border-[#e5edf5] pb-4 dark:border-white/10">
          <Link href="/" className="text-base font-medium tracking-[-0.01em] text-[#061b31] dark:text-white">Clearcoin</Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard" className="hidden rounded-[4px] border border-[#d6d9fc] bg-white px-4 py-2 text-sm font-medium text-[#533afd] shadow-[rgba(23,23,23,0.06)_0px_3px_6px] transition hover:bg-[#f7f7ff] focus:outline-none focus:ring-2 focus:ring-[#533afd] dark:border-[#665efd]/35 dark:bg-white/[0.04] dark:text-[#b9b9f9] dark:hover:bg-white/10 sm:inline-flex">Dashboard</Link>
          </div>
        </nav>

        <div className="relative z-10 grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.96fr_1.04fr] lg:py-8">
          <div>
            <p className="mb-4 inline-flex rounded-[4px] border border-[#d6d9fc] bg-white px-3 py-1.5 text-sm font-medium text-[#533afd] shadow-[rgba(23,23,23,0.06)_0px_3px_6px] dark:border-[#665efd]/35 dark:bg-white/[0.04] dark:text-[#b9b9f9]">Clear access to your financial data</p>
            <h1 className="max-w-3xl text-5xl font-light leading-[1.02] tracking-[-0.055em] text-[#061b31] dark:text-white sm:text-6xl xl:text-7xl">Know what is safe to spend before the statement closes.</h1>
            <p className="mt-5 max-w-2xl text-lg font-light leading-7 text-[#64748d] dark:text-slate-300">Connect accounts, track weekly burn against income, and keep missing coverage visible instead of hiding gaps in the math.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <LoginButton />
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#d6d9fc] bg-white px-5 py-3 text-sm font-medium text-[#533afd] shadow-[rgba(23,23,23,0.06)_0px_3px_6px] transition hover:bg-[#f7f7ff] focus:outline-none focus:ring-2 focus:ring-[#533afd] focus:ring-offset-2 dark:border-[#665efd]/35 dark:bg-white/[0.04] dark:text-[#b9b9f9] dark:hover:bg-white/10 dark:focus:ring-offset-[#0d253d]">
                Open dashboard <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid overflow-hidden rounded-[6px] border border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.18)_0px_30px_45px_-30px,rgba(0,0,0,0.08)_0px_18px_36px_-18px] dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-3">
              {[
                [BadgeCheck, "API-first", "Manual fallback last"],
                [LockKeyhole, "Protected", "Supabase Auth + RLS"],
                [WalletCards, "Cash-flow", "Built for cards and checking"],
              ].map(([Icon, label, detail]) => (
                <div key={label as string} className="border-b border-[#e5edf5] p-4 last:border-b-0 dark:border-white/10 sm:border-b-0 sm:border-r sm:last:border-r-0">
                  <Icon aria-hidden="true" className="h-4 w-4 text-[#533afd]" />
                  <p className="mt-3 font-medium text-[#273951] dark:text-slate-100">{label as string}</p>
                  <p className="mt-1 text-sm text-[#64748d] dark:text-slate-400">{detail as string}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[6px] border border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px] dark:border-white/10 dark:bg-white/[0.04]">
            <div className="border-b border-[#e5edf5] px-5 py-4 dark:border-white/10">
              <p className="text-sm font-medium text-[#533afd]">Live budget snapshot</p>
              <h2 className="mt-1 text-2xl font-light tracking-[-0.03em] text-[#061b31] dark:text-white">Rows over cards. Decisions over decoration.</h2>
            </div>
            <div className="divide-y divide-[#e5edf5] dark:divide-white/10">
              {[
                ["Weekly burn", "$642", "80% of plan", "#533afd"],
                ["Monthly left", "$1,148", "safe this cycle", "#15be53"],
                ["Dining", "$318", "+22% vs normal", "#ea2261"],
                ["Connected APIs", "0", "Plaid pending", "#9b6829"],
              ].map(([label, value, detail, color]) => (
                <div key={label} className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 sm:grid-cols-[180px_1fr_110px] sm:items-center">
                  <div>
                    <p className="font-medium text-[#273951] dark:text-slate-100">{label}</p>
                    <p className="mt-1 text-sm text-[#64748d] dark:text-slate-400">{detail}</p>
                  </div>
                  <div className="hidden h-1.5 overflow-hidden rounded-[4px] bg-[#e5edf5] dark:bg-white/10 sm:block">
                    <div className="h-full rounded-[4px]" style={{ width: label === "Monthly left" ? "42%" : label === "Connected APIs" ? "8%" : "80%", backgroundColor: color }} />
                  </div>
                  <p className="number-font text-right text-2xl font-light tracking-[-0.03em] text-[#061b31] dark:text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[#e5edf5] bg-[#f6f9fc] px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#64748d] dark:text-slate-400">Provider strategy</p>
              <p className="mt-2 text-sm leading-6 text-[#273951] dark:text-slate-200">Use {recommendation.primary.name} first. Keep Apple Card and Robinhood visible as coverage gaps until the integration path is reliable.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

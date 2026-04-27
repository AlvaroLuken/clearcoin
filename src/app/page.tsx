import Link from "next/link";
import { LoginButton } from "@/components/login-button";
import { recommendProvider } from "@/lib/finance/providers";

const recommendation = recommendProvider(["chase", "apple-card", "robinhood"]);

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030504] text-white">
      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-8">
        <div className="absolute inset-x-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
        <nav className="relative z-10 flex items-center justify-between">
          <div className="text-lg font-black tracking-tight">Clearcoin</div>
          <Link href="/dashboard" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10">Dashboard</Link>
        </nav>

        <div className="relative z-10 grid flex-1 items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-6 inline-flex rounded-full bg-emerald-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.32em] text-emerald-200">Clear access to your financial data</p>
            <h1 className="max-w-4xl text-6xl font-black leading-[0.9] tracking-tight sm:text-8xl">No more living in the dark like they want.</h1>
            <p className="mt-8 max-w-2xl text-xl leading-8 text-zinc-300">Connect Chase, cards, and cash-flow sources through finance APIs. Track weekly and monthly budget drift against salary, extra income, recurring spend, and reality.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LoginButton />
              <Link href="/dashboard" className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-bold text-white hover:bg-white/10">Open dashboard</Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-emerald-500/10 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Provider strategy</p>
            <h2 className="mt-3 text-3xl font-black">Use {recommendation.primary.name} first.</h2>
            <div className="mt-6 space-y-4">
              {recommendation.notes.map((note) => (
                <p key={note} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-zinc-300">{note}</p>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {recommendation.fallbacks.slice(0, 4).map((provider) => (
                <div key={provider.id} className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="font-bold">{provider.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">{provider.v1Role === "fallback" ? "Fallback" : "Later"} · {provider.bestFor}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { LoginButton } from "@/components/login-button";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) redirect("/dashboard");

  return (
    <main className="min-h-[100dvh] bg-[#f7f5ee] px-6 py-6 text-slate-950 dark:bg-[#080b0a] dark:text-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link href="/" className="text-lg font-black tracking-tight">Clearcoin</Link>
        <ThemeToggle />
      </nav>
      <section className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
        <div>
          <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">Clearcoin</p>
          <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[0.9] tracking-tight sm:text-7xl">Get clear access to your money.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700 dark:text-slate-300">Sign in, connect accounts through secure finance APIs, and track weekly/monthly burn against income.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="text-2xl font-semibold tracking-tight">Continue securely</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Google handles identity. Supabase keeps financial rows private with row-level security.</p>
          <div className="mt-6"><LoginButton /></div>
        </div>
      </section>
    </main>
  );
}

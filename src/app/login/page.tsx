import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginButton } from "@/components/login-button";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <section className="mx-auto flex max-w-lg flex-col items-start gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-emerald-500/10">
        <p className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Clearcoin</p>
        <div>
          <h1 className="text-4xl font-black tracking-tight">Get clear access to your money.</h1>
          <p className="mt-4 text-zinc-300">Sign in, connect accounts through secure finance APIs, and track weekly/monthly burn against income.</p>
        </div>
        <LoginButton />
      </section>
    </main>
  );
}

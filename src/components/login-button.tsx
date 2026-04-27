"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginButton() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-full bg-[#9fe870] px-5 py-3 text-sm font-bold text-[#163300] transition hover:scale-[1.02] hover:bg-[#b7f58b] focus:outline-none focus:ring-4 focus:ring-emerald-500/30 active:scale-[0.99] disabled:scale-100 disabled:opacity-60"
    >
      {loading ? "Opening Google..." : "Sign in with Google"}
    </button>
  );
}

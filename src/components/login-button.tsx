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
      className="inline-flex items-center justify-center rounded-[4px] bg-[#533afd] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4434d4] focus:outline-none focus:ring-2 focus:ring-[#533afd] focus:ring-offset-2 active:translate-y-px disabled:translate-y-0 disabled:opacity-60 dark:focus:ring-offset-[#0d253d]"
    >
      {loading ? "Opening Google..." : "Sign in with Google"}
    </button>
  );
}

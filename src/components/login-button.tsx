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
      className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold text-black transition hover:bg-emerald-200 disabled:opacity-60"
    >
      {loading ? "Opening Google..." : "Sign in with Google"}
    </button>
  );
}

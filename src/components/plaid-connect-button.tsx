"use client";

import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

type LinkTokenResponse = { linkToken?: string; error?: string; missing?: string[] };

export function PlaidConnectButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [message, setMessage] = useState("Checking secure connector config...");
  const [isConfigMissing, setIsConfigMissing] = useState(false);

  useEffect(() => {
    fetch("/api/plaid/link-token", { method: "POST" })
      .then(async (response) => {
        const body = (await response.json()) as LinkTokenResponse;
        if (!response.ok) {
          if (body.missing?.length) setIsConfigMissing(true);
          throw new Error(body.error ?? "Could not create Plaid link token");
        }
        setLinkToken(body.linkToken ?? null);
        setMessage("Plaid is ready. Connect Chase/card accounts.");
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      setMessage("Exchanging token...");
      const response = await fetch("/api/plaid/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken }),
      });
      if (!response.ok) {
        setMessage("Connected in Plaid, but token exchange failed. Check server logs.");
        return;
      }
      setMessage("Connected. Syncing transactions...");
      await fetch("/api/plaid/sync", { method: "POST" });
      setMessage("Synced. Refreshing dashboard...");
      window.location.reload();
    },
  });

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Primary connector</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Connect financial APIs</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> API-first
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>
      {isConfigMissing ? (
        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
          Setup state: Plaid credentials are not on Vercel yet. Users should not see this once provider env vars are added.
        </p>
      ) : null}
      <button
        type="button"
        disabled={!ready}
        onClick={() => open()}
        className="mt-5 w-full rounded-full bg-[#9fe870] px-5 py-3 text-sm font-bold text-[#163300] transition hover:scale-[1.01] hover:bg-[#b7f58b] focus:outline-none focus:ring-4 focus:ring-emerald-500/30 active:scale-[0.99] disabled:scale-100 disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-white/10 dark:disabled:text-slate-400"
      >
        Connect bank/card accounts
      </button>
    </section>
  );
}

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
    <section className="overflow-hidden rounded-[6px] border border-[#e5edf5] bg-white dark:border-white/10 dark:bg-white/[0.04]">
      <div className="border-b border-[#e5edf5] px-4 py-3 dark:border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#64748d] dark:text-slate-400">Primary connector</p>
            <h2 className="mt-1 text-lg font-medium tracking-[-0.01em] text-[#061b31] dark:text-white">Connect financial APIs</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#15be53]/40 bg-[#15be53]/15 px-2 py-0.5 text-xs font-medium text-[#108c3d] dark:bg-[#15be53]/12 dark:text-[#7fe4a4]">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> API-first
          </span>
        </div>
      </div>
      <div className="px-4 py-4">
        <p className="text-sm leading-6 text-[#64748d] dark:text-slate-300">{message}</p>
        {isConfigMissing ? (
          <p className="mt-3 rounded-[4px] border border-[#f1d9b9] bg-[#fff7ea] p-3 text-sm text-[#9b6829] dark:border-[#9b6829]/40 dark:bg-[#9b6829]/12 dark:text-[#f0c98f]">
            Setup state: Plaid credentials are not on Vercel yet. Users should not see this once provider env vars are added.
          </p>
        ) : null}
        <button
          type="button"
          disabled={!ready}
          onClick={() => open()}
          className="mt-4 inline-flex w-full items-center justify-center rounded-[4px] bg-[#533afd] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#4434d4] focus:outline-none focus:ring-2 focus:ring-[#533afd] focus:ring-offset-2 active:translate-y-px disabled:translate-y-0 disabled:bg-[#e5edf5] disabled:text-[#64748d] dark:focus:ring-offset-[#0d253d] dark:disabled:bg-white/10 dark:disabled:text-slate-400 sm:w-auto"
        >
          Connect bank/card accounts
        </button>
      </div>
    </section>
  );
}

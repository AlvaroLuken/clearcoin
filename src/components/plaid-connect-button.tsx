"use client";

import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

type LinkTokenResponse = { linkToken?: string; error?: string; missing?: string[] };

export function PlaidConnectButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [message, setMessage] = useState("Checking provider config...");

  useEffect(() => {
    fetch("/api/plaid/link-token", { method: "POST" })
      .then(async (response) => {
        const body = (await response.json()) as LinkTokenResponse;
        if (!response.ok) throw new Error(body.error ?? "Could not create Plaid link token");
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
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">Primary connector</p>
          <h2 className="text-2xl font-semibold text-white">Plaid Link</h2>
        </div>
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">API-first</span>
      </div>
      <p className="mb-4 text-sm text-zinc-300">{message}</p>
      <button
        type="button"
        disabled={!ready}
        onClick={() => open()}
        className="w-full rounded-2xl bg-emerald-300 px-5 py-3 font-bold text-black transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Connect bank/card accounts
      </button>
    </div>
  );
}

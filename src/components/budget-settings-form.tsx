"use client";

import { useState } from "react";

type Settings = {
  monthly_salary?: number;
  extra_income?: number;
  monthly_budget?: number;
  weekly_budget?: number;
} | null;

export function BudgetSettingsForm({ settings }: { settings: Settings }) {
  const [state, setState] = useState({
    monthlySalary: String(settings?.monthly_salary ?? 6500),
    extraIncome: String(settings?.extra_income ?? 0),
    monthlyBudget: String(settings?.monthly_budget ?? 3200),
    weeklyBudget: String(settings?.weekly_budget ?? 800),
  });
  const [message, setMessage] = useState("Set salary/income and budgets. Spend comes from APIs.");

  async function save() {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    setMessage(response.ok ? "Saved. Refreshing dashboard..." : "Save failed.");
    if (response.ok) window.location.reload();
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-2xl font-semibold text-white">Budget engine</h2>
      <p className="mt-2 text-sm text-zinc-300">{message}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ["monthlySalary", "Monthly salary"],
          ["extraIncome", "Extra income"],
          ["monthlyBudget", "Monthly budget"],
          ["weeklyBudget", "Weekly budget"],
        ].map(([key, label]) => (
          <label key={key} className="text-sm text-zinc-300">
            {label}
            <input
              inputMode="decimal"
              value={state[key as keyof typeof state]}
              onChange={(event) => setState((current) => ({ ...current, [key]: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none ring-emerald-300/40 focus:ring-4"
            />
          </label>
        ))}
      </div>
      <button onClick={save} type="button" className="mt-4 w-full rounded-2xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200">
        Save budget model
      </button>
    </div>
  );
}

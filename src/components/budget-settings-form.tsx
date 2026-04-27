"use client";

import { useState } from "react";

type Settings = {
  monthly_salary?: number;
  extra_income?: number;
  monthly_budget?: number;
  weekly_budget?: number;
} | null;

const fields = [
  ["monthlySalary", "Monthly salary", "Recurring paycheck after taxes"],
  ["extraIncome", "Extra income", "Freelance, reimbursements, side income"],
  ["monthlyBudget", "Monthly budget", "Planned spend ceiling"],
  ["weeklyBudget", "Weekly budget", "Burn-rate guardrail"],
] as const;

export function BudgetSettingsForm({ settings }: { settings: Settings }) {
  const [state, setState] = useState({
    monthlySalary: String(settings?.monthly_salary ?? 6500),
    extraIncome: String(settings?.extra_income ?? 0),
    monthlyBudget: String(settings?.monthly_budget ?? 3200),
    weeklyBudget: String(settings?.weekly_budget ?? 800),
  });
  const [message, setMessage] = useState("Spend syncs from APIs. This model defines the rails.");

  async function save() {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    setMessage(response.ok ? "Saved. Refreshing dashboard..." : "Save failed. Check the values and try again.");
    if (response.ok) window.location.reload();
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Budget model</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Set the guardrails</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {fields.map(([key, label, hint]) => (
          <label key={key} className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {label}
            <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">{hint}</span>
            <input
              inputMode="decimal"
              value={state[key]}
              onChange={(event) => setState((current) => ({ ...current, [key]: event.target.value }))}
              className="number-font mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:focus:border-emerald-300 dark:focus:ring-emerald-300/20"
            />
          </label>
        ))}
      </div>
      <button onClick={save} type="button" className="mt-5 w-full rounded-full bg-[#9fe870] px-5 py-3 text-sm font-bold text-[#163300] transition hover:scale-[1.01] hover:bg-[#b7f58b] focus:outline-none focus:ring-4 focus:ring-emerald-500/30 active:scale-[0.99]">
        Save budget model
      </button>
    </section>
  );
}

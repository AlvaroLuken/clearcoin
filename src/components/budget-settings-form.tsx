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
    <section className="overflow-hidden rounded-[6px] border border-[#e5edf5] bg-white dark:border-white/10 dark:bg-white/[0.04]">
      <div className="border-b border-[#e5edf5] px-4 py-3 dark:border-white/10">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#64748d] dark:text-slate-400">Budget model</p>
        <h2 className="mt-1 text-lg font-medium tracking-[-0.01em] text-[#061b31] dark:text-white">Set the guardrails</h2>
        <p className="mt-1 text-sm leading-6 text-[#64748d] dark:text-slate-300">{message}</p>
      </div>
      <div className="divide-y divide-[#e5edf5] dark:divide-white/10">
        {fields.map(([key, label, hint]) => (
          <label key={key} className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[180px_1fr] sm:items-center">
            <span>
              <span className="block font-medium text-[#273951] dark:text-slate-100">{label}</span>
              <span className="mt-0.5 block text-xs text-[#64748d] dark:text-slate-400">{hint}</span>
            </span>
            <input
              inputMode="decimal"
              value={state[key]}
              onChange={(event) => setState((current) => ({ ...current, [key]: event.target.value }))}
              className="number-font w-full rounded-[4px] border border-[#e5edf5] bg-[#f6f9fc] px-3 py-2 text-base text-[#061b31] outline-none transition placeholder:text-[#64748d] focus:border-[#533afd] focus:ring-2 focus:ring-[#533afd]/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
          </label>
        ))}
      </div>
      <div className="border-t border-[#e5edf5] px-4 py-3 dark:border-white/10">
        <button onClick={save} type="button" className="inline-flex w-full items-center justify-center rounded-[4px] bg-[#533afd] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#4434d4] focus:outline-none focus:ring-2 focus:ring-[#533afd] focus:ring-offset-2 active:translate-y-px dark:focus:ring-offset-[#0d253d] sm:w-auto">
          Save budget model
        </button>
      </div>
    </section>
  );
}

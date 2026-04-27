"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const modes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun aria-hidden="true" className="h-3.5 w-3.5" /> },
  { value: "dark", label: "Dark", icon: <Moon aria-hidden="true" className="h-3.5 w-3.5" /> },
  { value: "system", label: "System", icon: <Monitor aria-hidden="true" className="h-3.5 w-3.5" /> },
];

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", mode === "dark" || (mode === "system" && prefersDark));
  document.documentElement.dataset.theme = mode;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem("clearcoin-theme");
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  });

  useEffect(() => {
    applyTheme(mode);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((window.localStorage.getItem("clearcoin-theme") ?? "system") === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode]);

  function select(nextMode: ThemeMode) {
    window.localStorage.setItem("clearcoin-theme", nextMode);
    setMode(nextMode);
    applyTheme(nextMode);
  }

  return (
    <fieldset className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-900" aria-label="Color theme">
      <legend className="sr-only">Color theme</legend>
      {modes.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={mode === item.value}
          onClick={() => select(item.value)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:text-slate-300 dark:hover:bg-white/10 dark:focus:ring-offset-slate-950 aria-pressed:bg-slate-950 aria-pressed:text-white dark:aria-pressed:bg-white dark:aria-pressed:text-slate-950"
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </fieldset>
  );
}

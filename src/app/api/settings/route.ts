import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  monthlySalary: z.coerce.number().min(0),
  extraIncome: z.coerce.number().min(0),
  monthlyBudget: z.coerce.number().min(0),
  weeklyBudget: z.coerce.number().min(0),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
  }

  const { error } = await supabase.from("budget_settings").upsert({
    user_id: data.user.id,
    monthly_salary: parsed.data.monthlySalary,
    extra_income: parsed.data.extraIncome,
    monthly_budget: parsed.data.monthlyBudget,
    weekly_budget: parsed.data.weeklyBudget,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { plaidClient, plaidConfigured } from "@/lib/server/plaid";
import { createClient } from "@/lib/supabase/server";

const exchangeSchema = z.object({ publicToken: z.string().min(1) });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Sign in before connecting accounts." }, { status: 401 });
  }

  if (!plaidConfigured()) {
    return NextResponse.json({ error: "Plaid env vars are not configured." }, { status: 503 });
  }

  const parsed = exchangeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid public token." }, { status: 400 });
  }

  const plaid = plaidClient();
  const exchange = await plaid.itemPublicTokenExchange({ public_token: parsed.data.publicToken });
  const item = await plaid.itemGet({ access_token: exchange.data.access_token });

  const { error } = await supabase.from("connected_items").upsert({
    user_id: data.user.id,
    provider: "plaid",
    provider_item_id: exchange.data.item_id,
    access_token: exchange.data.access_token,
    institution_name: item.data.item.institution_id ?? "Plaid item",
    status: "connected",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

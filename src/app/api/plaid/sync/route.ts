import { NextResponse } from "next/server";
import { subDays } from "date-fns";
import { plaidClient, plaidConfigured } from "@/lib/server/plaid";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Sign in before syncing." }, { status: 401 });
  }

  if (!plaidConfigured()) {
    return NextResponse.json({ error: "Plaid env vars are not configured." }, { status: 503 });
  }

  const { data: items, error: itemError } = await supabase
    .from("connected_items")
    .select("id, access_token")
    .eq("user_id", data.user.id)
    .eq("provider", "plaid");

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  const plaid = plaidClient();
  const startDate = subDays(new Date(), 120).toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);
  let imported = 0;

  for (const item of items ?? []) {
    const response = await plaid.transactionsGet({
      access_token: item.access_token,
      start_date: startDate,
      end_date: endDate,
      options: { count: 500 },
    });

    const rows = response.data.transactions.map((transaction) => ({
      user_id: data.user.id,
      connected_item_id: item.id,
      provider_transaction_id: transaction.transaction_id,
      account_id: transaction.account_id,
      amount: transaction.amount,
      iso_currency_code: transaction.iso_currency_code ?? "USD",
      merchant_name: transaction.merchant_name ?? transaction.name,
      category: transaction.personal_finance_category?.primary ?? transaction.category?.[0] ?? "Other",
      transaction_date: transaction.date,
      raw: transaction,
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from("transactions").upsert(rows, { onConflict: "provider_transaction_id" });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      imported += rows.length;
    }
  }

  return NextResponse.json({ ok: true, imported });
}

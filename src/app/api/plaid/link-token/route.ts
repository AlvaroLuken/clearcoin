import { NextResponse } from "next/server";
import { plaidClient, plaidConfigured, plaidCountries, plaidProducts } from "@/lib/server/plaid";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Sign in before connecting accounts." }, { status: 401 });
  }

  if (!plaidConfigured()) {
    return NextResponse.json(
      {
        error: "Plaid is not configured yet.",
        missing: ["PLAID_CLIENT_ID", "PLAID_SECRET", "PLAID_ENV"],
      },
      { status: 503 },
    );
  }

  const plaid = plaidClient();
  const response = await plaid.linkTokenCreate({
    user: { client_user_id: data.user.id },
    client_name: "Clearcoin",
    products: plaidProducts,
    country_codes: plaidCountries,
    language: "en",
    transactions: { days_requested: 730 },
  });

  return NextResponse.json({ linkToken: response.data.link_token });
}

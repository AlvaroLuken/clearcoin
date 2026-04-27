import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from "plaid";

const environment = process.env.PLAID_ENV ?? "sandbox";

export function plaidConfigured() {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

export function plaidClient() {
  if (!plaidConfigured()) {
    throw new Error("Plaid env vars are missing");
  }

  const configuration = new Configuration({
    basePath: PlaidEnvironments[environment as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  });

  return new PlaidApi(configuration);
}

export const plaidProducts = [Products.Transactions];
export const plaidCountries = [CountryCode.Us];

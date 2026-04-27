export type InstitutionKey = "chase" | "apple-card" | "robinhood" | "other";

export type DataProvider = {
  id: "plaid" | "teller" | "mx" | "finicity" | "akoya";
  name: string;
  bestFor: string;
  strengths: string[];
  tradeoffs: string[];
  v1Role: "primary" | "fallback" | "later";
};

export const providers: DataProvider[] = [
  {
    id: "plaid",
    name: "Plaid",
    bestFor: "Fastest consumer finance MVP with broad bank, card, balance, identity, and transaction coverage.",
    strengths: ["broad Chase support", "mature Transactions API", "Link UX users already recognize", "good sandbox and developer velocity"],
    tradeoffs: ["production access requires review", "pricing can scale with connected accounts", "Apple Card data depends on what Apple/Goldman expose through linked accounts or exports"],
    v1Role: "primary",
  },
  {
    id: "teller",
    name: "Teller",
    bestFor: "Direct bank API access with a strong developer experience when institution coverage matches the user.",
    strengths: ["clean API", "good for account and transaction pulls", "often simpler than enterprise aggregators"],
    tradeoffs: ["institution coverage is narrower than Plaid", "Apple Card coverage is not a safe assumption", "may need fallback aggregation"],
    v1Role: "fallback",
  },
  {
    id: "mx",
    name: "MX",
    bestFor: "Enterprise-grade aggregation, cleansing, and enrichment.",
    strengths: ["strong data enhancement", "broad aggregation relationships", "good fit if this becomes a serious financial-data product"],
    tradeoffs: ["sales-led onboarding", "less ideal for a fast solo MVP", "pricing/contracting overhead"],
    v1Role: "later",
  },
  {
    id: "finicity",
    name: "Mastercard Open Banking / Finicity",
    bestFor: "Enterprise open-banking connectivity and verification flows.",
    strengths: ["Mastercard backing", "robust financial data network", "good for lending/verification use cases"],
    tradeoffs: ["enterprise onboarding", "overkill for v1 personal budgeting", "contracts before velocity"],
    v1Role: "later",
  },
  {
    id: "akoya",
    name: "Akoya",
    bestFor: "Tokenized, API-based data sharing from participating financial institutions.",
    strengths: ["bank-grade permissioned data sharing", "good security model", "aligned with open-finance direction"],
    tradeoffs: ["coverage and onboarding constraints", "not the quickest MVP path", "usually better as a future connector"],
    v1Role: "later",
  },
];

export function recommendProvider(institutions: InstitutionKey[]) {
  const primary = providers.find((provider) => provider.id === "plaid") ?? providers[0];
  const fallbacks = providers.filter((provider) => provider.id !== primary.id);
  const notes = [
    "Use Plaid first: it is the best speed-to-working-app tradeoff for Chase/card transactions and a personal MVP.",
    "Keep Teller as the first fallback if Plaid coverage or pricing becomes annoying for the exact accounts.",
    "Apple Card remains the weird one: there is no generally open consumer Apple Card API, so the realistic paths are aggregator support where available, Apple Wallet/statement exports, or email/CSV as last resort.",
    institutions.includes("robinhood")
      ? "Robinhood brokerage data may need a separate investment-data connector later; v1 treats it as balances/cash-flow if available through the aggregation provider."
      : "Investment data can be added after cash-flow tracking works.",
  ];

  return { primary, fallbacks, notes };
}

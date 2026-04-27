# Clearcoin

API-first personal finance visibility: connect financial accounts, sync card/bank transactions, and track weekly/monthly budget drift against salary and income.

## Provider decision

V1 is **Plaid-first** because it has the best speed-to-working-app tradeoff for Chase/card transaction data, mature Link UX, and a useful sandbox. Teller is the first fallback if coverage/pricing hurts. MX, Mastercard Open Banking / Finicity, and Akoya are better later if this turns into an enterprise-grade financial-data product.

Apple Card is the hard case: there is no generally open consumer Apple Card API. Realistic paths are aggregator support when available, Apple Wallet/statement exports, or email/CSV as last resort.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth/Postgres with RLS
- Plaid Link + Transactions API
- Vercel

## Local env

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox
```

## Commands

```bash
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

## Database

Run the SQL in `supabase/migrations/0001_clearcoin.sql` against the Supabase project. RLS is enabled on all user-data tables.

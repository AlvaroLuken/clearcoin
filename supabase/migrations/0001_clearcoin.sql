create extension if not exists pgcrypto;

create table if not exists public.budget_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_salary numeric(12,2) not null default 0,
  extra_income numeric(12,2) not null default 0,
  monthly_budget numeric(12,2) not null default 0,
  weekly_budget numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connected_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('plaid', 'teller', 'mx', 'finicity', 'akoya')),
  provider_item_id text not null,
  access_token text not null,
  institution_name text,
  status text not null default 'connected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_item_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connected_item_id uuid references public.connected_items(id) on delete cascade,
  provider_transaction_id text not null unique,
  account_id text not null,
  amount numeric(12,2) not null,
  iso_currency_code text not null default 'USD',
  merchant_name text,
  category text,
  transaction_date date not null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.budget_settings enable row level security;
alter table public.connected_items enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "budget_settings own rows" on public.budget_settings;
create policy "budget_settings own rows" on public.budget_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "connected_items own rows" on public.connected_items;
create policy "connected_items own rows" on public.connected_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions own rows" on public.transactions;
create policy "transactions own rows" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists transactions_user_date_idx on public.transactions(user_id, transaction_date desc);
create index if not exists transactions_user_category_idx on public.transactions(user_id, category);

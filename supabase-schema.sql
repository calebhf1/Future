-- =====================================================
-- Hearth Budget App — Supabase Schema
-- Run this in your Supabase SQL editor
-- =====================================================

-- Budget Categories
create table if not exists budget_categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text default '📦',
  color text default '#6B5B4E',
  budget_amount numeric(10,2),
  created_at timestamptz default now()
);

-- Transactions (expenses + savings transfers)
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  amount numeric(10,2) not null,
  date date not null,
  type text check (type in ('expense', 'savings')) default 'expense',
  category_id uuid references budget_categories(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- Income (separate from transactions for clarity)
create table if not exists income (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source text not null,
  amount numeric(10,2) not null,
  month integer not null check (month between 1 and 12),
  year integer not null,
  notes text,
  created_at timestamptz default now()
);

-- Savings Goals
create table if not exists savings_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(10,2) not null,
  current_amount numeric(10,2) default 0,
  icon text default '🏠',
  notes text,
  target_date date,
  created_at timestamptz default now()
);

-- =====================================================
-- Row Level Security (RLS) — users only see their own data
-- =====================================================

alter table budget_categories enable row level security;
alter table transactions enable row level security;
alter table income enable row level security;
alter table savings_goals enable row level security;

-- Budget Categories policies
create policy "Users can manage own categories"
  on budget_categories for all
  using (auth.uid() = user_id);

-- Transactions policies
create policy "Users can manage own transactions"
  on transactions for all
  using (auth.uid() = user_id);

-- Income policies
create policy "Users can manage own income"
  on income for all
  using (auth.uid() = user_id);

-- Savings Goals policies
create policy "Users can manage own savings goals"
  on savings_goals for all
  using (auth.uid() = user_id);

-- =====================================================
-- Optional: Indexes for performance
-- =====================================================

create index if not exists transactions_user_date on transactions(user_id, date);
create index if not exists income_user_month on income(user_id, month, year);

-- HavnLine Sales Portfolio — core schema
-- Two roles enforced at the DATABASE level via RLS, not just hidden in
-- the UI, per the spec's explicit security requirement.

-- =========================================================
-- Profiles (extends auth.users with role + display info)
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'salesperson')),
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Security-definer helper: lets RLS policies check "is this user an
-- admin" without recursively re-triggering RLS on profiles itself.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can manage all profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- Businesses — the single entity that flows from raw lead all
-- the way through to a fully-completed customer. A "lead" and a
-- "customer" are the same row at different pipeline stages, per
-- the spec (Business Page and Customer Page are views of the
-- same underlying business).
-- =========================================================
create type public.pipeline_status as enum (
  'new_lead',
  'contacted',
  'interested',
  'demo',
  'trial',
  'paying_customer',
  'commission_1_pending',
  'commission_1_paid',
  'commission_2_pending',
  'commission_2_paid',
  'completed',
  'not_interested',
  'bad_fit',
  'cancelled',
  'no_response'
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  phone text,
  normalized_phone text, -- digits only, for reliable duplicate matching
  website text,
  address text,
  city text,
  state text,
  industry text,
  contact_name text,
  priority text default 'normal' check (priority in ('low', 'normal', 'high')),
  source text,
  status public.pipeline_status not null default 'new_lead',
  assigned_to uuid references public.profiles(id) on delete set null,
  call_attempts int not null default 0,
  last_contacted timestamptz,
  next_followup date,
  notes text,

  -- Customer lifecycle fields — populated once a lead converts.
  trial_start date,
  trial_end date,
  first_payment_date date,
  first_month_completed_at date,
  second_payment_date date,
  second_month_completed_at date,
  cancelled_at date,

  imported_batch text, -- e.g. "Week of Sep 7" — for weekly lead management view
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_businesses_assigned_to on public.businesses(assigned_to);
create index idx_businesses_status on public.businesses(status);
create index idx_businesses_normalized_phone on public.businesses(normalized_phone);

alter table public.businesses enable row level security;

create policy "Admins have full access to businesses"
  on public.businesses for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Salespeople can view their assigned businesses"
  on public.businesses for select
  using (assigned_to = auth.uid());

create policy "Salespeople can update their assigned businesses"
  on public.businesses for update
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

-- =========================================================
-- Activity log — every call, note, status change, and follow-up
-- scheduled against a business.
-- =========================================================
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  salesperson_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('call', 'note', 'status_change', 'followup_scheduled')),
  content text,
  created_at timestamptz not null default now()
);

create index idx_activity_log_business on public.activity_log(business_id);

alter table public.activity_log enable row level security;

create policy "Admins have full access to activity"
  on public.activity_log for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Salespeople can view activity on their businesses"
  on public.activity_log for select
  using (
    exists (select 1 from public.businesses b where b.id = business_id and b.assigned_to = auth.uid())
  );

create policy "Salespeople can log activity on their businesses"
  on public.activity_log for insert
  with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.assigned_to = auth.uid())
  );

-- =========================================================
-- Commissions — normalized so amounts/status can never be
-- edited by the salesperson themselves (enforced by RLS: read-only
-- for salespeople, full control only for admins).
-- =========================================================
create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  salesperson_id uuid not null references public.profiles(id) on delete cascade,
  commission_number int not null check (commission_number in (1, 2)),
  amount numeric(10, 2) not null default 150.00,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  eligible_date date,
  paid_date date,
  created_at timestamptz not null default now(),
  unique (business_id, commission_number)
);

create index idx_commissions_salesperson on public.commissions(salesperson_id);

alter table public.commissions enable row level security;

create policy "Admins have full access to commissions"
  on public.commissions for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Salespeople can view their own commissions"
  on public.commissions for select
  using (salesperson_id = auth.uid());

-- =========================================================
-- Keep updated_at fresh on businesses automatically.
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

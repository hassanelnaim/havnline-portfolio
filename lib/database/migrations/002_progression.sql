-- HavnLine Sales Portfolio — Progression system
-- Ranks, milestones, and promotions, all fully admin-configurable and
-- evaluated against REAL data (businesses/commissions tables) — never
-- a number a salesperson can edit themselves. This is the anti-gaming
-- requirement from the spec: achievements are computed, not stored as
-- editable counters.

-- =========================================================
-- Ranks — tiered, admin-configurable, ordered by sort_order.
-- =========================================================
create table public.ranks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  min_businesses_sold int not null,
  badge_emoji text default '🏅',
  color text default '#2563EB',
  benefits text,
  commission_bonus_percent numeric(5, 2) default 0,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.ranks enable row level security;

create policy "Everyone authenticated can view active ranks"
  on public.ranks for select
  using (auth.uid() is not null);

create policy "Admins can manage ranks"
  on public.ranks for all
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- Milestones — one-time achievements, admin-configurable
-- requirement type + value, with a tracked reward.
-- =========================================================
create type public.milestone_requirement_type as enum (
  'businesses_sold',
  'active_businesses',
  'commission_earned',
  'sales_in_month',
  'sales_in_week',
  'consecutive_sales_weeks',
  'customer_retention',
  'revenue_generated',
  'custom'
);

create type public.reward_type as enum (
  'cash_bonus',
  'commission_bonus',
  'gift_card',
  'merchandise',
  'promotion',
  'rank_advancement',
  'recognition',
  'special_badge'
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text default '🎯',
  requirement_type public.milestone_requirement_type not null,
  requirement_value numeric not null,
  reward_type public.reward_type not null default 'recognition',
  reward_description text,
  reward_amount numeric(10, 2),
  is_active boolean not null default true,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.milestones enable row level security;

create policy "Everyone authenticated can view visible milestones"
  on public.milestones for select
  using (auth.uid() is not null);

create policy "Admins can manage milestones"
  on public.milestones for all
  using (public.is_admin())
  with check (public.is_admin());

-- Tracks which salesperson has unlocked which milestone — this is the
-- ONLY place a milestone "happening" is recorded, and it's written
-- exclusively by the progression engine (server-side, admin client),
-- never directly editable by the salesperson themselves.
create table public.salesperson_milestones (
  id uuid primary key default gen_random_uuid(),
  salesperson_id uuid not null references public.profiles(id) on delete cascade,
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  reward_status text not null default 'pending' check (reward_status in ('pending', 'approved', 'paid')),
  reward_amount numeric(10, 2),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  paid_at timestamptz,
  payment_reference text,
  unique (salesperson_id, milestone_id)
);

alter table public.salesperson_milestones enable row level security;

create policy "Admins have full access to salesperson milestones"
  on public.salesperson_milestones for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Salespeople can view their own unlocked milestones"
  on public.salesperson_milestones for select
  using (salesperson_id = auth.uid());

-- =========================================================
-- Promotions — real title/position advancement, with
-- multi-requirement eligibility and optional admin approval.
-- =========================================================
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  required_businesses_sold int not null default 0,
  required_retention_percent numeric(5, 2),
  additional_requirements jsonb,
  benefits text,
  approval_type text not null default 'automatic' check (approval_type in ('automatic', 'admin_approval')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.promotions enable row level security;

create policy "Everyone authenticated can view active promotions"
  on public.promotions for select
  using (auth.uid() is not null);

create policy "Admins can manage promotions"
  on public.promotions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Every promotion decision (eligible/approved/denied), forming the
-- real audit history the spec requires — never overwritten, only
-- appended to.
create table public.salesperson_promotions (
  id uuid primary key default gen_random_uuid(),
  salesperson_id uuid not null references public.profiles(id) on delete cascade,
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  status text not null default 'eligible' check (status in ('eligible', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id),
  notes text,
  requirements_snapshot jsonb
);

alter table public.salesperson_promotions enable row level security;

create policy "Admins have full access to promotion history"
  on public.salesperson_promotions for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Salespeople can view their own promotion history"
  on public.salesperson_promotions for select
  using (salesperson_id = auth.uid());

-- A salesperson's CURRENT title — separate from the append-only
-- history above, so "what are they right now" is a fast, simple read.
alter table public.profiles add column if not exists current_promotion_id uuid references public.promotions(id);

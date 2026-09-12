-- Real per-rank commission amounts. The existing
-- commission_bonus_percent field was decorative — never actually read
-- anywhere in the commission calculation. This adds a direct dollar
-- override instead, which is what actually gets used: if a
-- salesperson's current rank has this set, it replaces the default
-- $150-per-milestone amount when their commission is created.
alter table public.ranks add column if not exists commission_per_milestone numeric(10, 2);

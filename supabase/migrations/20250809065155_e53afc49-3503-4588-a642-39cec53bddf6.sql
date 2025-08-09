-- Create payouts table for vendor withdrawal requests
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  requested_by uuid not null,
  approved_by uuid null,
  paid_by uuid null,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'myr',
  status text not null default 'requested', -- requested | approved | paid | rejected | canceled
  method text not null default 'manual',    -- manual | stripe
  reference text null,                      -- bank ref / transaction id
  notes text null,
  approved_at timestamptz null,
  paid_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.payouts enable row level security;

-- Indexes
create index idx_payouts_vendor on public.payouts(vendor_id);
create index idx_payouts_status on public.payouts(status);

-- Update timestamp trigger
create trigger update_payouts_updated_at
before update on public.payouts
for each row execute function public.update_updated_at_column();

-- Policies
-- Vendors can view payouts for their own vendor
create policy "Vendors view own payouts" on public.payouts
for select to authenticated
using (
  exists (
    select 1 from public.vendors v
    where v.id = payouts.vendor_id and v.user_id = auth.uid()
  )
  or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin')
);

-- Vendors can create payout requests for their own vendor
create policy "Vendors create payout requests" on public.payouts
for insert to authenticated
with check (
  exists (
    select 1 from public.vendors v
    where v.id = payouts.vendor_id and v.user_id = auth.uid()
  )
  and requested_by = auth.uid()
);

-- Vendors can cancel their own requests while still requested
create policy "Vendors cancel own requested payouts" on public.payouts
for delete to authenticated
using (
  status = 'requested'
  and exists (
    select 1 from public.vendors v
    where v.id = payouts.vendor_id and v.user_id = auth.uid()
  )
);

-- Admins manage payouts
create policy "Admins manage payouts" on public.payouts
for all to authenticated
using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

-- Full initial schema + RLS (single transaction)
create extension if not exists pgcrypto;

-- Updated at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Enums
create type public.app_role as enum ('admin', 'superadmin');
create type public.member_type as enum ('vendor', 'delivery', 'buyer', 'coordinator');
create type public.product_status as enum ('active', 'inactive', 'archived');
create type public.order_status as enum ('pending', 'paid', 'canceled', 'fulfilled', 'refunded');
create type public.ledger_entry_type as enum ('vendor_payout', 'community_share', 'coop_share', 'platform_fee', 'refund');
create type public.beneficiary_type as enum ('vendor', 'community', 'coop');

-- Roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);
alter table public.user_roles enable row level security;

-- Role checker
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- Communities
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  coop_fee_percent int not null default 2 check (coop_fee_percent >= 0 and coop_fee_percent <= 100),
  community_fee_percent int not null default 3 check (community_fee_percent >= 0 and community_fee_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_communities_updated
before update on public.communities
for each row execute function public.update_updated_at_column();
alter table public.communities enable row level security;

-- Community members
create table public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_type public.member_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, user_id, member_type)
);
create trigger trg_community_members_updated
before update on public.community_members
for each row execute function public.update_updated_at_column();
alter table public.community_members enable row level security;

-- Vendors
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, community_id)
);
create trigger trg_vendors_updated
before update on public.vendors
for each row execute function public.update_updated_at_column();
alter table public.vendors enable row level security;

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  currency text not null default 'usd',
  status public.product_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_products_updated
before update on public.products
for each row execute function public.update_updated_at_column();
alter table public.products enable row level security;

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  status public.order_status not null default 'pending',
  total_amount_cents int not null default 0 check (total_amount_cents >= 0),
  currency text not null default 'usd',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_orders_updated
before update on public.orders
for each row execute function public.update_updated_at_column();
alter table public.orders enable row level security;

-- Order items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity int not null default 1 check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  created_at timestamptz not null default now()
);
alter table public.order_items enable row level security;

-- Ledger entries
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  entry_type public.ledger_entry_type not null,
  amount_cents int not null check (amount_cents >= 0),
  beneficiary_type public.beneficiary_type not null,
  beneficiary_id uuid,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.ledger_entries enable row level security;

-- Indexes
create index idx_vendors_user on public.vendors(user_id);
create index idx_products_vendor on public.products(vendor_id);
create index idx_orders_buyer on public.orders(buyer_user_id);
create index idx_orders_vendor on public.orders(vendor_id);
create index idx_order_items_order on public.order_items(order_id);
create index idx_ledger_entries_order on public.ledger_entries(order_id);

-- Policies
-- user_roles
create policy "Select own roles or admin" on public.user_roles
for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));
create policy "Admins manage roles" on public.user_roles
for all to authenticated
using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

-- communities
create policy "Communities readable by anyone" on public.communities
for select to public using (true);
create policy "Only admins can write communities" on public.communities
for all to authenticated
using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

-- community_members
create policy "View own memberships or admin" on public.community_members
for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));
create policy "Join community for self or admin" on public.community_members
for insert to authenticated
with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));
create policy "Update/Delete own membership or admin" on public.community_members
for update to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));
create policy "Delete membership own or admin" on public.community_members
for delete to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

-- vendors
create policy "View own vendor or admin" on public.vendors
for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));
create policy "Create vendor for self or admin" on public.vendors
for insert to authenticated
with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));
create policy "Update/Delete own vendor or admin" on public.vendors
for update to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));
create policy "Delete own vendor or admin" on public.vendors
for delete to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

-- products
create policy "Products are publicly readable" on public.products
for select to public using (status = 'active');
create policy "Vendors create products for own vendor" on public.products
for insert to authenticated
with check (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
  )
);
create policy "Vendors update own products or admin" on public.products
for update to authenticated
using (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
  )
)
with check (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
  )
);
create policy "Vendors delete own products or admin" on public.products
for delete to authenticated
using (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
  )
);

-- orders
create policy "View own orders (buyer or vendor) or admin" on public.orders
for select to authenticated
using (
  buyer_user_id = auth.uid()
  or exists (
    select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()
  )
  or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin')
);
create policy "Buyers create their own orders" on public.orders
for insert to authenticated
with check (buyer_user_id = auth.uid());
create policy "Buyer or vendor can update order, or admin" on public.orders
for update to authenticated
using (
  buyer_user_id = auth.uid()
  or exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid())
  or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin')
)
with check (
  buyer_user_id = auth.uid()
  or exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid())
  or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin')
);

-- order_items
create policy "Access order items if you can access the order" on public.order_items
for select to authenticated
using (
  exists (
    select 1 from public.orders o
    left join public.vendors v on v.id = o.vendor_id
    where o.id = order_id and (
      o.buyer_user_id = auth.uid() or v.user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin')
    )
  )
);
create policy "Insert order items if you own the order" on public.order_items
for insert to authenticated
with check (
  exists (
    select 1 from public.orders o
    left join public.vendors v on v.id = o.vendor_id
    where o.id = order_id and (
      o.buyer_user_id = auth.uid() or v.user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin')
    )
  )
);
create policy "Update/Delete order items if you own the order" on public.order_items
for update to authenticated
using (
  exists (
    select 1 from public.orders o
    left join public.vendors v on v.id = o.vendor_id
    where o.id = order_id and (
      o.buyer_user_id = auth.uid() or v.user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin')
    )
  )
)
with check (
  exists (
    select 1 from public.orders o
    left join public.vendors v on v.id = o.vendor_id
    where o.id = order_id and (
      o.buyer_user_id = auth.uid() or v.user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin')
    )
  )
);
create policy "Delete order items if you own the order" on public.order_items
for delete to authenticated
using (
  exists (
    select 1 from public.orders o
    left join public.vendors v on v.id = o.vendor_id
    where o.id = order_id and (
      o.buyer_user_id = auth.uid() or v.user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin')
    )
  )
);

-- ledger_entries
create policy "Admins can view ledger" on public.ledger_entries
for select to authenticated
using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));
create policy "Admins manage ledger" on public.ledger_entries
for all to authenticated
using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

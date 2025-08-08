-- RLS Policies only (retry without IF NOT EXISTS)

-- user_roles
create policy "Select own roles or admin" on public.user_roles
for select
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

create policy "Admins manage roles" on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

-- communities
create policy "Communities readable by anyone" on public.communities
for select
to public
using (true);

create policy "Only admins can write communities" on public.communities
for all
to authenticated
using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

-- community_members
create policy "View own memberships or admin" on public.community_members
for select
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

create policy "Join community for self or admin" on public.community_members
for insert
to authenticated
with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

create policy "Update/Delete own membership or admin" on public.community_members
for update
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

create policy "Delete membership own or admin" on public.community_members
for delete
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

-- vendors
create policy "View own vendor or admin" on public.vendors
for select
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

create policy "Create vendor for self or admin" on public.vendors
for insert
to authenticated
with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

create policy "Update/Delete own vendor or admin" on public.vendors
for update
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

create policy "Delete own vendor or admin" on public.vendors
for delete
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

-- products
create policy "Products are publicly readable" on public.products
for select
to public
using (status = 'active');

create policy "Vendors create products for own vendor" on public.products
for insert
to authenticated
with check (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
  )
);

create policy "Vendors update own products or admin" on public.products
for update
to authenticated
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
for delete
to authenticated
using (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
  )
);

-- orders
create policy "View own orders (buyer or vendor) or admin" on public.orders
for select
to authenticated
using (
  buyer_user_id = auth.uid()
  or exists (
    select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()
  )
  or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin')
);

create policy "Buyers create their own orders" on public.orders
for insert
to authenticated
with check (buyer_user_id = auth.uid());

create policy "Buyer or vendor can update order, or admin" on public.orders
for update
to authenticated
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
for select
to authenticated
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
for insert
to authenticated
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
for update
to authenticated
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
for delete
to authenticated
using (
  exists (
    select 1 from public.orders o
    left join public.vendors v on v.id = o.vendor_id
    where o.id = order_id and (
      o.buyer_user_id = auth.uid() or v.user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin')
    )
  )
);

-- ledger_entries (admin only for now)
create policy "Admins can view ledger" on public.ledger_entries
for select
to authenticated
using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

create policy "Admins manage ledger" on public.ledger_entries
for all
to authenticated
using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'))
with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'superadmin'));

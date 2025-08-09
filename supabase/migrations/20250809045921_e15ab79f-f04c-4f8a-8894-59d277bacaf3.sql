-- Create profiles table for buyer registered address
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postcode text,
  country text not null default 'MY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies: users manage their own profile
create policy if not exists "Select own profile" on public.profiles
for select using (id = auth.uid());

create policy if not exists "Insert own profile" on public.profiles
for insert with check (id = auth.uid());

create policy if not exists "Update own profile" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

-- Trigger to update updated_at
create trigger if not exists update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Auto-create profile on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;$$;

create trigger if not exists on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
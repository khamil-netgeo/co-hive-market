-- 1) Create unified base KYC table
create table if not exists public.kyc_profiles (
  user_id uuid primary key,
  status text not null default 'pending',
  front_id_path text,
  back_id_path text,
  selfie_path text,
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kyc_profiles enable row level security;

-- Policies for kyc_profiles
-- Drop existing if they exist to avoid conflicts
drop policy if exists "Admins can manage kyc profiles" on public.kyc_profiles;
drop policy if exists "Users can insert their own kyc profile" on public.kyc_profiles;
drop policy if exists "Users can update their kyc profile if not approved" on public.kyc_profiles;
drop policy if exists "Users can view their own kyc profile" on public.kyc_profiles;

create policy "Admins can manage kyc profiles"
  on public.kyc_profiles
  as permissive
  for all
  using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'superadmin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'superadmin'::app_role));

create policy "Users can insert their own kyc profile"
  on public.kyc_profiles
  as permissive
  for insert
  with check (user_id = auth.uid());

create policy "Users can update their kyc profile if not approved"
  on public.kyc_profiles
  as permissive
  for update
  using (user_id = auth.uid() and status in ('pending','rejected'))
  with check (user_id = auth.uid() and status in ('pending','rejected'));

create policy "Users can view their own kyc profile"
  on public.kyc_profiles
  as permissive
  for select
  using (user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger to update updated_at
create or replace function public.trg_update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql security definer set search_path = 'public';

-- Attach trigger
create trigger kyc_profiles_set_updated_at
before update on public.kyc_profiles
for each row execute function public.trg_update_updated_at();

-- 2) Create requirements configuration table
create table if not exists public.kyc_requirements (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  key text not null,
  label text not null,
  description text,
  input_type text not null default 'file', -- 'file' | 'text' | 'number' | 'date'
  required boolean not null default true,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(role, key)
);

alter table public.kyc_requirements enable row level security;

-- Policies for kyc_requirements
drop policy if exists "Admins manage kyc requirements" on public.kyc_requirements;
drop policy if exists "Anyone can view kyc requirements" on public.kyc_requirements;

create policy "Admins manage kyc requirements"
  on public.kyc_requirements
  for all
  using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'superadmin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'superadmin'::app_role));

create policy "Anyone can view kyc requirements"
  on public.kyc_requirements
  for select
  using (true);

-- Trigger
create trigger kyc_requirements_set_updated_at
before update on public.kyc_requirements
for each row execute function public.trg_update_updated_at();

-- 3) Submissions for requirements per user
create table if not exists public.kyc_requirement_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  requirement_id uuid not null references public.kyc_requirements(id) on delete cascade,
  value_text text,
  file_path text,
  status text not null default 'pending', -- pending | approved | rejected
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, requirement_id)
);

create index if not exists idx_kyc_req_submissions_requirement on public.kyc_requirement_submissions(requirement_id);
create index if not exists idx_kyc_req_submissions_user on public.kyc_requirement_submissions(user_id);

alter table public.kyc_requirement_submissions enable row level security;

-- Policies for kyc_requirement_submissions
drop policy if exists "Admins manage kyc requirement submissions" on public.kyc_requirement_submissions;
drop policy if exists "Users insert own requirement submissions" on public.kyc_requirement_submissions;
drop policy if exists "Users update own requirement submissions if not approved" on public.kyc_requirement_submissions;
drop policy if exists "Users view own requirement submissions" on public.kyc_requirement_submissions;

create policy "Admins manage kyc requirement submissions"
  on public.kyc_requirement_submissions
  for all
  using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'superadmin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'superadmin'::app_role));

create policy "Users insert own requirement submissions"
  on public.kyc_requirement_submissions
  for insert
  with check (user_id = auth.uid());

create policy "Users update own requirement submissions if not approved"
  on public.kyc_requirement_submissions
  for update
  using (user_id = auth.uid() and status in ('pending','rejected'))
  with check (user_id = auth.uid() and status in ('pending','rejected'));

create policy "Users view own requirement submissions"
  on public.kyc_requirement_submissions
  for select
  using (user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger
create trigger kyc_req_submissions_set_updated_at
before update on public.kyc_requirement_submissions
for each row execute function public.trg_update_updated_at();

-- 4) Data migration: seed kyc_profiles from latest kyc_submissions per user
insert into public.kyc_profiles (user_id, status, front_id_path, back_id_path, selfie_path, notes, reviewed_by, reviewed_at, created_at, updated_at)
select distinct on (user_id)
  user_id,
  status,
  front_id_path,
  back_id_path,
  selfie_path,
  notes,
  reviewed_by,
  reviewed_at,
  created_at,
  updated_at
from public.kyc_submissions
order by user_id, created_at desc
on conflict (user_id) do nothing;

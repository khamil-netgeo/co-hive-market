-- Create storage buckets for avatars (public) and kyc-docs (private)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('kyc-docs', 'kyc-docs', false)
on conflict (id) do nothing;

-- Storage policies for avatars (public read, users write to their folder)
create policy if not exists "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy if not exists "Users can upload their own avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can update their own avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for kyc-docs (private)
create policy if not exists "Owners can manage their own kyc docs"
  on storage.objects for all
  using (
    bucket_id = 'kyc-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'kyc-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Admins can read kyc docs"
  on storage.objects for select
  using (
    bucket_id = 'kyc-docs'
    and (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'superadmin'::app_role))
  );

-- Create KYC submissions table
create table if not exists public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null check (role in ('buyer','vendor','rider')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  front_id_path text,
  back_id_path text,
  selfie_path text,
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kyc_submissions enable row level security;

-- KYC policies
create policy if not exists "Users can insert their own kyc submission"
  on public.kyc_submissions for insert
  with check (user_id = auth.uid());

create policy if not exists "Users can view their own kyc submissions"
  on public.kyc_submissions for select
  using (user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'superadmin'::app_role));

create policy if not exists "Users can update their kyc if not approved"
  on public.kyc_submissions for update
  using (user_id = auth.uid() and status in ('pending','rejected'))
  with check (user_id = auth.uid() and status in ('pending','rejected'));

create policy if not exists "Admins can manage kyc submissions"
  on public.kyc_submissions for all
  using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'superadmin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger for updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_kyc_submissions_updated_at on public.kyc_submissions;
create trigger trg_kyc_submissions_updated_at
before update on public.kyc_submissions
for each row execute function public.update_updated_at_column();

-- Add avatar_url to profiles for user avatars (if not exists)
alter table public.profiles
  add column if not exists avatar_url text;
-- Create public storage bucket for short videos
insert into storage.buckets (id, name, public)
values ('short-videos', 'short-videos', true)
on conflict (id) do nothing;

-- Storage policies for short videos
create policy "Public read short videos"
  on storage.objects
  for select
  using (bucket_id = 'short-videos');

create policy "Users can upload own short videos"
  on storage.objects
  for insert
  with check (
    bucket_id = 'short-videos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own short videos"
  on storage.objects
  for update
  using (
    bucket_id = 'short-videos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own short videos"
  on storage.objects
  for delete
  using (
    bucket_id = 'short-videos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Short posts table for TikTok-style feed
create table if not exists public.short_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  community_id uuid null,
  video_path text not null,
  caption text null,
  status text not null default 'published',
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.short_posts enable row level security;

-- Policies: public can view published, owners/admins manage
create policy "Public view published shorts"
  on public.short_posts
  for select
  using (status = 'published');

create policy "Owners view own shorts"
  on public.short_posts
  for select
  using (user_id = auth.uid());

create policy "Users create own shorts"
  on public.short_posts
  for insert
  with check (user_id = auth.uid());

create policy "Owners/admins update shorts"
  on public.short_posts
  for update
  using (user_id = auth.uid() or has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'superadmin'))
  with check (user_id = auth.uid() or has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'superadmin'));

create policy "Owners/admins delete shorts"
  on public.short_posts
  for delete
  using (user_id = auth.uid() or has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'superadmin'));

-- Trigger to maintain updated_at
create trigger if not exists update_short_posts_updated_at
before update on public.short_posts
for each row execute function public.update_updated_at_column();

-- Vendor delivery settings
alter table public.vendors add column if not exists delivery_radius_km integer not null default 10;
alter table public.vendors add column if not exists delivery_hours jsonb not null default '{}'::jsonb;
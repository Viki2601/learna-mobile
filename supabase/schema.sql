-- Learna profiles table + RLS
-- Run this in the Supabase SQL editor (or via supabase db push).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  auth_provider text not null default 'email' check (auth_provider in ('email', 'google')),
  phone_number text,
  github_url text,
  portfolio_url text,
  avatar_path text,
  deactivated_at timestamptz,
  professional_status text check (professional_status in ('student', 'employed')),
  career_goal text check (career_goal in ('job_search', 'skill_improvement', 'quick_revision')),
  technologies text[] not null default '{}',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists github_url text,
  add column if not exists portfolio_url text,
  add column if not exists avatar_path text,
  add column if not exists deactivated_at timestamptz;

-- Row Level Security: users can only touch their own profile.
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Private profile photos are stored under a folder named with the user's ID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Users can view own avatar files" on storage.objects;
create policy "Users can view own avatar files"
  on storage.objects for select
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload own avatar files" on storage.objects;
create policy "Users can upload own avatar files"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own avatar files" on storage.objects;
create policy "Users can update own avatar files"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own avatar files" on storage.objects;
create policy "Users can delete own avatar files"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, auth_provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    case when new.raw_app_meta_data ->> 'provider' = 'google' then 'google' else 'email' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

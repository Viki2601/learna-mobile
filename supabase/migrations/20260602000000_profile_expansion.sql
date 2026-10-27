alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists github_url text,
  add column if not exists portfolio_url text,
  add column if not exists education text[] not null default '{}',
  add column if not exists experience text[] not null default '{}',
  add column if not exists certifications text[] not null default '{}',
  add column if not exists courses_completed text[] not null default '{}',
  add column if not exists avatar_path text,
  add column if not exists deactivated_at timestamptz;

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

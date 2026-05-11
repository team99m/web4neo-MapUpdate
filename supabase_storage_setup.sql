-- ========================================================================================
-- WEB4NEO SUPABASE STORAGE SETUP
-- Run this script in the Supabase SQL Editor to set up the image storage bucket.
-- ========================================================================================

-- 1. Create the bucket
insert into storage.buckets (id, name, public)
values ('web4neo-images', 'web4neo-images', true)
on conflict (id) do nothing;

-- 2. Allow public access to view images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'web4neo-images' );

-- 3. Allow authenticated users to upload images
create policy "Auth Uploads"
on storage.objects for insert
with check (
  bucket_id = 'web4neo-images' AND 
  auth.role() = 'authenticated'
);

-- 4. Allow users to update their own uploaded images
create policy "Users can update their own images"
on storage.objects for update
using (
  bucket_id = 'web4neo-images' AND 
  auth.uid() = owner
);

-- 5. Allow users to delete their own uploaded images
create policy "Users can delete their own images"
on storage.objects for delete
using (
  bucket_id = 'web4neo-images' AND 
  auth.uid() = owner
);

-- ========================================================================================
-- AVATARS BUCKET SETUP
-- ========================================================================================

-- 6. Create the avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 7. Allow public access to view avatars
create policy "Public Access Avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 8. Allow authenticated users to upload avatars
create policy "Auth Uploads Avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- 9. Allow users to update their own avatars
create policy "Users can update their own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars' AND 
  auth.uid() = owner
);

-- 10. Allow users to delete their own avatars
create policy "Users can delete their own avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars' AND 
  auth.uid() = owner
);

-- ========================================================================================
-- STORAGE FIX: ISSUE IMAGES BUCKET & RLS POLICIES
-- Run this script in the Supabase SQL Editor to fix the photo upload/display issue.
-- ========================================================================================

-- 1. Create or Update the bucket to be PUBLIC
INSERT INTO storage.buckets (id, name, public) 
VALUES ('issue-images', 'issue-images', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing conflicting policies if any
DROP POLICY IF EXISTS "public can view images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "users can manage their own images" ON storage.objects;
DROP POLICY IF EXISTS "users can delete their own images" ON storage.objects;

-- 3. Create NEW Policies for 'issue-images' bucket

-- A. Allow anyone to VIEW images (required for display)
CREATE POLICY "public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'issue-images');

-- B. Allow authenticated users to UPLOAD images
CREATE POLICY "authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'issue-images'
  AND auth.role() = 'authenticated'
);

-- C. Allow users to UPDATE their own images
CREATE POLICY "users can manage their own images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'issue-images' AND auth.uid() = owner);

-- D. Allow users to DELETE their own images
CREATE POLICY "users can delete their own images"
ON storage.objects FOR DELETE
USING (bucket_id = 'issue-images' AND auth.uid() = owner);

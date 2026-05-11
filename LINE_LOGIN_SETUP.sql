-- STEP 5: Add line_user_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS line_user_id text;

-- Optional: Add a comment to the column
COMMENT ON COLUMN public.profiles.line_user_id IS 'LINE User ID (sub) from Supabase Identities';

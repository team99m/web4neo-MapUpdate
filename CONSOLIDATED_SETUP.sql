-- ========================================================================================
-- WEB4NEO CONSOLIDATED SETUP SCRIPT (COMPLETE)
-- This script combines all tables, RLS policies, real-time configurations, and fixes.
-- Run this script in the Supabase SQL Editor to set up the entire database from scratch.
-- ========================================================================================

-- 1. Profiles Table (Core)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'citizen',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Issues Table (Module 1.1: Map & Reporting)
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  department TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Posts Table (Module 1.2: Community Feed)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  category TEXT,
  visibility TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Comments Table (Module 1.2: Community Feed)
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_type TEXT NOT NULL, -- 'issue', 'post', or 'comment'
  parent_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Reactions Table (Module 1.2: Community Feed)
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_type TEXT NOT NULL, -- 'issue', 'post', 'comment'
  parent_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'like', 'love', 'angry', 'fix_it'
  UNIQUE(user_id, parent_type, parent_id, type)
);

-- 6. Transit Routes Table (Module 1.3: Transit)
CREATE TABLE IF NOT EXISTS public.transit_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT,
  polyline JSONB,
  active BOOLEAN DEFAULT true
);

-- 7. Transit Stops Table (Module 1.3: Transit)
CREATE TABLE IF NOT EXISTS public.transit_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.transit_routes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  sequence INTEGER NOT NULL
);

-- 8. Notifications Table (Core)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT,
  payload JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================================

-- ========================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================================

-- OPTION A: DISABLE RLS (USE THIS IF YOU ARE GETTING PERMISSION ERRORS DURING DEV)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_stops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- ENSURE PERMISSIONS ARE GRANTED TO AUTHENTICATED AND ANON ROLES
GRANT ALL ON TABLE public.profiles TO authenticated, anon;
GRANT ALL ON TABLE public.posts TO authenticated, anon;
GRANT ALL ON TABLE public.comments TO authenticated, anon;
GRANT ALL ON TABLE public.reactions TO authenticated, anon;
GRANT ALL ON TABLE public.issues TO authenticated, anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- OPTION B: ENABLE RLS (RECOMMENDED FOR PRODUCTION)
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transit_routes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transit_stops ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING POLICIES TO PREVENT ERRORS ON RE-RUN
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Public issues are viewable by everyone" ON public.issues;
DROP POLICY IF EXISTS "Auth users can insert issues" ON public.issues;
DROP POLICY IF EXISTS "Users can update own issues" ON public.issues;

DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Auth users can insert posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Auth users can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

DROP POLICY IF EXISTS "Public reactions are viewable by everyone" ON public.reactions;
DROP POLICY IF EXISTS "Auth users can insert reactions" ON public.reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON public.reactions;

-- CREATE POLICIES
-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Issues
CREATE POLICY "Public issues are viewable by everyone" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Auth users can insert issues" ON public.issues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own issues" ON public.issues FOR UPDATE USING (auth.uid() = user_id);

-- Posts
CREATE POLICY "Public posts are viewable by everyone" ON public.posts FOR SELECT USING (visibility = 'public');
CREATE POLICY "Auth users can insert posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Public comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Auth users can insert comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Reactions
CREATE POLICY "Public reactions are viewable by everyone" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Auth users can insert reactions" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- Transit & Notifications
CREATE POLICY "Transit routes are viewable by everyone" ON public.transit_routes FOR SELECT USING (true);
CREATE POLICY "Transit stops are viewable by everyone" ON public.transit_stops FOR SELECT USING (true);
CREATE POLICY "Notifications are viewable by owner" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ========================================================================================
-- TRIGGERS & FUNCTIONS
-- ========================================================================================

-- Automatically create a profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'citizen'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Automatically update updated_at column on issues
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_issues_modtime ON public.issues;
CREATE TRIGGER update_issues_modtime
  BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ========================================================================================
-- DATA INTEGRITY & CASCADES
-- Ensure that deleting a post or comment works even if it has children
-- ========================================================================================

ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_post_id_fkey;

ALTER TABLE public.comments
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- ========================================================================================
-- REALTIME CONFIGURATION
-- ========================================================================================

-- Safe way to add tables to the publication
DO $$ 
BEGIN
  -- Re-create publication if needed or just add tables
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add tables if not already present
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'issues') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
  END IF;
END $$;


-- Social Feed Schema Extensions (WDD Module 1.2)

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Follows Table (Social Graph)
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);

-- 3. Bookmarks Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);

-- 4. Reports Table (Moderation)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_type TEXT NOT NULL, -- 'post' or 'comment'
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON public.notifications FOR INSERT WITH CHECK (true);

-- RLS Policies: Follows
CREATE POLICY "Anyone can view follows" 
ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others" 
ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies: Reports
CREATE POLICY "Users can submit reports" 
ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view reports" 
ON public.reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Explicit Grants (to resolve 42501 Permission Denied)
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT SELECT, INSERT ON public.reports TO authenticated;

GRANT SELECT ON public.notifications TO anon;
GRANT SELECT ON public.follows TO anon;

-- 1. Grant general permission to authenticated users to perform deletions
GRANT DELETE ON public.reports TO authenticated;

-- 2. Create an RLS policy to ensure ONLY admins and staff can actually delete reports
CREATE POLICY "Admins and staff can delete reports" 
ON public.reports 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'staff')
  )
);

-- 3. Ensure RLS is enabled on the table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

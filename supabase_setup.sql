-- ========================================================================================
-- WEB4NEO SUPABASE SETUP SCRIPT
-- Run this script in the Supabase SQL Editor to set up the database schema for all modules.
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
  post_id UUID, -- Optional: link to top-level post for easier thread fetching
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
  type TEXT NOT NULL, -- 'like', 'upvote', etc.
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Read Policies (Public data viewable by anyone)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public issues are viewable by everyone" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Public posts are viewable by everyone" ON public.posts FOR SELECT USING (visibility = 'public');
CREATE POLICY "Public comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Public reactions are viewable by everyone" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Transit routes are viewable by everyone" ON public.transit_routes FOR SELECT USING (true);
CREATE POLICY "Transit stops are viewable by everyone" ON public.transit_stops FOR SELECT USING (true);
CREATE POLICY "Notifications are viewable by owner" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- Insert Policies (Authenticated users can create content)
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Auth users can insert issues" ON public.issues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can insert posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can insert comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can insert reactions" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update/Delete Policies (Users can manage their own content)
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can update own issues" ON public.issues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);
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

CREATE TRIGGER update_issues_modtime
  BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Enable Realtime for Posts and Issues (required for Module 1.2 Feed)
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;

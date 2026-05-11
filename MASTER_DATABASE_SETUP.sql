-- ==========================================
-- Web4neo Master Database Setup
-- Consolidated Schema (Modules 1.1, 1.2, 1.3 + Admin)
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- 2.1 Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'citizen',
  rank TEXT DEFAULT 'Bronze',
  email TEXT,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 Issues (Module 1.1: Map & Reporting)
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  department TEXT,
  images TEXT[] DEFAULT '{}',
  reject_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Social Feed (Module 1.2)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  category TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_type TEXT NOT NULL, -- 'post' or 'issue'
  parent_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_type TEXT NOT NULL, -- 'post' or 'comment'
  parent_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'like', 'agree', etc.
  UNIQUE(user_id, parent_type, parent_id)
);

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- 2.4 Transit (Module 1.3)
CREATE TABLE IF NOT EXISTS public.transit_routes (
  id TEXT PRIMARY KEY, -- e.g. 'mrt-blue'
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'bus', 'mrt', etc.
  color TEXT,
  polyline JSONB,
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.transit_stops (
  id TEXT PRIMARY KEY,
  route_id TEXT REFERENCES public.transit_routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  sequence INTEGER NOT NULL
);

-- 2.5 Moderation & Reviews
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL, -- 'post', 'comment', 'user'
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.issue_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT now(),
  note TEXT
);

-- 2.6 Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT,
  payload JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. FUNCTIONS & TRIGGERS

-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors on multiple runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. STORAGE BUCKETS (Manual Setup Recommended)
/*
INSERT INTO storage.buckets (id, name, public) VALUES ('issue-images', 'issue-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
*/

-- 5. RLS POLICIES

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Issues
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Issues are viewable by everyone" ON public.issues;
CREATE POLICY "Issues are viewable by everyone" ON public.issues FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert issues" ON public.issues;
CREATE POLICY "Users can insert issues" ON public.issues FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins/Staff can update issues" ON public.issues;
CREATE POLICY "Admins/Staff can update issues" ON public.issues FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))
);

-- Posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert posts" ON public.posts;
CREATE POLICY "Users can insert posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Reports (Moderation)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins/staff can see reports" ON public.reports;
CREATE POLICY "Only admins/staff can see reports" ON public.reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))
);
DROP POLICY IF EXISTS "Any authenticated user can report" ON public.reports;
CREATE POLICY "Any authenticated user can report" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Only admins/staff can delete reports" ON public.reports;
CREATE POLICY "Only admins/staff can delete reports" ON public.reports FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))
);

-- 6. GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

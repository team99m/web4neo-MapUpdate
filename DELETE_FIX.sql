-- 1. DROP EXISTING POLICIES TO PREVENT DUPLICATE ERRORS
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- 2. CREATE NEW DELETE POLICIES
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- 3. ENSURE CASCADE ON COMMENTS
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_post_id_fkey;

ALTER TABLE public.comments
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- 4. ENSURE CASCADE ON REACTIONS (FOR POSTS)
-- Reactions use parent_id (UUID). We can only cascade if we know the parent type.
-- Since reactions are polymorphic, the safest way is a trigger or just manual cleanup.
-- However, most reactions in this app are on posts/comments.

-- 5. ENABLE REALTIME SAFELY
-- Instead of ADD TABLE, we'll recreate the publication for these tables to be sure
-- Note: This might affect other tables if they were manually added. 
-- In a standard Supabase setup, it's safer to just try/catch the add.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
  END IF;
END $$;

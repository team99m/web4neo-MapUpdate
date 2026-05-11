# WDD — Module 1.2: Social Feed

> Extends: `WDD-Overview.md` · Person C · Depends on: Module 0 Core

---

## 1. Module Overview

A Facebook-style social layer for the platform. Citizens can post about community topics, share photos, comment, and react — independent of the formal issue-reporting flow but linkable to it.

The social feed transforms the platform from a complaint box into a community space.

---

## 2. Pages & Routes

| Route | Description | Auth |
|---|---|---|
| `/feed` | Main social feed — all public posts | Public |
| `/feed?category=road` | Filtered feed by category | Public |
| `/post/:id` | Single post detail with comments | Public |
| `/post/new` | Create new post | Required |
| `/profile/:username` | User profile page | Public |
| `/profile/edit` | Edit own profile | Required |
| `/settings` | Account settings, notification prefs | Required |
| `/notifications` | Notification center | Required |

---

## 3. User Flows

### 3.1 Creating a Post

```
1. Tap "+" compose button
2. Write content (rich text, max 2000 chars)
3. Optionally attach images (up to 10, auto-compressed)
4. Choose category tag (optional)
5. Link to existing issue (optional — issue picker modal)
6. Visibility: Public / Followers only
7. Post → creates posts row in DB
8. Returns to /feed, new post appears at top
```

### 3.2 Feed Browsing

```
/feed loads:
  - Infinite scroll (20 posts per page, cursor-based pagination)
  - Top bar: [All] [Road] [Flood] [Community] [Transit] [Other]
  - Each card: avatar, name, content snippet, images, reaction counts
  - Tap card → /post/:id (full view)
  - Pull-to-refresh gesture support
```

### 3.3 Profile Page

```
/profile/:username shows:
  - Avatar, display name, bio, follower/following count
  - Tab: Posts | Liked | Issues (links to their reported issues)
  - Follow/Unfollow button (if not own profile)
  - Report user button
```

---

## 4. Components

### `<PostCard />`

```
┌─────────────────────────────────────────┐
│ [Avatar] Jane Doe · 3h ago              │
│ #road #community                        │
│                                         │
│ The pothole on Rama IV near the BTS     │
│ is getting worse every day...           │
│                                         │
│ [Photo grid: 2 images]                  │
│                                         │
│ 👍 42  💬 8  🔁 Share   ⋯ More         │
└─────────────────────────────────────────┘
```

Props: `{ post: Post, compact?: boolean }`

### `<CommentThread />`

Threaded comments (2 levels: comment → reply).

```
Jane: Great post! The city should fix this.
  └── John: Totally agree, reported it last week
  └── [Load more replies]
[Add comment...]
```

### `<PostComposer />`

Bottom-sheet composer on mobile. Contains:
- Textarea with character counter
- Image picker row (horizontal scroll)
- Category chip selector
- Issue linker button
- Post / Cancel actions

### `<UserAvatar />`
Shared from Module 0 Core. Size variants: `sm` (24px) `md` (40px) `lg` (80px).

### `<CategoryChip />`

```svelte
<CategoryChip label="road" color="teal" />
<CategoryChip label="community" color="blue" />
```

### `<NotificationItem />`
Used in `/notifications` list and the bell dropdown.

```
[Avatar] Jane liked your post         2m ago
[Avatar] New comment on your issue    1h ago
[System] Issue #12 has been resolved  Yesterday
```

---

## 5. Data Model (Module 1.2 Owned)

Core tables defined in `WDD-Overview.md §6`. Additional tables for this module:

```sql
-- Follow relationships
follows (
  follower_id  uuid REFERENCES profiles(id),
  following_id uuid REFERENCES profiles(id),
  created_at   timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
)

-- Post category tags
post_tags (
  post_id  uuid REFERENCES posts(id),
  tag      text,
  PRIMARY KEY (post_id, tag)
)

-- Saved posts (bookmarks)
bookmarks (
  user_id   uuid REFERENCES profiles(id),
  post_id   uuid REFERENCES posts(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
)

-- Block list
blocks (
  blocker_id uuid REFERENCES profiles(id),
  blocked_id uuid REFERENCES profiles(id),
  PRIMARY KEY (blocker_id, blocked_id)
)
```

---

## 6. Feed Algorithm

The feed is sorted by a simple relevance score (no black-box ML needed at v1):

```sql
-- Score formula
score = base_recency_score
      + (reaction_count * 1.5)
      + (comment_count * 2.0)
      + (is_following_author * 5.0)
      - (hours_since_posted * 0.3)

-- Feed query (simplified)
SELECT posts.*, score
FROM posts
LEFT JOIN follows ON follows.following_id = posts.user_id
  AND follows.follower_id = $current_user
WHERE posts.visibility = 'public'
  AND posts.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $current_user)
ORDER BY score DESC
LIMIT 20 OFFSET $cursor;
```

Category filter bypasses scoring and shows chronological results for that category.

---

## 7. Image Gallery

Multi-image posts use a responsive photo grid:

| Image count | Layout |
|---|---|
| 1 | Full width, 16:9 |
| 2 | Side by side, square |
| 3 | Left half + right stack (2) |
| 4+ | 2×2 grid, "+N more" overlay |

Tap any image → fullscreen lightbox with swipe navigation.

---

## 8. Reactions

Reaction types are limited for clarity:

| Emoji | Key | Meaning |
|---|---|---|
| 👍 | `like` | I agree / support |
| ❤️ | `love` | Community love |
| 😠 | `angry` | This makes me angry |
| 🛠️ | `fix_it` | This needs fixing |

One reaction per user per post. Toggle to remove.

```sql
-- reactions table (defined in WDD-Overview.md §6)
-- parent_type = 'post' for social reactions
```

---

## 9. Content Moderation

At v1, moderation is manual (admin removes flagged content).

Report flow:
1. Tap `⋯ More` on any post or comment
2. Select "Report post"
3. Choose reason: Spam · Offensive · Misinformation · Other
4. Creates `reports` table row, visible in admin panel

```sql
reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id),
  target_type text,   -- 'post' | 'comment' | 'profile'
  target_id   uuid,
  reason      text,
  created_at  timestamptz DEFAULT now()
)
```

---

## 10. Notifications

Module 1.2 generates these notification events (written to `notifications` table):

| Event | Trigger | Recipient |
|---|---|---|
| `post_liked` | Someone likes your post | Post author |
| `post_commented` | Someone comments on your post | Post author |
| `comment_replied` | Someone replies to your comment | Comment author |
| `new_follower` | Someone follows you | Followed user |
| `post_mentioned` | You are @mentioned in a post | Mentioned user |

Bell icon shows unread count badge. Notification page marks all as read on visit.

---

## 11. Privacy & RLS Policies

```sql
-- Anyone can read public posts
CREATE POLICY "public_posts_readable" ON posts
  FOR SELECT USING (visibility = 'public');

-- Only author can update/delete own post
CREATE POLICY "own_post_write" ON posts
  FOR ALL USING (auth.uid() = user_id);

-- Blocked users cannot see each other's content (via function)
CREATE OR REPLACE FUNCTION is_blocked(target_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = auth.uid() AND blocked_id = target_user_id)
       OR (blocker_id = target_user_id AND blocked_id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 12. Performance Notes

- Feed uses cursor-based pagination (not offset) to avoid duplicate posts during real-time inserts
- Images lazy-loaded with `loading="lazy"` + IntersectionObserver prefetch
- Comment threads load collapsed by default — expand on tap
- Svelte `{#each}` with keyed items ensures efficient DOM diffing during infinite scroll

---

*WDD-Module-1.2 · v1.0*

import { type Post } from '@/core/components/PostCard'

/**
 * Frontend-side feed scoring algorithm.
 * Higher score = more relevant/popular.
 */
export function scoreFeed(posts: Post[], followingIds: string[]): Post[] {
  const now = Date.now()
  
  return [...posts].sort((a, b) => {
    const scoreA = calculatePostScore(a, followingIds, now)
    const scoreB = calculatePostScore(b, followingIds, now)
    return scoreB - scoreA
  })
}

function calculatePostScore(post: Post, followingIds: string[], now: number): number {
  const postTime = new Date(post.created_at).getTime()
  const hoursSince = (now - postTime) / (1000 * 60 * 60)
  
  // Base score
  let score = 100

  // 1. Reactions boost
  const reactionTotal = Object.values(post.reactionCounts).reduce((acc, count) => acc + count, 0)
  score += reactionTotal * 2.5

  // 2. Comments boost
  score += post.commentCount * 4.0

  // 3. Social boost (following)
  if (followingIds.includes(post.author.id)) {
    score += 50
  }

  // 4. Media boost
  if (post.images.length > 0) {
    score += 15
  }

  // 5. Time decay
  // Decay more aggressively after 24 hours
  const decayFactor = hoursSince > 24 ? 2.0 : 0.8
  score -= hoursSince * decayFactor

  return score
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/core/supabase/client'
import { type Post, type PostAuthor } from '@/core/components/PostCard'
import { useAuth } from '@/core/auth/useAuth'
import { useReaction } from './useReaction'
import { useFollow } from './useFollow'
import { scoreFeed } from '@/core/utils/scoreFeed'

const PAGE_SIZE = 10

export function useFeed(category: string | null, searchQuery: string = '') {
  const { user } = useAuth()
  const { getReactionsForParents, toggleReaction } = useReaction()
  const { getFollowingList } = useFollow()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [newPostsCount, setNewPostsCount] = useState(0)

  // Fetch initial posts
  const fetchPosts = useCallback(async (reset = false) => {
    console.log('Fetching feed...', { category, searchQuery, reset })
    
    // Safety timeout to prevent infinite spinner
    const timeout = setTimeout(() => {
      setLoading(false)
      setLoadingMore(false)
    }, 10000)

    try {
      if (reset) {
        setLoading(true)
        setHasMore(true)
      } else {
        setLoadingMore(true)
      }

      let query = (supabase
        .from('posts')
        .select('*, profiles:user_id(username, display_name, avatar_url), comments(count), issues:issue_id(title)') as any)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`)
      }

      // Cursor-based pagination using the created_at of the last post
      if (!reset && posts.length > 0) {
        const lastPost = posts[posts.length - 1]
        query = query.lt('created_at', lastPost.created_at)
      }

      const { data, error } = await query

      clearTimeout(timeout)

      if (error) {
        console.error('Supabase Feed Error Details:', JSON.stringify(error, null, 2))
        throw error
      }

      const rawData = data as any[]
      console.log(`Fetched ${rawData?.length} posts`)

      // Fetch reactions for these posts
      const reactionData = await getReactionsForParents(rawData.map(p => p.id), 'post')

      const formattedPosts: Post[] = (rawData || []).map(post => ({
        id: post.id,
        content: post.content,
        images: post.images || [],
        category: post.category,
        created_at: post.created_at,
        author: {
          id: post.user_id,
          username: post.profiles?.username || 'User', 
          display_name: post.profiles?.display_name || 'Community Member',
          avatar_url: post.profiles?.avatar_url || null
        },
        reactionCounts: reactionData[post.id]?.counts || { like: 0, love: 0, angry: 0, fix_it: 0 },
        userReaction: reactionData[post.id]?.userReaction || null,
        commentCount: post.comments?.[0]?.count || 0,
        issue_id: post.issue_id,
        issue_title: post.issues?.title || null
      }))

      if (reset) {
        // Only apply scoring for the main feed (no active filters/search)
        if (user && !searchQuery && (!category || category === 'all')) {
          const following = await getFollowingList(user.id)
          const scored = scoreFeed(formattedPosts, following)
          setPosts(scored)
        } else {
          setPosts(formattedPosts)
        }
        setNewPostsCount(0)
      } else {
        setPosts(prev => [...prev, ...formattedPosts])
      }

      setHasMore((data?.length || 0) === PAGE_SIZE)
    } catch (err) {
      console.error('Error fetching feed:', err)
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      clearTimeout(timeout)
    }
  }, [category, searchQuery, user, getFollowingList, getReactionsForParents, posts]) 

  // Initial load
  useEffect(() => {
    fetchPosts(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, searchQuery])

  // Real-time subscription for posts
  useEffect(() => {
    const channel = supabase.channel('public:posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('Real-time feed event:', payload.eventType, payload)
          
          if (payload.eventType === 'INSERT') {
            // If a category filter is active, only increment if the new post matches
            if (!category || category === 'all' || payload.new.category === category) {
              // Ignore own posts
              if (payload.new.user_id !== user?.id) {
                setNewPostsCount(prev => prev + 1)
              }
            }
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setPosts(prev => prev.map(p => p.id === payload.new.id ? {
              ...p,
              content: payload.new.content,
              category: payload.new.category
            } : p))
          }
        }
      )
      .subscribe()


    return () => {
      supabase.removeChannel(channel)
    }
  }, [category, user?.id])

  const refreshFeed = () => fetchPosts(true)

  const deletePost = async (postId: string) => {
    console.log('useFeed: deletePost called', postId)
    if (!user) {
      console.warn('useFeed: deletePost - no user')
      return
    }
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id)

      if (error) {
        console.error('useFeed: deletePost error', error)
        throw error
      }
      console.log('useFeed: deletePost success')
      // Manual state update for immediate feedback
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err) {
      console.error('Error deleting post:', err)
      throw err
    }
  }

  const updatePost = async (postId: string, content: string, category?: string) => {
    console.log('useFeed: updatePost called', { postId, content, category })
    if (!user || !content.trim()) return
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          content: content.trim(),
          category: category || 'other'
        })
        .eq('id', postId)
        .eq('user_id', user.id)

      if (error) {
        console.error('useFeed: updatePost error', error)
        throw error
      }
      console.log('useFeed: updatePost success')
      // Manual state update for immediate feedback
      setPosts(prev => prev.map(p => p.id === postId ? { 
        ...p, 
        content: content.trim(),
        category: category || p.category
      } : p))
    } catch (err) {
      console.error('Error updating post:', err)
      throw err
    }
  }




  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    newPostsCount,
    loadMore: () => fetchPosts(false),
    refreshFeed,
    deletePost,
    updatePost,
    toggleReaction: async (postId: string, type: any) => {
      await toggleReaction(postId, type, 'post')
      // Re-fetch reactions for just this post to update counts
      const updated = await getReactionsForParents([postId], 'post')
      if (updated[postId]) {
        setPosts(prev => prev.map(p => p.id === postId ? {
          ...p,
          reactionCounts: updated[postId].counts,
          userReaction: updated[postId].userReaction
        } : p))
      }
    }
  }
}


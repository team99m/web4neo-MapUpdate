'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/core/supabase/client'
import { type Post } from '@/core/components/PostCard'
import { useAuth } from '@/core/auth/useAuth'
import { type ReactionType, type ReactionCounts } from '@/core/components/ReactionGroup'
import { useReaction } from './useReaction'
import { useNotification } from './useNotification'

export interface PostComment {
  id: string
  post_id?: string | null
  user_id: string
  content: string
  parent_id: string
  parent_type: string
  created_at: string
  profiles: {
    username: string
    display_name: string
    avatar_url: string | null
  }
  replies?: PostComment[]
  reactionCounts: ReactionCounts
  userReaction: ReactionType | null
}

export function usePost(postId: string) {
  const { user } = useAuth()
  const { getReactionsForParents, toggleReaction } = useReaction()
  const { sendNotification } = useNotification()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!postId) return
    try {
      setLoading(true)

      // 1. Fetch Post
      const { data: postDataRaw, error: postError } = await supabase
        .from('posts')
        .select('*, profiles:user_id(id, username, display_name, avatar_url), issues:issue_id(title)')
        .eq('id', postId)
        .maybeSingle()

      if (postError) {
        console.error('Supabase Post Error Details:', JSON.stringify(postError, null, 2))
        throw postError
      }

      if (!postDataRaw) {
        console.warn('Post not found in DB for ID:', postId)
        setPost(null)
        setLoading(false)
        return
      }

      const postData = postDataRaw as any

      // 2. Fetch Comments (all in thread)
      const { data: commentDataRaw, error: commentError } = await (supabase
        .from('comments')
        .select('*, profiles:user_id(username, display_name, avatar_url)') as any)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (commentError) {
        console.error('Supabase Comment Error Details:', JSON.stringify(commentError, null, 2))
        // Don't throw, we still want to show the post
      }
      const commentData = (commentDataRaw as any[]) || []

      // 3. Fetch Post Reactions
      const postReactionData = await getReactionsForParents([postId], 'post')

      // 4. Fetch Comment Reactions
      const commentIds = commentData.map(c => c.id)
      const commentReactionData = await getReactionsForParents(commentIds, 'comment')

      // Format Post
      const formattedPost: Post = {
        id: postData.id,
        content: postData.content,
        images: postData.images || [],
        category: postData.category,
        created_at: postData.created_at,
        author: {
          id: postData.profiles?.id || postData.user_id,
          username: postData.profiles?.username || 'unknown',
          display_name: postData.profiles?.display_name || 'Unknown User',
          avatar_url: postData.profiles?.avatar_url || null
        },
        reactionCounts: postReactionData[postId]?.counts || { like: 0, love: 0, angry: 0, fix_it: 0 },
        userReaction: postReactionData[postId]?.userReaction || null,
        commentCount: commentData.length,
        issue_id: postData.issue_id,
        issue_title: postData.issues?.title || null
      }

      // Structure Comments (nested)
      const commentMap: Record<string, PostComment> = {}
      const rootComments: PostComment[] = []

      commentData.forEach(c => {
        const comment: PostComment = {
          id: c.id,
          post_id: c.post_id,
          user_id: c.user_id,
          content: c.content,
          parent_id: c.parent_id,
          parent_type: c.parent_type,
          created_at: c.created_at,
          profiles: {
            username: c.profiles?.username || 'unknown',
            display_name: c.profiles?.display_name || 'Unknown User',
            avatar_url: c.profiles?.avatar_url || null
          },
          replies: [],
          reactionCounts: commentReactionData[c.id]?.counts || { like: 0, love: 0, angry: 0, fix_it: 0 },
          userReaction: commentReactionData[c.id]?.userReaction || null
        }
        commentMap[c.id] = comment
      })


      // Second pass to build hierarchy
      commentData.forEach(c => {
        const comment = commentMap[c.id]
        if (c.parent_id === postId) {
          // It's a top-level comment (parent is the post)
          rootComments.push(comment)
        } else if (commentMap[c.parent_id]) {
          // It's a reply to another comment
          commentMap[c.parent_id].replies?.push(comment)
        }
      })

      setPost(formattedPost)
      setComments(rootComments)
    } catch (err: any) {
      console.error('Error fetching post detail:', err?.message || err)
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time updates
  useEffect(() => {
    if (!postId) return

    // Channel for comments
    const commentChannel = supabase.channel(`post_comments:${postId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          console.log('Real-time comment update:', payload.eventType, payload)
          // For nested comments, it's easier to just re-fetch to rebuild the hierarchy correctly
          fetchData()
        }
      )
      .subscribe()

    // Channel for the post itself
    const postChannel = supabase.channel(`post_detail:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${postId}`
        },
        (payload) => {
          console.log('Real-time post update:', payload.eventType, payload)
          if (payload.eventType === 'UPDATE') {
            setPost(prev => prev ? {
              ...prev,
              content: payload.new.content,
              category: payload.new.category
            } : null)
          } else if (payload.eventType === 'DELETE') {
            setPost(null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(commentChannel)
      supabase.removeChannel(postChannel)
    }
  }, [postId, fetchData])


  const addComment = async (content: string, parentId: string | null = null) => {
    console.log('usePost: addComment called', { content, parentId, postId })
    if (!user || !content.trim() || !postId) {
      console.warn('usePost: addComment early return', { user: !!user, content: !!content.trim(), postId: !!postId })
      return
    }
    setSubmitting(true)
    try {
      const { error } = await (supabase.from('comments') as any).insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId || postId,
        parent_type: parentId ? 'comment' : 'post'
      })
      if (error) {
        console.error('usePost: addComment error', error)
        throw error
      }
      console.log('usePost: addComment success')

      // Notifications logic
      if (post && post.author.id !== user.id) {
        await sendNotification(post.author.id, 'post_commented', {
          post_id: postId,
          comment_content: content.slice(0, 50)
        })
      }

      if (parentId && parentId !== postId) {
        const { data: parentComment } = await supabase
          .from('comments')
          .select('user_id')
          .eq('id', parentId)
          .single()
        
        if (parentComment && parentComment.user_id !== user.id && parentComment.user_id !== post?.author.id) {
          await sendNotification(parentComment.user_id, 'comment_replied', {
            post_id: postId,
            comment_id: parentId,
            reply_content: content.slice(0, 50)
          })
        }
      }
    } catch (err) {
      console.error('Error adding comment:', err)
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const updateComment = async (commentId: string, content: string) => {
    console.log('usePost: updateComment called', { commentId, content })
    if (!user || !content.trim()) return
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: content.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error
      // Re-fetch to ensure hierarchy is correct
      fetchData()
    } catch (err) {
      console.error('Error updating comment:', err)
      throw err
    }
  }

  const updatePost = async (postId: string, content: string, category?: string) => {
    console.log('usePost: updatePost called', { postId, content, category })
    if (!user || !content.trim()) return
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          content: content.trim(),
          category: category || null
        })
        .eq('id', postId)
        .eq('user_id', user.id)

      if (error) throw error
      setPost(prev => prev ? { 
        ...prev, 
        content: content.trim(),
        category: category || prev.category
      } : null)
    } catch (err) {
      console.error('Error updating post:', err)
      throw err
    }
  }


  const deleteComment = async (commentId: string) => {
    console.log('usePost: deleteComment called', commentId)
    if (!user) return
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Error deleting comment:', err)
      throw err
    }
  }

  const deletePost = async (postId: string) => {
    console.log('usePost: deletePost called', postId)
    if (!user) return
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id)

      if (error) throw error
      setPost(null)
    } catch (err) {
      console.error('Error deleting post:', err)
      throw err
    }
  }



  return { 
    post, 
    comments, 
    loading, 
    submitting, 
    addComment, 
    updateComment,
    updatePost,
    deleteComment, 
    deletePost,
    toggleReaction: async (type: any) => {
      await toggleReaction(postId, type, 'post')
      fetchData() // Refresh to show new counts
    },
    toggleCommentReaction: async (commentId: string, type: any) => {
      await toggleReaction(commentId, type, 'comment')
      fetchData()
    }
  }
}

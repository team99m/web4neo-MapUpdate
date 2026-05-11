'use client'
import { useState, useCallback } from 'react'
import { supabase } from '@/core/supabase/client'
import { useAuth } from '@/core/auth/useAuth'
import { type ReactionType, type ReactionCounts } from '@/core/components/ReactionGroup'
import { useNotification } from './useNotification'

export function useReaction() {
  const { user } = useAuth()
  const { sendNotification } = useNotification()
  const [loading, setLoading] = useState(false)

  /**
   * Fetches reaction counts and the current user's reaction for a set of parents (posts, comments, or issues).
   */
  const getReactionsForParents = useCallback(async (parentIds: string[], parentType: 'post' | 'comment' | 'issue' = 'post') => {
    if (parentIds.length === 0) return {}

    try {
      const { data: countsData, error: countsError } = await supabase
        .from('reactions')
        .select('parent_id, type')
        .eq('parent_type', parentType)
        .in('parent_id', parentIds)

      if (countsError) throw countsError

      // 2. Get user's own reactions
      let userReactions: Record<string, ReactionType> = {}
      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('reactions')
          .select('parent_id, type')
          .eq('parent_type', parentType)
          .eq('user_id', user.id)
          .in('parent_id', parentIds)

        if (userError) throw userError
        userData?.forEach(r => {
          userReactions[r.parent_id] = r.type as ReactionType
        })
      }

      // Aggregate counts
      const reactionMap: Record<string, { counts: ReactionCounts, userReaction: ReactionType | null }> = {}
      
      parentIds.forEach(id => {
        reactionMap[id] = {
          counts: { like: 0, love: 0, angry: 0, fix_it: 0 },
          userReaction: userReactions[id] || null
        }
      })

      countsData?.forEach(r => {
        if (reactionMap[r.parent_id]) {
          const type = r.type as ReactionType
          if (reactionMap[r.parent_id].counts[type] !== undefined) {
            reactionMap[r.parent_id].counts[type]++
          }
        }
      })

      return reactionMap
    } catch (err) {
      console.error('Error fetching reactions:', err)
      return {}
    }
  }, [user])

  /**
   * Toggles a reaction on a post, comment, or issue.
   */
  const toggleReaction = async (parentId: string, type: ReactionType, parentType: 'post' | 'comment' | 'issue' = 'post') => {
    if (!user) throw new Error('Must be logged in to react')
    
    setLoading(true)
    try {
      // Check existing
      const { data: existing, error: checkError } = await supabase
        .from('reactions')
        .select('*')
        .eq('parent_type', parentType)
        .eq('parent_id', parentId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (checkError) throw checkError

      if (existing) {
        if (existing.type === type) {
          // Remove same reaction
          await supabase
            .from('reactions')
            .delete()
            .eq('id', existing.id)
        } else {
          // Update to new reaction type
          await supabase
            .from('reactions')
            .update({ type })
            .eq('id', existing.id)
        }
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('reactions')
          .insert({
            user_id: user.id,
            parent_type: parentType,
            parent_id: parentId,
            type
          })
        
        if (insertError) throw insertError

        // Send notification to author
        if (parentType === 'post') {
          const { data: postData } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', parentId)
            .single()
          
          if (postData && postData.user_id !== user.id) {
            await sendNotification(postData.user_id, 'post_liked', {
              post_id: parentId,
              reaction_type: type
            })
          }
        } else if (parentType === 'issue') {
          const { data: issueData } = await supabase
            .from('issues')
            .select('user_id')
            .eq('id', parentId)
            .single()
          
          if (issueData && issueData.user_id !== user.id) {
            await sendNotification(issueData.user_id, 'issue_liked', {
              issue_id: parentId,
              reaction_type: type
            })
          }
        } else {
          const { data: commentData } = await supabase
            .from('comments')
            .select('user_id, post_id')
            .eq('id', parentId)
            .single()
          
          if (commentData && commentData.user_id !== user.id) {
            await sendNotification(commentData.user_id, 'comment_liked', {
              post_id: commentData.post_id,
              comment_id: parentId,
              reaction_type: type
            })
          }
        }
      }
    } catch (err) {
      console.error('Toggle reaction error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { getReactionsForParents, toggleReaction, loading }
}

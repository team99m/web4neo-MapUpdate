'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/core/supabase/client'
import { useAuth } from '@/core/auth/useAuth'
import { useNotification } from './useNotification'

export function useFollow(targetUserId?: string) {
  const { user } = useAuth()
  const { sendNotification } = useNotification()
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchStats = useCallback(async (uid: string) => {
    try {
      // Get counts
      const [followers, following] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', uid),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', uid)
      ])

      setFollowerCount(followers.count || 0)
      setFollowingCount(following.count || 0)

      // Check if current user follows this person
      if (user && user.id !== uid) {
        const { data } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', uid)
          .maybeSingle()
        
        setIsFollowing(!!data)
      }
    } catch (err) {
      console.error('Error fetching follow stats:', err)
    }
  }, [user])

  useEffect(() => {
    if (targetUserId) {
      fetchStats(targetUserId)
    }
  }, [targetUserId, fetchStats])

  const toggleFollow = async () => {
    if (!user || !targetUserId) return
    if (user.id === targetUserId) return

    setLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
        
        setIsFollowing(false)
        setFollowerCount(prev => Math.max(0, prev - 1))
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          })
        
        setIsFollowing(true)
        setFollowerCount(prev => prev + 1)

        // Send notification
        await sendNotification(targetUserId, 'new_follower', {})
      }
    } catch (err) {
      console.error('Error toggling follow:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getFollowingList = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', uid)
      
      if (error) throw error
      return data.map(f => f.following_id)
    } catch (err) {
      console.error('Error fetching following list:', err)
      return []
    }
  }

  return { 
    isFollowing, 
    followerCount, 
    followingCount, 
    toggleFollow, 
    loading,
    refreshStats: () => targetUserId && fetchStats(targetUserId),
    getFollowingList
  }
}

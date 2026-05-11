'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/core/supabase/client'
import { useAuth } from '@/core/auth/useAuth'

export type NotificationType = 'post_liked' | 'post_commented' | 'comment_replied' | 'new_follower' | 'post_mentioned' | 'comment_liked' | 'issue_liked'

export function useNotification() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Supabase Notifications Error:', {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details
        })
        throw error
      }
      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    } catch (err) {
      console.error('Error fetching notifications:', JSON.stringify(err, null, 2))
    } finally {
      setLoading(false)
    }
  }, [user])

  const markAllRead = async () => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Error marking notifications as read:', err)
    }
  }

  const sendNotification = async (targetUserId: string, type: NotificationType, payload: any) => {
    if (!user || user.id === targetUserId) return
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: targetUserId,
        type,
        payload: {
          ...payload,
          actor_id: user.id,
          actor_name: user.display_name || user.username,
          actor_username: user.username,
          actor_avatar: user.avatar_url
        }
      })
      if (error) throw error
    } catch (err) {
      console.error('Error sending notification:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Subscribe to new notifications
    if (user) {
      // Use an anonymous channel to avoid conflicts between multiple hook instances
      const channel = supabase.channel(`notif-${user.id}-${Math.random().toString(36).substring(7)}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications(prev => [payload.new, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, fetchNotifications])

  return { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAllRead, 
    sendNotification 
  }
}

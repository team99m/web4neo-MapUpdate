'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/core/supabase/client'
import { useAuth } from '@/core/auth/useAuth'
import type { Issue } from '@/core/supabase/types'
import type { IssueCategory, IssueStatus } from '@/core/types/issue'

export interface IssueFilter {
  category: IssueCategory | 'all'
  status: IssueStatus | 'all'
}

/**
 * useIssues — Hook for managing and fetching civic issues.
 * Optimized to avoid N+1 queries by fetching counts efficiently.
 */
export function useIssues(initialFilter: IssueFilter = { category: 'all', status: 'all' }) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [filter, setFilterState] = useState<IssueFilter>(initialFilter)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const { user } = useAuth()

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch issues with profile data
      const { data, error: fetchError } = await (supabase
        .from('issues')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url,
            role,
            department
          )
        `) as any)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const rawIssues = (data || []) as any[]
      if (rawIssues.length === 0) {
        setIssues([])
        return
      }

      const issueIds = rawIssues.map(i => i.id)

      // Optimized count fetching
      const [commentsRes, reactionsRes, userReactionsRes] = await Promise.all([
        supabase
          .from('comments')
          .select('parent_id')
          .eq('parent_type', 'issue')
          .in('parent_id', issueIds),
        supabase
          .from('reactions')
          .select('parent_id, type')
          .eq('parent_type', 'issue')
          .in('parent_id', issueIds),
        user ? supabase
          .from('reactions')
          .select('parent_id, type')
          .eq('parent_type', 'issue')
          .eq('user_id', user.id)
          .in('parent_id', issueIds) : Promise.resolve({ data: [] })
      ])

      // Map counts
      const commentCountMap = (commentsRes.data || []).reduce((acc: any, curr: any) => {
        acc[curr.parent_id] = (acc[curr.parent_id] || 0) + 1
        return acc
      }, {})

      const likeCountMap = (reactionsRes.data || []).reduce((acc: any, curr: any) => {
        if (curr.type === 'like') {
          acc[curr.parent_id] = (acc[curr.parent_id] || 0) + 1
        }
        return acc
      }, {})

      const userReactionMap = (userReactionsRes.data || []).reduce((acc: any, curr: any) => {
        acc[curr.parent_id] = curr.type
        return acc
      }, {})

      // Merge counts into issues
      const formattedIssues = rawIssues.map(issue => ({
        ...issue,
        comment_count: commentCountMap[issue.id] || 0,
        like_count: likeCountMap[issue.id] || 0,
        user_reaction: userReactionMap[issue.id] || null
      }))

      setIssues(formattedIssues)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch issues'
      setError(message)
      console.error('Fetch issues error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchIssues()
    }
  }, [fetchIssues])

  // Filter issues
  const filteredIssues = issues.filter((issue: any) => {
    if (filter.category !== 'all' && issue.category !== filter.category) return false
    if (filter.status !== 'all' && issue.status !== filter.status) return false
    return true
  })

  const setCategory = (c: IssueCategory | 'all') => setFilterState(prev => ({ ...prev, category: c }))
  const setStatus = (s: IssueStatus | 'all') => setFilterState(prev => ({ ...prev, status: s }))

  return {
    issues: filteredIssues,
    allIssues: issues,
    filter,
    loading,
    error,
    setCategory,
    setStatus,
    refetch: fetchIssues,
  }
}

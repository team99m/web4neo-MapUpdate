'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/core/supabase/client'
import type { Issue, IssueFilter, IssueCategory, IssueStatus } from '../types'

/**
 * issueStore — external store for Module 1.3 interop.
 * Holds the canonical issues list and filter state.
 */
let _issues: Issue[] = []
let _filter: IssueFilter = { category: 'all', status: 'all' }
let _listeners: Set<() => void> = new Set()

function notify() {
  _listeners.forEach((l) => l())
}

export const issueStore = {
  /** Get all loaded issues */
  getIssues: () => _issues,

  /** Get filtered issues */
  list: (filter?: IssueFilter): Issue[] => {
    const f = filter || _filter
    return _issues.filter((issue) => {
      if (f.category !== 'all' && issue.category !== f.category) return false
      if (f.status !== 'all' && issue.status !== f.status) return false
      return true
    })
  },

  /** Get current filter */
  getFilter: () => _filter,

  /** Set filter */
  setFilter: (filter: Partial<IssueFilter>) => {
    _filter = { ..._filter, ...filter }
    notify()
  },

  /** Set issues (called after fetch) */
  setIssues: (issues: Issue[]) => {
    _issues = issues
    notify()
  },

  /** Update a single issue in the store */
  updateIssue: (updated: Partial<Issue> & { id: string }) => {
    _issues = _issues.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
    notify()
  },

  /** Add an issue */
  addIssue: (issue: Issue) => {
    _issues = [issue, ..._issues]
    notify()
  },

  /** Subscribe to changes */
  subscribe: (listener: () => void) => {
    _listeners.add(listener)
    return () => {
      _listeners.delete(listener)
    }
  },

  /** Get snapshot (for useSyncExternalStore) */
  getSnapshot: () => _issues,
}

/**
 * useIssues — React hook for consuming the issue store.
 * Fetches issues from Supabase on mount, provides filtered list.
 */
export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [filter, setFilterState] = useState<IssueFilter>(_filter)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  // Fetch all issues from Supabase
  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
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
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const issuesWithCounts = (data || []) as Issue[]

      // Fetch comment counts
      for (const issue of issuesWithCounts) {
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('parent_type', 'issue')
          .eq('parent_id', issue.id)

        issue.comment_count = count || 0

        const { count: likeCount } = await supabase
          .from('reactions')
          .select('*', { count: 'exact', head: true })
          .eq('parent_type', 'issue')
          .eq('parent_id', issue.id)
          .eq('type', 'like')

        issue.like_count = likeCount || 0
      }

      issueStore.setIssues(issuesWithCounts)
      setIssues(issuesWithCounts)
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

  // Listen to store changes
  useEffect(() => {
    return issueStore.subscribe(() => {
      setIssues([...issueStore.getIssues()])
      setFilterState({ ...issueStore.getFilter() })
    })
  }, [])

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    if (filter.category !== 'all' && issue.category !== filter.category) return false
    if (filter.status !== 'all' && issue.status !== filter.status) return false
    return true
  })

  const setFilter = useCallback((f: Partial<IssueFilter>) => {
    issueStore.setFilter(f)
  }, [])

  const setCategory = useCallback((c: IssueCategory | 'all') => {
    issueStore.setFilter({ category: c })
  }, [])

  const setStatus = useCallback((s: IssueStatus | 'all') => {
    issueStore.setFilter({ status: s })
  }, [])

  return {
    issues: filteredIssues,
    allIssues: issues,
    filter,
    loading,
    error,
    setFilter,
    setCategory,
    setStatus,
    refetch: fetchIssues,
  }
}

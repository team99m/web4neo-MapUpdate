'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/core/auth/AuthGuard'
import { supabase } from '@/core/supabase/client'
import type { Profile } from '@/core/supabase/types'
import { Button } from '@/core/components/Button'
import { Spinner } from '@/core/components/Spinner'
import { useToast } from '@/app/providers'
import { Avatar } from '@/core/components/Avatar'
import Link from 'next/link'
import styles from './page.module.css'

export default function AdminUsersPage() {
  const addToast = useToast()
  
  const [users, setUsers] = useState<(Profile & { post_count?: number, comment_count?: number, issue_count?: number })[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const profiles = data as Profile[]

      // Fetch activity counts
      const [postsRes, commentsRes, issuesRes] = await Promise.all([
        supabase.from('posts').select('user_id'),
        supabase.from('comments').select('user_id'),
        supabase.from('issues').select('user_id')
      ])

      const postCounts = (postsRes.data || []).reduce((acc: any, curr: any) => {
        acc[curr.user_id] = (acc[curr.user_id] || 0) + 1
        return acc
      }, {})

      const commentCounts = (commentsRes.data || []).reduce((acc: any, curr: any) => {
        acc[curr.user_id] = (acc[curr.user_id] || 0) + 1
        return acc
      }, {})

      const issueCounts = (issuesRes.data || []).reduce((acc: any, curr: any) => {
        acc[curr.user_id] = (acc[curr.user_id] || 0) + 1
        return acc
      }, {})

      const usersWithStats = profiles.map(u => ({
        ...u,
        post_count: postCounts[u.id] || 0,
        comment_count: commentCounts[u.id] || 0,
        issue_count: issueCounts[u.id] || 0
      }))

      setUsers(usersWithStats)
    } catch (err) {
      console.error(err)
      addToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      addToast('Role updated successfully', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to update role', 'error')
      fetchUsers() // revert
    }
  }

  const handleUpdateDepartment = async (userId: string, newDept: string) => {
    try {
      const deptValue = newDept.trim() === '' ? null : newDept.trim()
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, department: deptValue } : u))
      
      const { error } = await supabase
        .from('profiles')
        .update({ department: deptValue })
        .eq('id', userId)

      if (error) throw error
      addToast('Department updated successfully', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to update department', 'error')
      fetchUsers() // revert
    }
  }

  const handleUpdateRank = async (userId: string, newRank: string) => {
    try {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, rank: newRank } : u))
      
      const { error } = await supabase
        .from('profiles')
        .update({ rank: newRank })
        .eq('id', userId)

      if (error) throw error
      addToast('Rank updated successfully', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to update rank', 'error')
      fetchUsers() // revert
    }
  }

  const handleToggleBan = async (user: Profile) => {
    try {
      const newStatus = !user.is_banned
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: newStatus } : u))
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: newStatus })
        .eq('id', user.id)

      if (error) throw error
      addToast(newStatus ? 'User banned' : 'User unbanned', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to update ban status', 'error')
      fetchUsers()
    }
  }

  const handleDeleteAccount = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this account? This will remove the profile permanently.')) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      setUsers(prev => prev.filter(u => u.id !== userId))
      addToast('Account deleted', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to delete account', 'error')
    }
  }

  const filteredUsers = users.filter(u => 
    (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  return (
    <AuthGuard requiredRole={['admin', 'staff']} allowUsername="admin">
      <div className="page-container">
        <div className={styles.header}>
          <h1 className={styles.title}>Account Management</h1>
          <div className={styles.headerActions}>
            <input 
              type="text" 
              placeholder="Search by email, username..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="secondary" onClick={fetchUsers} size="sm">Refresh</Button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <Spinner size="lg" />
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                   <th>User</th>
                   <th>Email</th>
                   <th>Role</th>
                   <th>Rank</th>
                   <th>Department</th>
                   <th>Activity</th>
                   <th>Actions</th>
                 </tr>
              </thead>
              <tbody>
                 {filteredUsers.map(user => (
                   <tr key={user.id}>
                     <td>
                       <div className={styles.userCell}>
                         <Avatar size="sm" src={user.avatar_url} fallback={user.username || '?'} />
                         <div className={styles.userInfo}>
                           <div className={styles.userNameRow}>
                             <span className={styles.userName}>{user.display_name || user.username}</span>
                             {user.is_banned && <span className={styles.bannedBadge}>Banned</span>}
                           </div>
                           <span className={styles.userHandle}>@{user.username}</span>
                         </div>
                       </div>
                     </td>
                     <td><span className={styles.emailText}>{user.email || 'No email'}</span></td>
                     <td>
                       <select
                         className={styles.select}
                         value={user.role}
                         onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                       >
                         <option value="citizen">Citizen</option>
                         <option value="staff">Staff</option>
                         <option value="admin">Admin</option>
                       </select>
                     </td>
                     <td>
                       <select
                         className={styles.select}
                         value={user.rank || 'Bronze'}
                         onChange={(e) => handleUpdateRank(user.id, e.target.value)}
                       >
                         <option value="Bronze">🥉 Bronze</option>
                         <option value="Silver">🥈 Silver</option>
                         <option value="Gold">🥇 Gold</option>
                         <option value="Platinum">💎 Platinum</option>
                         <option value="Diamond">👑 Diamond</option>
                       </select>
                     </td>
                     <td>
                       <input
                         type="text"
                         className={styles.input}
                         placeholder="e.g. Public Works"
                         disabled={user.role === 'citizen'}
                         value={user.department || ''}
                         onChange={(e) => {
                           // Update local state smoothly
                           setUsers(prev => prev.map(u => u.id === user.id ? { ...u, department: e.target.value } : u))
                         }}
                         onBlur={(e) => handleUpdateDepartment(user.id, e.target.value)}
                       />
                     </td>
                     <td>
                       <div className={styles.actionGroup}>
                         <Button 
                           variant="secondary" 
                           size="sm" 
                           onClick={() => handleToggleBan(user)}
                         >
                           {user.is_banned ? '🛡️ Unban' : '🚫 Ban'}
                         </Button>
                         <Button 
                           variant="danger" 
                           size="sm" 
                           onClick={() => handleDeleteAccount(user.id)}
                         >
                           🗑️ Delete
                         </Button>
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}

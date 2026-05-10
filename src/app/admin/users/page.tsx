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
  
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setUsers(data as Profile[])
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

  return (
    <AuthGuard requiredRole={['admin']}>
      <div className="page-container">
        <div className={styles.header}>
          <h1 className={styles.title}>User Management</h1>
          <Button variant="secondary" onClick={fetchUsers} size="sm">Refresh List</Button>
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
                  <th>Username</th>
                  <th>Role</th>
                  <th>Department (Staff Only)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <Avatar size="sm" src={user.avatar_url} fallback={user.username || '?'} />
                        <span>{user.display_name || user.username}</span>
                      </div>
                    </td>
                    <td>
                      <Link href={`/profile/${user.username}`} className={styles.link}>
                        @{user.username}
                      </Link>
                    </td>
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
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => alert('Ban user functionality pending backend Edge Function')}
                      >
                        Ban
                      </Button>
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

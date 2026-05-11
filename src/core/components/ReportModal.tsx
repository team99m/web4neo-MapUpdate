'use client'

import { useState } from 'react'
import { Button } from './Button'
import { supabase } from '@/core/supabase/client'
import { useAuth } from '@/core/auth/useAuth'
import { useToast } from '@/app/providers'
import styles from './ReportModal.module.css'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: 'post' | 'comment'
  targetId: string
}

const REASONS = [
  'Spam or misleading',
  'Offensive or hateful content',
  'Misinformation',
  'Harassment',
  'Inappropriate media',
  'Other'
]

export function ReportModal({ isOpen, onClose, targetType, targetId }: ReportModalProps) {
  const { user } = useAuth()
  const addToast = useToast()
  const [reason, setReason] = useState(REASONS[0])
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason
      })

      if (error) throw error

      addToast('Report submitted for review', 'success')
      onClose()
    } catch (err) {
      console.error('Error submitting report:', err)
      addToast('Failed to submit report', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Report {targetType}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.content}>
          <p className={styles.hint}>Why are you reporting this?</p>
          <div className={styles.reasonList}>
            {REASONS.map(r => (
              <label key={r} className={styles.reasonItem}>
                <input 
                  type="radio" 
                  name="reportReason" 
                  value={r} 
                  checked={reason === r} 
                  onChange={() => setReason(r)}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} loading={loading}>
            Submit Report
          </Button>
        </div>
      </div>
    </div>
  )
}

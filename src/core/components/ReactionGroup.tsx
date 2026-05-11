'use client'

import { cn } from '@/core/utils/cn'
import styles from './ReactionGroup.module.css'

export type ReactionType = 'like' | 'love' | 'angry' | 'fix_it'

export interface ReactionCounts {
  like: number
  love: number
  angry: number
  fix_it: number
}

interface ReactionGroupProps {
  counts: ReactionCounts
  userReaction?: ReactionType | null
  onReact: (type: ReactionType) => void
  className?: string
  disabled?: boolean
}

const REACTION_CONFIG: Record<ReactionType, { emoji: string; label: string }> = {
  like: { emoji: '👍', label: 'Like' },
  love: { emoji: '❤️', label: 'Love' },
  angry: { emoji: '😠', label: 'Angry' },
  fix_it: { emoji: '🛠️', label: 'Fix it' },
}

export function ReactionGroup({
  counts,
  userReaction,
  onReact,
  className,
  disabled = false,
}: ReactionGroupProps) {
  // Only show reactions that have counts > 0, plus the 'like' and 'fix_it' buttons always as defaults if empty
  const activeReactions = (Object.keys(REACTION_CONFIG) as ReactionType[]).filter(
    (type) => counts[type] > 0 || type === 'like' || type === 'fix_it' || userReaction === type
  )

  return (
    <div className={cn(styles.group, className)}>
      {activeReactions.map((type) => (
        <button
          key={type}
          type="button"
          className={cn(styles.reactionBtn, userReaction === type && styles.active)}
          onClick={(e) => { e.preventDefault(); onReact(type); }}
          disabled={disabled}
          title={REACTION_CONFIG[type].label}
          aria-label={`${REACTION_CONFIG[type].label} reaction`}
        >
          <div className={styles.iconWrap}>
            <span className={styles.emoji}>{REACTION_CONFIG[type].emoji}</span>
          </div>
          {counts[type] > 0 && <span>{counts[type]}</span>}
        </button>
      ))}
    </div>
  )
}

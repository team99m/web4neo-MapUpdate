/**
 * Module 1.1 — Domain Types
 * Aligned with WDD-Module-1.1 spec and Supabase schema.
 */

export type IssueCategory = 'road' | 'flood' | 'light' | 'trash' | 'noise' | 'other'
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'rejected'

/** Category display configuration */
export const CATEGORY_CONFIG: Record<IssueCategory, { label: string; emoji: string }> = {
  road: { label: 'Road', emoji: '🛣️' },
  flood: { label: 'Flood', emoji: '🌊' },
  light: { label: 'Light', emoji: '💡' },
  trash: { label: 'Trash', emoji: '🗑️' },
  noise: { label: 'Noise', emoji: '🔊' },
  other: { label: 'Other', emoji: '📋' },
}

/** Status display configuration */
export const STATUS_CONFIG: Record<IssueStatus, { label: string; color: string; icon: string }> = {
  open: { label: 'Open', color: '#E24B4A', icon: '!' },
  in_progress: { label: 'In Progress', color: '#EF9F27', icon: '⟳' },
  resolved: { label: 'Resolved', color: '#1D9E75', icon: '✓' },
  rejected: { label: 'Rejected', color: '#888780', icon: '×' },
}

/** Report wizard step */
export type ReportStep = 'location' | 'category' | 'details' | 'review'

/**
 * Module 1.1 — Domain Types
 * Issue, IssueFilter, Comment, Review types
 * Aligned with WDD-Module-1.1 spec and Supabase schema.
 */

export type IssueCategory = 'road' | 'flood' | 'light' | 'trash' | 'noise' | 'other'
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'rejected'

export interface Issue {
  id: string
  user_id: string
  title: string
  description: string | null
  category: IssueCategory
  status: IssueStatus
  lat: number
  lng: number
  address: string | null
  department: string | null
  images: string[]
  created_at: string
  updated_at: string
  /** Joined profile data (optional, from query) */
  profiles?: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    role: string
    department: string | null
  }
  /** Aggregated counts (optional, from query) */
  like_count?: number
  comment_count?: number
}

export interface IssueFilter {
  category: IssueCategory | 'all'
  status: IssueStatus | 'all'
}

export interface Comment {
  id: string
  user_id: string
  parent_type: 'issue' | 'post'
  parent_id: string
  content: string
  created_at: string
  /** Joined profile data */
  profiles?: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

export interface Review {
  id: string
  issue_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  /** Joined profile data */
  profiles?: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

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

/** Report wizard draft data */
export interface ReportDraft {
  lat: number | null
  lng: number | null
  address: string
  category: IssueCategory | null
  title: string
  description: string
  photos: File[]
  photoPreviewUrls: string[]
}

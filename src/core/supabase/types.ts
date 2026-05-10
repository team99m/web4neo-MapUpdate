/**
 * Supabase Database Types — mirrors WDD §6 schema.
 *
 * This file defines the TypeScript types for all tables.
 * In production, auto-generate this from Supabase CLI:
 *   npx supabase gen types typescript --project-id <id> > types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          role: string
          department: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string
          department?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string
          department?: string | null
          created_at?: string
        }
        Relationships: []
      }
      issues: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string
          status: string
          lat: number
          lng: number
          address: string | null
          department: string | null
          images: string[]
          reject_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: string
          status?: string
          lat: number
          lng: number
          address?: string | null
          department?: string | null
          images?: string[]
          reject_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          status?: string
          lat?: number
          lng?: number
          address?: string | null
          department?: string | null
          images?: string[]
          reject_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          user_id: string
          issue_id: string | null
          content: string
          images: string[]
          category: string | null
          visibility: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          issue_id?: string | null
          content: string
          images?: string[]
          category?: string | null
          visibility?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          issue_id?: string | null
          content?: string
          images?: string[]
          category?: string | null
          visibility?: string
          created_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          user_id: string
          parent_type: string
          parent_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parent_type: string
          parent_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          parent_type?: string
          parent_id?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          id: string
          user_id: string
          parent_type: string
          parent_id: string
          type: string
        }
        Insert: {
          id?: string
          user_id: string
          parent_type: string
          parent_id: string
          type: string
        }
        Update: {
          id?: string
          user_id?: string
          parent_type?: string
          parent_id?: string
          type?: string
        }
        Relationships: []
      }
      transit_routes: {
        Row: {
          id: string
          name: string
          type: string
          color: string | null
          polyline: Json | null
          active: boolean
        }
        Insert: {
          id?: string
          name: string
          type: string
          color?: string | null
          polyline?: Json | null
          active?: boolean
        }
        Update: {
          id?: string
          name?: string
          type?: string
          color?: string | null
          polyline?: Json | null
          active?: boolean
        }
        Relationships: []
      }
      transit_stops: {
        Row: {
          id: string
          route_id: string
          name: string
          lat: number
          lng: number
          sequence: number
        }
        Insert: {
          id?: string
          route_id: string
          name: string
          lat: number
          lng: number
          sequence: number
        }
        Update: {
          id?: string
          route_id?: string
          name?: string
          lat?: number
          lng?: number
          sequence?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string | null
          payload: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: string | null
          payload?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string | null
          payload?: Json | null
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      issue_timeline: {
        Row: {
          id: string
          issue_id: string
          status: string
          changed_by: string | null
          changed_at: string
          note: string | null
        }
        Insert: {
          id?: string
          issue_id: string
          status: string
          changed_by?: string | null
          changed_at?: string
          note?: string | null
        }
        Update: {
          id?: string
          issue_id?: string
          status?: string
          changed_by?: string | null
          changed_at?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_timeline_changed_by_fkey"
            columns: ["changed_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_timeline_issue_id_fkey"
            columns: ["issue_id"]
            referencedRelation: "issues"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// --- Convenience Row Types (used throughout the app) ---

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Issue = Database['public']['Tables']['issues']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Reaction = Database['public']['Tables']['reactions']['Row']
export type TransitRoute = Database['public']['Tables']['transit_routes']['Row']
export type TransitStop = Database['public']['Tables']['transit_stops']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type IssueTimeline = Database['public']['Tables']['issue_timeline']['Row']

// --- Domain Enums (for app-level type safety) ---

export type IssueCategory = 'road' | 'flood' | 'light' | 'trash' | 'noise' | 'other'
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'rejected'
export type TransitType = 'bus' | 'bts' | 'mrt' | 'boat' | 'arl'
export type UserRole = 'citizen' | 'staff' | 'admin'

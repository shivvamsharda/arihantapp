export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          role: 'admin' | 'staff' | 'viewer'
          display_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          role: 'admin' | 'staff' | 'viewer'
          display_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          role?: 'admin' | 'staff' | 'viewer'
          display_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          sku: string
          name: string
          category: string
          unit: string
          current_qty: number
          min_threshold: number
          location: string | null
          status: 'active' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          name: string
          category: string
          unit: string
          current_qty?: number
          min_threshold?: number
          location?: string | null
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          category?: string
          unit?: string
          current_qty?: number
          min_threshold?: number
          location?: string | null
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      movements: {
        Row: {
          id: string
          item_id: string
          type: 'in' | 'out' | 'adjust'
          delta: number
          reason: string
          ref_doc: string | null
          user_id: string
          customer_id: string | null
          delivery_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          type: 'in' | 'out' | 'adjust'
          delta: number
          reason: string
          ref_doc?: string | null
          user_id: string
          customer_id?: string | null
          delivery_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          type?: 'in' | 'out' | 'adjust'
          delta?: number
          reason?: string
          ref_doc?: string | null
          user_id?: string
          customer_id?: string | null
          delivery_note?: string | null
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      user_invitations: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'staff' | 'viewer'
          invited_by: string
          status: 'pending' | 'accepted' | 'expired' | 'revoked'
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'admin' | 'staff' | 'viewer'
          invited_by: string
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'staff' | 'viewer'
          invited_by?: string
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          created_at?: string
          expires_at?: string
        }
      }
      alert_log: {
        Row: {
          id: string
          item_id: string
          alert_type: 'instant' | 'digest'
          sent_via: string
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          alert_type: 'instant' | 'digest'
          sent_via: string
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          alert_type?: 'instant' | 'digest'
          sent_via?: string
          created_at?: string
        }
      }
    }
  }
}

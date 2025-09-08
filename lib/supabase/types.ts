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
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          owner_id: string
          name: string
          plan: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          plan?: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          plan?: string
          created_at?: string
        }
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          workspace_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          workspace_id: string
          title: string
          byte_size: number
          page_count: number
          sha256: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          byte_size: number
          page_count: number
          sha256?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          title?: string
          byte_size?: number
          page_count?: number
          sha256?: string | null
          status?: string
          created_at?: string
        }
      }
      pages: {
        Row: {
          id: string
          document_id: string
          page_number: number
          image_url: string | null
          text: string | null
          tokens: number | null
          fingerprint64: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          page_number: number
          image_url?: string | null
          text?: string | null
          tokens?: number | null
          fingerprint64?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          page_number?: number
          image_url?: string | null
          text?: string | null
          tokens?: number | null
          fingerprint64?: string | null
          created_at?: string
        }
      }
      chunks: {
        Row: {
          id: string
          page_id: string
          seq: number
          text: string
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          page_id: string
          seq: number
          text: string
          embedding?: number[] | null
          created_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          seq?: number
          text?: string
          embedding?: number[] | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          workspace_id: string
          user_id: string | null
          role: string
          content: Json
          token_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id?: string | null
          role: string
          content: Json
          token_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string | null
          role?: string
          content?: Json
          token_count?: number | null
          created_at?: string
        }
      }
      usage_daily: {
        Row: {
          yyyymmdd: string
          user_id: string
          api_calls: number
          tokens_in: number
          tokens_out: number
          created_at: string
        }
        Insert: {
          yyyymmdd: string
          user_id: string
          api_calls?: number
          tokens_in?: number
          tokens_out?: number
          created_at?: string
        }
        Update: {
          yyyymmdd?: string
          user_id?: string
          api_calls?: number
          tokens_in?: number
          tokens_out?: number
          created_at?: string
        }
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

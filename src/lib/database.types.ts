export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          cover_url: string | null
          bio: string | null
          gender: string | null
          date_of_birth: string | null
          country: string | null
          city: string | null
          occupation: string | null
          education: string | null
          relationship_goal: string | null
          interests: string[] | null
          is_verified: boolean
          is_online: boolean
          last_seen: string | null
          subscription_tier: 'free' | 'premium' | 'vip'
          role: 'user' | 'admin' | 'ceo'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      likes: {
        Row: {
          id: string
          liker_id: string
          liked_id: string
          is_super_like: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['likes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['likes']['Insert']>
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['matches']['Insert']>
      }
      messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'image' | 'video' | 'voice' | 'gif'
          media_url: string | null
          is_read: boolean
          reactions: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      group_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          avatar_url: string | null
          is_public: boolean
          owner_id: string
          member_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['group_rooms']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['group_rooms']['Insert']>
      }
      group_messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'image' | 'video' | 'voice'
          media_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['group_messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['group_messages']['Insert']>
      }
      posts: {
        Row: {
          id: string
          author_id: string
          content: string | null
          media_urls: string[] | null
          post_type: 'text' | 'photo' | 'video'
          likes_count: number
          comments_count: number
          shares_count: number
          is_public: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          likes_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'match' | 'like' | 'message' | 'comment' | 'follow' | 'system'
          title: string
          body: string
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type GroupRoom = Database['public']['Tables']['group_rooms']['Row']

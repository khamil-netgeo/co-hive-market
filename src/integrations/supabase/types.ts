export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          note: string
        }
        Insert: {
          created_at?: string
          created_by: string
          entity_id: string
          entity_type: string
          id?: string
          note: string
        }
        Update: {
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          note?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          publish_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          publish_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          publish_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      buyer_service_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
          vendor_service_plan_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
          vendor_service_plan_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
          vendor_service_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_service_subscriptions_vendor_service_plan_id_fkey"
            columns: ["vendor_service_plan_id"]
            isOneToOne: false
            referencedRelation: "vendor_service_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          unit_price_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          unit_price_cents: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          unit_price_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_snapshots: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          items: Json
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          items: Json
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          items?: Json
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_templates: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          message: string
          role: string
          template_key: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          role: string
          template_key: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          role?: string
          template_key?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string | null
          created_at: string
          file_url: string | null
          id: string
          message_type: string
          sender_user_id: string
          thread_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          message_type?: string
          sender_user_id: string
          thread_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          message_type?: string
          sender_user_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          created_at: string
          id: string
          thread_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          thread_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          thread_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_read_states: {
        Row: {
          created_at: string
          last_read_at: string
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_read_at?: string
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_read_at?: string
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          buyer_user_id: string | null
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          status: string
          subject: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          buyer_user_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          buyer_user_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          community_fee_percent: number
          coop_fee_percent: number
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          join_mode: Database["public"]["Enums"]["community_join_mode"]
          logo_url: string | null
          member_discount_percent: number
          membership_fee_cents: number
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          community_fee_percent?: number
          coop_fee_percent?: number
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          join_mode?: Database["public"]["Enums"]["community_join_mode"]
          logo_url?: string | null
          member_discount_percent?: number
          membership_fee_cents?: number
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          community_fee_percent?: number
          coop_fee_percent?: number
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          join_mode?: Database["public"]["Enums"]["community_join_mode"]
          logo_url?: string | null
          member_discount_percent?: number
          membership_fee_cents?: number
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      community_event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["event_rsvp_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["event_rsvp_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["event_rsvp_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cer_event_fk"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_events"
            referencedColumns: ["id"]
          },
        ]
      }
      community_events: {
        Row: {
          community_id: string
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          end_at: string | null
          id: string
          is_online: boolean
          location_text: string | null
          start_at: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["community_post_visibility"]
        }
        Insert: {
          community_id: string
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_at?: string | null
          id?: string
          is_online?: boolean
          location_text?: string | null
          start_at: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["community_post_visibility"]
        }
        Update: {
          community_id?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          id?: string
          is_online?: boolean
          location_text?: string | null
          start_at?: string
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["community_post_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "ce_community_fk"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_fund_txns: {
        Row: {
          amount_cents: number
          community_id: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          stripe_session_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          community_id: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          stripe_session_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          community_id?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          stripe_session_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_fund_txns_community_fk"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_join_requests: {
        Row: {
          community_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          message: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cjr_community_fk"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          created_at: string
          id: string
          member_type: Database["public"]["Enums"]["member_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          member_type: Database["public"]["Enums"]["member_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          member_type?: Database["public"]["Enums"]["member_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_membership_payments: {
        Row: {
          amount_cents: number
          community_id: string
          created_at: string
          currency: string
          id: string
          paid_at: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          community_id: string
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          community_id?: string
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_membership_payments_community_fk"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_user_id: string
          body: string | null
          community_id: string
          created_at: string
          id: string
          media_urls: string[] | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["community_post_visibility"]
        }
        Insert: {
          author_user_id: string
          body?: string | null
          community_id: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["community_post_visibility"]
        }
        Update: {
          author_user_id?: string
          body?: string | null
          community_id?: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["community_post_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "cp_community_fk"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_by: string
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_by: string
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_by?: string
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          assigned_at: string | null
          assignment_expires_at: string | null
          created_at: string
          dropoff_address: string | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          id: string
          notes: string | null
          order_id: string
          pickup_address: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          rider_rating: number | null
          rider_user_id: string | null
          scheduled_dropoff_at: string | null
          scheduled_pickup_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assignment_expires_at?: string | null
          created_at?: string
          dropoff_address?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          id?: string
          notes?: string | null
          order_id: string
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          rider_rating?: number | null
          rider_user_id?: string | null
          scheduled_dropoff_at?: string | null
          scheduled_pickup_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assignment_expires_at?: string | null
          created_at?: string
          dropoff_address?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          rider_rating?: number | null
          rider_user_id?: string | null
          scheduled_dropoff_at?: string | null
          scheduled_pickup_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_assignments: {
        Row: {
          created_at: string
          delivery_id: string
          expires_at: string
          id: string
          notified_at: string
          responded_at: string | null
          rider_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          delivery_id: string
          expires_at?: string
          id?: string
          notified_at?: string
          responded_at?: string | null
          rider_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          delivery_id?: string
          expires_at?: string
          id?: string
          notified_at?: string
          responded_at?: string | null
          rider_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_etas: {
        Row: {
          created_at: string
          delivery_id: string | null
          distance_to_delivery_km: number | null
          distance_to_pickup_km: number | null
          estimated_delivery_at: string | null
          estimated_pickup_at: string | null
          id: string
          order_id: string
          rider_user_id: string
          traffic_factor: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_id?: string | null
          distance_to_delivery_km?: number | null
          distance_to_pickup_km?: number | null
          estimated_delivery_at?: string | null
          estimated_pickup_at?: string | null
          id?: string
          order_id: string
          rider_user_id: string
          traffic_factor?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_id?: string | null
          distance_to_delivery_km?: number | null
          distance_to_pickup_km?: number | null
          estimated_delivery_at?: string | null
          estimated_pickup_at?: string | null
          id?: string
          order_id?: string
          rider_user_id?: string
          traffic_factor?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          audience: string | null
          created_at: string
          created_by: string | null
          description: string | null
          enabled: boolean
          id: string
          key: string
          rollout_percentage: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          audience?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          rollout_percentage?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          audience?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          rollout_percentage?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      feed_like_summary: {
        Row: {
          like_count: number
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
        }
        Insert: {
          like_count?: number
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
        }
        Update: {
          like_count?: number
          target_id?: string
          target_type?: Database["public"]["Enums"]["review_target"]
        }
        Relationships: []
      }
      feed_likes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["review_target"]
          user_id?: string
        }
        Relationships: []
      }
      feed_watch_events: {
        Row: {
          community_id: string | null
          created_at: string
          id: string
          session_id: string
          source: string
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
          user_id: string | null
          vendor_id: string | null
          watched_ms: number
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          id?: string
          session_id: string
          source?: string
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
          user_id?: string | null
          vendor_id?: string | null
          watched_ms: number
        }
        Update: {
          community_id?: string | null
          created_at?: string
          id?: string
          session_id?: string
          source?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["review_target"]
          user_id?: string | null
          vendor_id?: string | null
          watched_ms?: number
        }
        Relationships: []
      }
      kyc_profiles: {
        Row: {
          back_id_path: string | null
          created_at: string
          front_id_path: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_path: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          back_id_path?: string | null
          created_at?: string
          front_id_path?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          back_id_path?: string | null
          created_at?: string
          front_id_path?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kyc_requirement_submissions: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          notes: string | null
          requirement_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          value_text: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          requirement_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          value_text?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          requirement_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_requirement_submissions_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "kyc_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_requirements: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          input_type: string
          key: string
          label: string
          required: boolean
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          input_type?: string
          key: string
          label: string
          required?: boolean
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          input_type?: string
          key?: string
          label?: string
          required?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          back_id_path: string | null
          created_at: string
          front_id_path: string | null
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: string
          selfie_path: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          back_id_path?: string | null
          created_at?: string
          front_id_path?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role: string
          selfie_path?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          back_id_path?: string | null
          created_at?: string
          front_id_path?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string
          selfie_path?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      landing_categories: {
        Row: {
          created_at: string
          description: string
          icon_name: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon_name: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          amount_cents: number
          beneficiary_id: string | null
          beneficiary_type: Database["public"]["Enums"]["beneficiary_type"]
          created_at: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id: string
          notes: string | null
          order_id: string
        }
        Insert: {
          amount_cents: number
          beneficiary_id?: string | null
          beneficiary_type: Database["public"]["Enums"]["beneficiary_type"]
          created_at?: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          notes?: string | null
          order_id: string
        }
        Update: {
          amount_cents?: number
          beneficiary_id?: string | null
          beneficiary_type?: Database["public"]["Enums"]["beneficiary_type"]
          created_at?: string
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          notes?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_channels: {
        Row: {
          channel_type: string
          created_at: string
          id: string
          is_enabled: boolean
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_type: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_type?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_cancel_requests: {
        Row: {
          buyer_user_id: string
          created_at: string
          currency: string | null
          id: string
          order_id: string
          reason: string | null
          refund_amount_cents: number | null
          status: Database["public"]["Enums"]["order_cancel_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          buyer_user_id: string
          created_at?: string
          currency?: string | null
          id?: string
          order_id: string
          reason?: string | null
          refund_amount_cents?: number | null
          status?: Database["public"]["Enums"]["order_cancel_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          buyer_user_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          order_id?: string
          reason?: string | null
          refund_amount_cents?: number | null
          status?: Database["public"]["Enums"]["order_cancel_status"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_cancel_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_cancel_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      order_cancellations: {
        Row: {
          created_at: string
          id: string
          order_id: string
          processed_at: string | null
          reason: string
          refund_amount_cents: number | null
          refund_type: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          processed_at?: string | null
          reason: string
          refund_amount_cents?: number | null
          refund_type?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          processed_at?: string | null
          reason?: string
          refund_amount_cents?: number | null
          refund_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_cancellations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_chats: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_read: boolean
          media_url: string | null
          message_type: string
          metadata: Json | null
          order_id: string
          receiver_user_id: string
          sender_user_id: string
          template_type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          media_url?: string | null
          message_type?: string
          metadata?: Json | null
          order_id: string
          receiver_user_id: string
          sender_user_id: string
          template_type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          media_url?: string | null
          message_type?: string
          metadata?: Json | null
          order_id?: string
          receiver_user_id?: string
          sender_user_id?: string
          template_type?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_modifications: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          created_at: string
          id: string
          modification_type: string
          new_data: Json
          order_id: string
          original_data: Json
          reason: string
          status: string
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          created_at?: string
          id?: string
          modification_type: string
          new_data?: Json
          order_id: string
          original_data?: Json
          reason: string
          status?: string
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          created_at?: string
          id?: string
          modification_type?: string
          new_data?: Json
          order_id?: string
          original_data?: Json
          reason?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_modifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_progress_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event: string
          id: string
          metadata: Json
          order_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event: string
          id?: string
          metadata?: Json
          order_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event?: string
          id?: string
          metadata?: Json
          order_id?: string
        }
        Relationships: []
      }
      order_return_requests: {
        Row: {
          buyer_user_id: string
          created_at: string
          currency: string | null
          id: string
          order_id: string
          order_item_id: string | null
          reason: string | null
          refund_amount_cents: number | null
          resolution: Database["public"]["Enums"]["return_resolution"] | null
          status: Database["public"]["Enums"]["order_return_status"]
          tracking_number: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          buyer_user_id: string
          created_at?: string
          currency?: string | null
          id?: string
          order_id: string
          order_item_id?: string | null
          reason?: string | null
          refund_amount_cents?: number | null
          resolution?: Database["public"]["Enums"]["return_resolution"] | null
          status?: Database["public"]["Enums"]["order_return_status"]
          tracking_number?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          buyer_user_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          order_id?: string
          order_item_id?: string | null
          reason?: string | null
          refund_amount_cents?: number | null
          resolution?: Database["public"]["Enums"]["return_resolution"] | null
          status?: Database["public"]["Enums"]["order_return_status"]
          tracking_number?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_return_requests_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_return_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      order_shipments: {
        Row: {
          courier_code: string | null
          courier_name: string | null
          created_at: string
          currency: string
          etd_text: string | null
          id: string
          meta: Json
          order_id: string
          provider: string
          service_code: string | null
          service_name: string | null
          shipping_cents: number
          tracking_no: string | null
          updated_at: string
        }
        Insert: {
          courier_code?: string | null
          courier_name?: string | null
          created_at?: string
          currency?: string
          etd_text?: string | null
          id?: string
          meta?: Json
          order_id: string
          provider: string
          service_code?: string | null
          service_name?: string | null
          shipping_cents: number
          tracking_no?: string | null
          updated_at?: string
        }
        Update: {
          courier_code?: string | null
          courier_name?: string | null
          created_at?: string
          currency?: string
          etd_text?: string | null
          id?: string
          meta?: Json
          order_id?: string
          provider?: string
          service_code?: string | null
          service_name?: string | null
          shipping_cents?: number
          tracking_no?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_transitions: {
        Row: {
          automated: boolean
          created_at: string
          from_status: string | null
          id: string
          metadata: Json | null
          order_id: string
          to_status: string
          transitioned_by: string | null
        }
        Insert: {
          automated?: boolean
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          to_status: string
          transitioned_by?: string | null
        }
        Update: {
          automated?: boolean
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          to_status?: string
          transitioned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_transitions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          automated_transition: boolean | null
          buyer_confirmed_at: string | null
          buyer_user_id: string
          community_id: string
          created_at: string
          currency: string
          easyparcel_awb_no: string | null
          easyparcel_order_no: string | null
          id: string
          recipient_name: string | null
          recipient_phone: string | null
          ship_address_line1: string | null
          ship_address_line2: string | null
          ship_city: string | null
          ship_country: string | null
          ship_postcode: string | null
          ship_state: string | null
          shipping_amount_cents: number
          shipping_method: Database["public"]["Enums"]["shipping_method"] | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          total_amount_cents: number
          transition_metadata: Json | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          automated_transition?: boolean | null
          buyer_confirmed_at?: string | null
          buyer_user_id: string
          community_id: string
          created_at?: string
          currency?: string
          easyparcel_awb_no?: string | null
          easyparcel_order_no?: string | null
          id?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          ship_address_line1?: string | null
          ship_address_line2?: string | null
          ship_city?: string | null
          ship_country?: string | null
          ship_postcode?: string | null
          ship_state?: string | null
          shipping_amount_cents?: number
          shipping_method?:
            | Database["public"]["Enums"]["shipping_method"]
            | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          total_amount_cents?: number
          transition_metadata?: Json | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          automated_transition?: boolean | null
          buyer_confirmed_at?: string | null
          buyer_user_id?: string
          community_id?: string
          created_at?: string
          currency?: string
          easyparcel_awb_no?: string | null
          easyparcel_order_no?: string | null
          id?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          ship_address_line1?: string | null
          ship_address_line2?: string | null
          ship_city?: string | null
          ship_country?: string | null
          ship_postcode?: string | null
          ship_state?: string | null
          shipping_amount_cents?: number
          shipping_method?:
            | Database["public"]["Enums"]["shipping_method"]
            | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          total_amount_cents?: number
          transition_metadata?: Json | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      page_content: {
        Row: {
          content_key: string
          content_type: string
          content_value: string
          id: string
          is_active: boolean
          page_slug: string
          updated_at: string
        }
        Insert: {
          content_key: string
          content_type?: string
          content_value: string
          id?: string
          is_active?: boolean
          page_slug: string
          updated_at?: string
        }
        Update: {
          content_key?: string
          content_type?: string
          content_value?: string
          id?: string
          is_active?: boolean
          page_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string
          id: string
          method: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          proof_path: string | null
          reference: string | null
          requested_by: string
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount_cents: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          proof_path?: string | null
          reference?: string | null
          requested_by: string
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount_cents?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          proof_path?: string | null
          reference?: string | null
          requested_by?: string
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      process_steps: {
        Row: {
          created_at: string
          description: string
          display_order: number
          icon_name: string
          id: string
          is_active: boolean
          step_number: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          icon_name: string
          id?: string
          is_active?: boolean
          step_number: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean
          step_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_inventory: {
        Row: {
          created_at: string
          id: string
          low_stock_threshold: number
          product_id: string
          reserved_quantity: number
          stock_quantity: number
          track_inventory: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          low_stock_threshold?: number
          product_id: string
          reserved_quantity?: number
          stock_quantity?: number
          track_inventory?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          low_stock_threshold?: number
          product_id?: string
          reserved_quantity?: number
          stock_quantity?: number
          track_inventory?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          age_years: number | null
          allow_easyparcel: boolean
          allow_rider_delivery: boolean
          category: string | null
          community_id: string
          condition:
            | Database["public"]["Enums"]["product_condition_type"]
            | null
          created_at: string
          currency: string
          description: string | null
          height_cm: number | null
          id: string
          image_urls: string[] | null
          length_cm: number | null
          name: string
          original_price_cents: number | null
          perishable: boolean
          pickup_lat: number | null
          pickup_lng: number | null
          prep_time_minutes: number | null
          price_cents: number
          product_kind: Database["public"]["Enums"]["product_kind_type"] | null
          refrigeration_required: boolean
          restocking_fee_percent: number
          return_window_days: number
          returnable: boolean
          status: Database["public"]["Enums"]["product_status"]
          stock_qty: number
          updated_at: string
          vendor_id: string
          video_url: string | null
          wear_description: string | null
          weight_grams: number | null
          width_cm: number | null
        }
        Insert: {
          age_years?: number | null
          allow_easyparcel?: boolean
          allow_rider_delivery?: boolean
          category?: string | null
          community_id: string
          condition?:
            | Database["public"]["Enums"]["product_condition_type"]
            | null
          created_at?: string
          currency?: string
          description?: string | null
          height_cm?: number | null
          id?: string
          image_urls?: string[] | null
          length_cm?: number | null
          name: string
          original_price_cents?: number | null
          perishable?: boolean
          pickup_lat?: number | null
          pickup_lng?: number | null
          prep_time_minutes?: number | null
          price_cents: number
          product_kind?: Database["public"]["Enums"]["product_kind_type"] | null
          refrigeration_required?: boolean
          restocking_fee_percent?: number
          return_window_days?: number
          returnable?: boolean
          status?: Database["public"]["Enums"]["product_status"]
          stock_qty?: number
          updated_at?: string
          vendor_id: string
          video_url?: string | null
          wear_description?: string | null
          weight_grams?: number | null
          width_cm?: number | null
        }
        Update: {
          age_years?: number | null
          allow_easyparcel?: boolean
          allow_rider_delivery?: boolean
          category?: string | null
          community_id?: string
          condition?:
            | Database["public"]["Enums"]["product_condition_type"]
            | null
          created_at?: string
          currency?: string
          description?: string | null
          height_cm?: number | null
          id?: string
          image_urls?: string[] | null
          length_cm?: number | null
          name?: string
          original_price_cents?: number | null
          perishable?: boolean
          pickup_lat?: number | null
          pickup_lng?: number | null
          prep_time_minutes?: number | null
          price_cents?: number
          product_kind?: Database["public"]["Enums"]["product_kind_type"] | null
          refrigeration_required?: boolean
          restocking_fee_percent?: number
          return_window_days?: number
          returnable?: boolean
          status?: Database["public"]["Enums"]["product_status"]
          stock_qty?: number
          updated_at?: string
          vendor_id?: string
          video_url?: string | null
          wear_description?: string | null
          weight_grams?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          average_rating_given: number | null
          city: string | null
          country: string
          created_at: string
          delivery_preference: string | null
          helpful_votes_received: number | null
          id: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          postcode: string | null
          reviewer_rank: string | null
          state: string | null
          total_reviews: number | null
          updated_at: string
          verification_level:
            | Database["public"]["Enums"]["reviewer_verification_level"]
            | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          average_rating_given?: number | null
          city?: string | null
          country?: string
          created_at?: string
          delivery_preference?: string | null
          helpful_votes_received?: number | null
          id: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          postcode?: string | null
          reviewer_rank?: string | null
          state?: string | null
          total_reviews?: number | null
          updated_at?: string
          verification_level?:
            | Database["public"]["Enums"]["reviewer_verification_level"]
            | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          average_rating_given?: number | null
          city?: string | null
          country?: string
          created_at?: string
          delivery_preference?: string | null
          helpful_votes_received?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          postcode?: string | null
          reviewer_rank?: string | null
          state?: string | null
          total_reviews?: number | null
          updated_at?: string
          verification_level?:
            | Database["public"]["Enums"]["reviewer_verification_level"]
            | null
        }
        Relationships: []
      }
      refund_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          order_id: string
          processed_by: string | null
          provider: string
          provider_refund_id: string | null
          return_request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          processed_by?: string | null
          provider?: string
          provider_refund_id?: string | null
          return_request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          processed_by?: string | null
          provider?: string
          provider_refund_id?: string | null
          return_request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      return_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          parameters: Json
          rule_type: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          parameters?: Json
          rule_type: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          parameters?: Json
          rule_type?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      review_images: {
        Row: {
          created_at: string
          id: string
          review_id: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          created_at: string
          id: string
          response_text: string
          review_id: string
          updated_at: string
          vendor_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          response_text: string
          review_id: string
          updated_at?: string
          vendor_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          response_text?: string
          review_id?: string
          updated_at?: string
          vendor_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          rating_suggestions: Json | null
          target_type: Database["public"]["Enums"]["review_target"]
          template_text: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          rating_suggestions?: Json | null
          target_type: Database["public"]["Enums"]["review_target"]
          template_text: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          rating_suggestions?: Json | null
          target_type?: Database["public"]["Enums"]["review_target"]
          template_text?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          delivery_rating: number | null
          helpful_count: number | null
          id: string
          quality_rating: number | null
          rating: number
          service_rating: number | null
          status: Database["public"]["Enums"]["review_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
          title: string | null
          updated_at: string
          user_id: string
          value_rating: number | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          delivery_rating?: number | null
          helpful_count?: number | null
          id?: string
          quality_rating?: number | null
          rating: number
          service_rating?: number | null
          status?: Database["public"]["Enums"]["review_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
          title?: string | null
          updated_at?: string
          user_id: string
          value_rating?: number | null
        }
        Update: {
          body?: string | null
          created_at?: string
          delivery_rating?: number | null
          helpful_count?: number | null
          id?: string
          quality_rating?: number | null
          rating?: number
          service_rating?: number | null
          status?: Database["public"]["Enums"]["review_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["review_target"]
          title?: string | null
          updated_at?: string
          user_id?: string
          value_rating?: number | null
        }
        Relationships: []
      }
      rider_location_snapshots: {
        Row: {
          accuracy_meters: number | null
          created_at: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          metadata: Json | null
          order_id: string | null
          rider_user_id: string
          speed_kmh: number | null
        }
        Insert: {
          accuracy_meters?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          metadata?: Json | null
          order_id?: string | null
          rider_user_id: string
          speed_kmh?: number | null
        }
        Update: {
          accuracy_meters?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          metadata?: Json | null
          order_id?: string | null
          rider_user_id?: string
          speed_kmh?: number | null
        }
        Relationships: []
      }
      rider_payouts: {
        Row: {
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string
          id: string
          method: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          reference: string | null
          requested_by: string
          rider_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          reference?: string | null
          requested_by: string
          rider_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          reference?: string | null
          requested_by?: string
          rider_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rider_profiles: {
        Row: {
          created_at: string
          current_lat: number | null
          current_lng: number | null
          id: string
          is_available: boolean
          is_verified: boolean
          last_location_update: string | null
          license_number: string | null
          rating: number | null
          service_radius_km: number
          total_deliveries: number | null
          updated_at: string
          user_id: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          is_available?: boolean
          is_verified?: boolean
          last_location_update?: string | null
          license_number?: string | null
          rating?: number | null
          service_radius_km?: number
          total_deliveries?: number | null
          updated_at?: string
          user_id: string
          vehicle_type: string
        }
        Update: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          is_available?: boolean
          is_verified?: boolean
          last_location_update?: string | null
          license_number?: string | null
          rating?: number | null
          service_radius_km?: number
          total_deliveries?: number | null
          updated_at?: string
          user_id?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      scheduled_orders: {
        Row: {
          buyer_user_id: string
          cart_snapshot: Json
          created_at: string
          delivery_preferences: Json
          end_date: string | null
          id: string
          next_execution_at: string | null
          recurring_interval: number | null
          recurring_type: string | null
          scheduled_for: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_user_id: string
          cart_snapshot?: Json
          created_at?: string
          delivery_preferences?: Json
          end_date?: string | null
          id?: string
          next_execution_at?: string | null
          recurring_interval?: number | null
          recurring_type?: string | null
          scheduled_for: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_user_id?: string
          cart_snapshot?: Json
          created_at?: string
          delivery_preferences?: Json
          end_date?: string | null
          id?: string
          next_execution_at?: string | null
          recurring_interval?: number | null
          recurring_type?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      service_addons: {
        Row: {
          created_at: string
          id: string
          name: string
          price_delta_cents: number
          service_id: string
          time_delta_minutes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price_delta_cents?: number
          service_id: string
          time_delta_minutes?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price_delta_cents?: number
          service_id?: string
          time_delta_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_addons_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "vendor_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_availability_rules: {
        Row: {
          capacity: number
          created_at: string
          day_of_week: number | null
          end_time: string
          id: string
          service_id: string | null
          start_time: string
          timezone: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          vendor_id: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          day_of_week?: number | null
          end_time: string
          id?: string
          service_id?: string | null
          start_time: string
          timezone?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          vendor_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          day_of_week?: number | null
          end_time?: string
          id?: string
          service_id?: string | null
          start_time?: string
          timezone?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sar_service"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "vendor_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sar_vendor"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bookings: {
        Row: {
          buyer_user_id: string
          created_at: string
          currency: string
          duration_minutes: number | null
          end_at: string | null
          id: string
          notes: string | null
          scheduled_at: string | null
          service_id: string
          status: string
          stripe_session_id: string | null
          total_amount_cents: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          buyer_user_id: string
          created_at?: string
          currency?: string
          duration_minutes?: number | null
          end_at?: string | null
          id?: string
          notes?: string | null
          scheduled_at?: string | null
          service_id: string
          status?: string
          stripe_session_id?: string | null
          total_amount_cents: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          buyer_user_id?: string
          created_at?: string
          currency?: string
          duration_minutes?: number | null
          end_at?: string | null
          id?: string
          notes?: string | null
          scheduled_at?: string | null
          service_id?: string
          status?: string
          stripe_session_id?: string | null
          total_amount_cents?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          category_id: string
          created_at: string
          service_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          service_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_categories_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "vendor_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_time_off: {
        Row: {
          created_at: string
          end_at: string
          id: string
          reason: string | null
          service_id: string | null
          start_at: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          end_at: string
          id?: string
          reason?: string | null
          service_id?: string | null
          start_at: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          end_at?: string
          id?: string
          reason?: string | null
          service_id?: string | null
          start_at?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sto_service"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "vendor_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sto_vendor"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      short_posts: {
        Row: {
          caption: string | null
          comments_count: number
          community_id: string | null
          created_at: string
          id: string
          likes_count: number
          status: string
          updated_at: string
          user_id: string
          video_path: string
        }
        Insert: {
          caption?: string | null
          comments_count?: number
          community_id?: string | null
          created_at?: string
          id?: string
          likes_count?: number
          status?: string
          updated_at?: string
          user_id: string
          video_path: string
        }
        Update: {
          caption?: string | null
          comments_count?: number
          community_id?: string | null
          created_at?: string
          id?: string
          likes_count?: number
          status?: string
          updated_at?: string
          user_id?: string
          video_path?: string
        }
        Relationships: []
      }
      site_statistics: {
        Row: {
          display_order: number | null
          id: string
          is_active: boolean
          stat_key: string
          stat_label: string
          stat_value: string
          updated_at: string
        }
        Insert: {
          display_order?: number | null
          id?: string
          is_active?: boolean
          stat_key: string
          stat_label: string
          stat_value: string
          updated_at?: string
        }
        Update: {
          display_order?: number | null
          id?: string
          is_active?: boolean
          stat_key?: string
          stat_label?: string
          stat_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      stakeholder_roles: {
        Row: {
          created_at: string
          description: string
          icon_name: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon_name: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          internal: boolean
          sender_user_id: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          internal?: boolean
          sender_user_id: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          internal?: boolean
          sender_user_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          created_by: string
          id: string
          order_id: string | null
          priority: string
          status: string
          subject: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          id?: string
          order_id?: string | null
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          order_id?: string | null
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          content: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          rating: number
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          content: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          rating?: number
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          content?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          rating?: number
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      trust_features: {
        Row: {
          created_at: string
          description: string
          display_order: number
          icon_name: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          icon_name: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      trust_guarantees: {
        Row: {
          created_at: string
          display_order: number
          guarantee_text: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          guarantee_text: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          guarantee_text?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_payout_profiles: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          created_at: string
          ewallet_id: string | null
          ewallet_provider: string | null
          id: string
          method: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string
          ewallet_id?: string | null
          ewallet_provider?: string | null
          id?: string
          method?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string
          ewallet_id?: string | null
          ewallet_provider?: string | null
          id?: string
          method?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_follows: {
        Row: {
          created_at: string
          id: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_follows_vendor_fk"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_service_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          interval: string
          name: string
          price_cents: number
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval: string
          name: string
          price_cents: number
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: string
          name?: string
          price_cents?: number
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_service_plans_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_services: {
        Row: {
          availability_preset: string
          booking_window_days: number | null
          buffer_minutes: number | null
          cancellation_policy: string
          capacity: number | null
          created_at: string
          currency: string
          deposit_cents: number | null
          description: string | null
          duration_minutes: number | null
          has_addons: boolean
          id: string
          image_urls: string[] | null
          location_type: string
          min_notice_minutes: number | null
          name: string
          price_cents: number
          pricing_model: string
          service_area: string | null
          service_radius_km: number | null
          status: string
          subtitle: string | null
          travel_fee_per_km_cents: number | null
          updated_at: string
          vendor_id: string
          video_url: string | null
        }
        Insert: {
          availability_preset?: string
          booking_window_days?: number | null
          buffer_minutes?: number | null
          cancellation_policy?: string
          capacity?: number | null
          created_at?: string
          currency?: string
          deposit_cents?: number | null
          description?: string | null
          duration_minutes?: number | null
          has_addons?: boolean
          id?: string
          image_urls?: string[] | null
          location_type?: string
          min_notice_minutes?: number | null
          name: string
          price_cents: number
          pricing_model?: string
          service_area?: string | null
          service_radius_km?: number | null
          status?: string
          subtitle?: string | null
          travel_fee_per_km_cents?: number | null
          updated_at?: string
          vendor_id: string
          video_url?: string | null
        }
        Update: {
          availability_preset?: string
          booking_window_days?: number | null
          buffer_minutes?: number | null
          cancellation_policy?: string
          capacity?: number | null
          created_at?: string
          currency?: string
          deposit_cents?: number | null
          description?: string | null
          duration_minutes?: number | null
          has_addons?: boolean
          id?: string
          image_urls?: string[] | null
          location_type?: string
          min_notice_minutes?: number | null
          name?: string
          price_cents?: number
          pricing_model?: string
          service_area?: string | null
          service_radius_km?: number | null
          status?: string
          subtitle?: string | null
          travel_fee_per_km_cents?: number | null
          updated_at?: string
          vendor_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          active: boolean
          community_id: string
          created_at: string
          delivery_hours: Json
          delivery_radius_km: number
          description: string | null
          display_name: string
          facebook_url: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          member_discount_override_percent: number | null
          opening_hours: Json | null
          pickup_address_line1: string | null
          pickup_city: string | null
          pickup_contact_name: string | null
          pickup_country: string | null
          pickup_phone: string | null
          pickup_postcode: string | null
          pickup_state: string | null
          tiktok_url: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          active?: boolean
          community_id: string
          created_at?: string
          delivery_hours?: Json
          delivery_radius_km?: number
          description?: string | null
          display_name: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          member_discount_override_percent?: number | null
          opening_hours?: Json | null
          pickup_address_line1?: string | null
          pickup_city?: string | null
          pickup_contact_name?: string | null
          pickup_country?: string | null
          pickup_phone?: string | null
          pickup_postcode?: string | null
          pickup_state?: string | null
          tiktok_url?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          active?: boolean
          community_id?: string
          created_at?: string
          delivery_hours?: Json
          delivery_radius_km?: number
          description?: string | null
          display_name?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          member_discount_override_percent?: number | null
          opening_hours?: Json | null
          pickup_address_line1?: string | null
          pickup_city?: string | null
          pickup_contact_name?: string | null
          pickup_country?: string | null
          pickup_phone?: string | null
          pickup_postcode?: string | null
          pickup_state?: string | null
          tiktok_url?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_redemptions: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          user_id: string
          voucher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          user_id: string
          voucher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_redemptions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          community_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: Database["public"]["Enums"]["voucher_discount_type"]
          discount_value: number
          end_at: string | null
          free_shipping: boolean
          id: string
          min_order_amount_cents: number
          per_user_limit: number
          start_at: string | null
          status: string
          title: string | null
          updated_at: string
          usage_limit: number | null
          vendor_id: string | null
        }
        Insert: {
          code: string
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["voucher_discount_type"]
          discount_value: number
          end_at?: string | null
          free_shipping?: boolean
          id?: string
          min_order_amount_cents?: number
          per_user_limit?: number
          start_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          usage_limit?: number | null
          vendor_id?: string | null
        }
        Update: {
          code?: string
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["voucher_discount_type"]
          discount_value?: number
          end_at?: string | null
          free_shipping?: boolean
          id?: string
          min_order_amount_cents?: number
          per_user_limit?: number
          start_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          usage_limit?: number | null
          vendor_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      product_rating_summary: {
        Row: {
          avg_rating: number | null
          product_id: string | null
          review_count: number | null
        }
        Relationships: []
      }
      service_rating_summary: {
        Row: {
          avg_rating: number | null
          review_count: number | null
          service_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_delivery_to_riders: {
        Args: {
          delivery_id_param: string
          pickup_lat: number
          pickup_lng: number
        }
        Returns: number
      }
      auto_transition_order_status: {
        Args: { p_order_id: string; p_trigger_event: string }
        Returns: boolean
      }
      can_submit_review: {
        Args: {
          _target_id: string
          _target_type: Database["public"]["Enums"]["review_target"]
        }
        Returns: boolean
      }
      can_view_event: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_rider_location: {
        Args: { _rider_user_id: string }
        Returns: boolean
      }
      create_order_from_cart: {
        Args: { p_delivery_address?: Json; p_notes?: string; p_user_id: string }
        Returns: string
      }
      find_nearby_riders: {
        Args: {
          max_distance_km?: number
          pickup_lat: number
          pickup_lng: number
        }
        Returns: {
          distance_km: number
          rating: number
          rider_id: string
          user_id: string
          vehicle_type: string
        }[]
      }
      get_order_cancellations: {
        Args: { p_order_id: string }
        Returns: {
          created_at: string
          id: string
          order_id: string
          processed_at: string
          reason: string
          refund_amount_cents: number
          refund_type: string
          status: string
        }[]
      }
      get_order_modifications: {
        Args: { p_order_id: string }
        Returns: {
          applied_at: string
          approved_at: string
          created_at: string
          id: string
          modification_type: string
          new_data: Json
          order_id: string
          original_data: Json
          reason: string
          status: string
        }[]
      }
      get_scheduled_orders: {
        Args: { p_user_id: string }
        Returns: {
          buyer_user_id: string
          cart_snapshot: Json
          created_at: string
          delivery_preferences: Json
          end_date: string
          id: string
          next_execution_at: string
          recurring_interval: number
          recurring_type: string
          scheduled_for: string
          status: string
          updated_at: string
        }[]
      }
      get_vendor_follower_count: {
        Args: { vendor_id_param: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_order_cancellation: {
        Args: {
          p_order_id: string
          p_reason: string
          p_refund_amount_cents: number
          p_refund_type: string
        }
        Returns: undefined
      }
      insert_order_modification: {
        Args: {
          p_modification_type: string
          p_new_data: Json
          p_order_id: string
          p_original_data: Json
          p_reason: string
        }
        Returns: undefined
      }
      insert_scheduled_order: {
        Args: {
          p_buyer_user_id: string
          p_cart_snapshot: Json
          p_delivery_preferences: Json
          p_end_date?: string
          p_recurring_interval?: number
          p_recurring_type?: string
          p_scheduled_for: string
        }
        Returns: string
      }
      is_manager_of_community: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_member_of_community: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_vendor_owner: {
        Args: { _user_id: string; _vendor_id: string }
        Returns: boolean
      }
      release_inventory: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: boolean
      }
      reserve_inventory: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: boolean
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "superadmin"
      beneficiary_type: "vendor" | "community" | "coop" | "rider"
      community_join_mode: "open" | "approval" | "invite"
      community_post_visibility: "public" | "members"
      event_rsvp_status: "going" | "interested" | "not_going"
      ledger_entry_type:
        | "vendor_payout"
        | "community_share"
        | "coop_share"
        | "platform_fee"
        | "refund"
        | "rider_earning"
        | "rider_payout"
      member_type:
        | "vendor"
        | "delivery"
        | "buyer"
        | "coordinator"
        | "manager"
        | "rider"
      order_cancel_status:
        | "requested"
        | "approved"
        | "rejected"
        | "refunded"
        | "canceled"
      order_return_status:
        | "requested"
        | "approved"
        | "rejected"
        | "in_transit"
        | "received"
        | "refunded"
        | "canceled"
      order_status: "pending" | "paid" | "canceled" | "fulfilled" | "refunded"
      product_condition_type:
        | "like_new"
        | "excellent"
        | "good"
        | "fair"
        | "poor"
      product_kind_type:
        | "prepared_food"
        | "packaged_food"
        | "grocery"
        | "other"
        | "preloved"
      product_status: "active" | "inactive" | "archived"
      return_resolution: "refund" | "replacement" | "store_credit"
      review_status: "pending" | "approved" | "rejected"
      review_target: "product" | "service"
      reviewer_verification_level:
        | "unverified"
        | "email_verified"
        | "phone_verified"
        | "identity_verified"
        | "premium_buyer"
      shipping_method: "rider" | "easyparcel"
      voucher_discount_type: "percent" | "amount"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "superadmin"],
      beneficiary_type: ["vendor", "community", "coop", "rider"],
      community_join_mode: ["open", "approval", "invite"],
      community_post_visibility: ["public", "members"],
      event_rsvp_status: ["going", "interested", "not_going"],
      ledger_entry_type: [
        "vendor_payout",
        "community_share",
        "coop_share",
        "platform_fee",
        "refund",
        "rider_earning",
        "rider_payout",
      ],
      member_type: [
        "vendor",
        "delivery",
        "buyer",
        "coordinator",
        "manager",
        "rider",
      ],
      order_cancel_status: [
        "requested",
        "approved",
        "rejected",
        "refunded",
        "canceled",
      ],
      order_return_status: [
        "requested",
        "approved",
        "rejected",
        "in_transit",
        "received",
        "refunded",
        "canceled",
      ],
      order_status: ["pending", "paid", "canceled", "fulfilled", "refunded"],
      product_condition_type: ["like_new", "excellent", "good", "fair", "poor"],
      product_kind_type: [
        "prepared_food",
        "packaged_food",
        "grocery",
        "other",
        "preloved",
      ],
      product_status: ["active", "inactive", "archived"],
      return_resolution: ["refund", "replacement", "store_credit"],
      review_status: ["pending", "approved", "rejected"],
      review_target: ["product", "service"],
      reviewer_verification_level: [
        "unverified",
        "email_verified",
        "phone_verified",
        "identity_verified",
        "premium_buyer",
      ],
      shipping_method: ["rider", "easyparcel"],
      voucher_discount_type: ["percent", "amount"],
    },
  },
} as const

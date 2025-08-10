export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
          created_at: string
          description: string | null
          id: string
          member_discount_percent: number
          name: string
          updated_at: string
        }
        Insert: {
          community_fee_percent?: number
          coop_fee_percent?: number
          created_at?: string
          description?: string | null
          id?: string
          member_discount_percent?: number
          name: string
          updated_at?: string
        }
        Update: {
          community_fee_percent?: number
          coop_fee_percent?: number
          created_at?: string
          description?: string | null
          id?: string
          member_discount_percent?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      orders: {
        Row: {
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
          updated_at: string
          vendor_id: string
        }
        Insert: {
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
          updated_at?: string
          vendor_id: string
        }
        Update: {
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
      products: {
        Row: {
          allow_easyparcel: boolean
          allow_rider_delivery: boolean
          category: string | null
          community_id: string
          created_at: string
          currency: string
          description: string | null
          height_cm: number | null
          id: string
          image_urls: string[] | null
          length_cm: number | null
          name: string
          perishable: boolean
          pickup_lat: number | null
          pickup_lng: number | null
          prep_time_minutes: number | null
          price_cents: number
          product_kind: Database["public"]["Enums"]["product_kind_type"] | null
          refrigeration_required: boolean
          status: Database["public"]["Enums"]["product_status"]
          stock_qty: number
          updated_at: string
          vendor_id: string
          video_url: string | null
          weight_grams: number | null
          width_cm: number | null
        }
        Insert: {
          allow_easyparcel?: boolean
          allow_rider_delivery?: boolean
          category?: string | null
          community_id: string
          created_at?: string
          currency?: string
          description?: string | null
          height_cm?: number | null
          id?: string
          image_urls?: string[] | null
          length_cm?: number | null
          name: string
          perishable?: boolean
          pickup_lat?: number | null
          pickup_lng?: number | null
          prep_time_minutes?: number | null
          price_cents: number
          product_kind?: Database["public"]["Enums"]["product_kind_type"] | null
          refrigeration_required?: boolean
          status?: Database["public"]["Enums"]["product_status"]
          stock_qty?: number
          updated_at?: string
          vendor_id: string
          video_url?: string | null
          weight_grams?: number | null
          width_cm?: number | null
        }
        Update: {
          allow_easyparcel?: boolean
          allow_rider_delivery?: boolean
          category?: string | null
          community_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          height_cm?: number | null
          id?: string
          image_urls?: string[] | null
          length_cm?: number | null
          name?: string
          perishable?: boolean
          pickup_lat?: number | null
          pickup_lng?: number | null
          prep_time_minutes?: number | null
          price_cents?: number
          product_kind?: Database["public"]["Enums"]["product_kind_type"] | null
          refrigeration_required?: boolean
          status?: Database["public"]["Enums"]["product_status"]
          stock_qty?: number
          updated_at?: string
          vendor_id?: string
          video_url?: string | null
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
          city: string | null
          country: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          postcode: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          postcode?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          postcode?: string | null
          state?: string | null
          updated_at?: string
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
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["review_target"]
          title?: string | null
          updated_at?: string
          user_id?: string
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
      service_bookings: {
        Row: {
          buyer_user_id: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          scheduled_at: string | null
          service_id: string
          status: string
          stripe_session_id: string | null
          total_amount_cents: number
          updated_at: string
        }
        Insert: {
          buyer_user_id: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          scheduled_at?: string | null
          service_id: string
          status?: string
          stripe_session_id?: string | null
          total_amount_cents: number
          updated_at?: string
        }
        Update: {
          buyer_user_id?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          scheduled_at?: string | null
          service_id?: string
          status?: string
          stripe_session_id?: string | null
          total_amount_cents?: number
          updated_at?: string
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
      can_submit_review: {
        Args: {
          _target_type: Database["public"]["Enums"]["review_target"]
          _target_id: string
        }
        Returns: boolean
      }
      find_nearby_riders: {
        Args: {
          pickup_lat: number
          pickup_lng: number
          max_distance_km?: number
        }
        Returns: {
          rider_id: string
          user_id: string
          distance_km: number
          vehicle_type: string
          rating: number
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_manager_of_community: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_vendor_owner: {
        Args: { _vendor_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "superadmin"
      beneficiary_type: "vendor" | "community" | "coop" | "rider"
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
      order_status: "pending" | "paid" | "canceled" | "fulfilled" | "refunded"
      product_kind_type: "prepared_food" | "packaged_food" | "grocery" | "other"
      product_status: "active" | "inactive" | "archived"
      review_status: "pending" | "approved" | "rejected"
      review_target: "product" | "service"
      shipping_method: "rider" | "easyparcel"
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
      order_status: ["pending", "paid", "canceled", "fulfilled", "refunded"],
      product_kind_type: ["prepared_food", "packaged_food", "grocery", "other"],
      product_status: ["active", "inactive", "archived"],
      review_status: ["pending", "approved", "rejected"],
      review_target: ["product", "service"],
      shipping_method: ["rider", "easyparcel"],
    },
  },
} as const

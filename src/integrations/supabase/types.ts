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
      deliveries: {
        Row: {
          created_at: string
          id: string
          order_id: string
          rider_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          rider_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          rider_user_id?: string | null
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
      orders: {
        Row: {
          buyer_user_id: string
          community_id: string
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          total_amount_cents: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          buyer_user_id: string
          community_id: string
          created_at?: string
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          total_amount_cents?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          buyer_user_id?: string
          community_id?: string
          created_at?: string
          currency?: string
          id?: string
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
      products: {
        Row: {
          community_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          name: string
          price_cents: number
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name: string
          price_cents: number
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          price_cents?: number
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          vendor_id?: string
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
          city: string | null
          country: string
          created_at: string
          id: string
          phone: string | null
          postcode: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id: string
          phone?: string | null
          postcode?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          phone?: string | null
          postcode?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
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
          created_at: string
          currency: string
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          price_cents: number
          service_area: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          price_cents: number
          service_area?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          price_cents?: number
          service_area?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          active: boolean
          community_id: string
          created_at: string
          display_name: string
          id: string
          member_discount_override_percent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          community_id: string
          created_at?: string
          display_name: string
          id?: string
          member_discount_override_percent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          community_id?: string
          created_at?: string
          display_name?: string
          id?: string
          member_discount_override_percent?: number | null
          updated_at?: string
          user_id?: string
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
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      app_role: "admin" | "superadmin"
      beneficiary_type: "vendor" | "community" | "coop"
      ledger_entry_type:
        | "vendor_payout"
        | "community_share"
        | "coop_share"
        | "platform_fee"
        | "refund"
      member_type:
        | "vendor"
        | "delivery"
        | "buyer"
        | "coordinator"
        | "manager"
        | "rider"
      order_status: "pending" | "paid" | "canceled" | "fulfilled" | "refunded"
      product_status: "active" | "inactive" | "archived"
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
      beneficiary_type: ["vendor", "community", "coop"],
      ledger_entry_type: [
        "vendor_payout",
        "community_share",
        "coop_share",
        "platform_fee",
        "refund",
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
      product_status: ["active", "inactive", "archived"],
    },
  },
} as const

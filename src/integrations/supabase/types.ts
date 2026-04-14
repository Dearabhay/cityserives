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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          address: string
          city: string | null
          created_at: string
          customer_id: string
          emergency_flag: boolean
          id: string
          payment_method: string
          price: number
          promo_code: string | null
          scheduled_date: string
          scheduled_time: string
          service_type: string
          special_instructions: string | null
          status: string
          sub_service: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string
          customer_id: string
          emergency_flag?: boolean
          id?: string
          payment_method?: string
          price: number
          promo_code?: string | null
          scheduled_date: string
          scheduled_time: string
          service_type: string
          special_instructions?: string | null
          status?: string
          sub_service?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string
          customer_id?: string
          emergency_flag?: boolean
          id?: string
          payment_method?: string
          price?: number
          promo_code?: string | null
          scheduled_date?: string
          scheduled_time?: string
          service_type?: string
          special_instructions?: string | null
          status?: string
          sub_service?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          message: string
          message_type: string
          metadata: Json | null
          read: boolean
          sender_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          message: string
          message_type?: string
          metadata?: Json | null
          read?: boolean
          sender_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          metadata?: Json | null
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_reviews: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string
          id: string
          rating: number
          review_text: string | null
          vendor_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          rating: number
          review_text?: string | null
          vendor_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
          review_text?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_vendors: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          vendor_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string
          id: string
          photos: string[] | null
          rating: number
          review_text: string | null
          tip_amount: number | null
          vendor_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          photos?: string[] | null
          rating: number
          review_text?: string | null
          tip_amount?: number | null
          vendor_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          photos?: string[] | null
          rating?: number
          review_text?: string | null
          tip_amount?: number | null
          vendor_id?: string
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          address: string
          city: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sos_alerts: {
        Row: {
          created_at: string
          emergency_type: string
          id: string
          latitude: number | null
          location_address: string | null
          longitude: number | null
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emergency_type: string
          id?: string
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emergency_type?: string
          id?: string
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_locations: {
        Row: {
          booking_id: string | null
          id: string
          latitude: number
          longitude: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          booking_id?: string | null
          id?: string
          latitude: number
          longitude: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          booking_id?: string | null
          id?: string
          latitude?: number
          longitude?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_services: {
        Row: {
          active: boolean
          category: string
          created_at: string
          duration: string
          id: string
          name: string
          price: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          duration: string
          id?: string
          name: string
          price: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          duration?: string
          id?: string
          name?: string
          price?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_holder: string
          account_number: string
          amount: number
          bank_name: string
          created_at: string
          id: string
          ifsc_code: string
          processed_at: string | null
          status: string
          vendor_id: string
        }
        Insert: {
          account_holder: string
          account_number: string
          amount: number
          bank_name: string
          created_at?: string
          id?: string
          ifsc_code: string
          processed_at?: string | null
          status?: string
          vendor_id: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          amount?: number
          bank_name?: string
          created_at?: string
          id?: string
          ifsc_code?: string
          processed_at?: string | null
          status?: string
          vendor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_booking: { Args: { _booking_id: string }; Returns: boolean }
      get_customer_avg_rating: {
        Args: { _customer_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "vendor" | "admin"
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
      app_role: ["customer", "vendor", "admin"],
    },
  },
} as const

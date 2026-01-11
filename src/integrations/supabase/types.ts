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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number | null
          color: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          color: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          balance?: number | null
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      areas: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          account_id: string | null
          closing_day: number | null
          color: string
          created_at: string | null
          credit_limit: number | null
          due_day: number | null
          id: string
          last_digits: string | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          closing_day?: number | null
          color: string
          created_at?: string | null
          credit_limit?: number | null
          due_day?: number | null
          id?: string
          last_digits?: string | null
          name: string
          type: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          closing_day?: number | null
          color?: string
          created_at?: string | null
          credit_limit?: number | null
          due_day?: number | null
          id?: string
          last_digits?: string | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          area_id: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          area_id: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          area_id?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account_id: string | null
          area_id: string | null
          card_id: string | null
          category_id: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          installment_number: number | null
          parent_id: string | null
          payment_date: string | null
          recurrence_end_date: string | null
          recurrence_frequency: string | null
          recurrence_installments: number | null
          recurrence_start_date: string | null
          recurrence_type: string | null
          status: string | null
          total_installments: number | null
          type: string
          user_id: string
          value: number
        }
        Insert: {
          account_id?: string | null
          area_id?: string | null
          card_id?: string | null
          category_id?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          installment_number?: number | null
          parent_id?: string | null
          payment_date?: string | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          recurrence_installments?: number | null
          recurrence_start_date?: string | null
          recurrence_type?: string | null
          status?: string | null
          total_installments?: number | null
          type: string
          user_id: string
          value: number
        }
        Update: {
          account_id?: string | null
          area_id?: string | null
          card_id?: string | null
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          installment_number?: number | null
          parent_id?: string | null
          payment_date?: string | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          recurrence_installments?: number | null
          recurrence_start_date?: string | null
          recurrence_type?: string | null
          status?: string | null
          total_installments?: number | null
          type?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      incomes: {
        Row: {
          account_id: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          origin: string | null
          type: string
          user_id: string
          value: number
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          origin?: string | null
          type: string
          user_id: string
          value: number
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          origin?: string | null
          type?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "incomes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          owner_id: string
          role: Database["public"]["Enums"]["access_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          owner_id: string
          role?: Database["public"]["Enums"]["access_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          owner_id?: string
          role?: Database["public"]["Enums"]["access_role"]
          token?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          card_id: string
          created_at: string | null
          id: string
          month: number
          paid_date: string | null
          paid_from_account_id: string | null
          status: string | null
          total_amount: number | null
          user_id: string
          year: number
        }
        Insert: {
          card_id: string
          created_at?: string | null
          id?: string
          month: number
          paid_date?: string | null
          paid_from_account_id?: string | null
          status?: string | null
          total_amount?: number | null
          user_id: string
          year: number
        }
        Update: {
          card_id?: string
          created_at?: string | null
          id?: string
          month?: number
          paid_date?: string | null
          paid_from_account_id?: string | null
          status?: string | null
          total_amount?: number | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_paid_from_account_id_fkey"
            columns: ["paid_from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      shared_members: {
        Row: {
          created_at: string | null
          id: string
          member_id: string
          owner_id: string
          role: Database["public"]["Enums"]["access_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id: string
          owner_id: string
          role?: Database["public"]["Enums"]["access_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string
          owner_id?: string
          role?: Database["public"]["Enums"]["access_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_effective_owner_id: { Args: never; Returns: string }
      get_invitation_by_token: {
        Args: { lookup_token: string }
        Returns: {
          accepted_at: string
          email: string
          expires_at: string
          id: string
          owner_id: string
          role: Database["public"]["Enums"]["access_role"]
        }[]
      }
      get_shared_member_emails: {
        Args: { owner_uuid: string }
        Returns: {
          email: string
          member_id: string
        }[]
      }
      has_shared_access: {
        Args: {
          _min_role: Database["public"]["Enums"]["access_role"]
          _owner_id: string
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      access_role: "viewer" | "editor" | "admin"
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
      access_role: ["viewer", "editor", "admin"],
    },
  },
} as const

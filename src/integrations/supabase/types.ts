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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string | null
          earned_at: string | null
          icon: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          description?: string | null
          earned_at?: string | null
          icon?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          description?: string | null
          earned_at?: string | null
          icon?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      completed_exercises: {
        Row: {
          completed_at: string | null
          difficulty: string
          id: string
          score: number | null
          subject: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          completed_at?: string | null
          difficulty: string
          id?: string
          score?: number | null
          subject: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          completed_at?: string | null
          difficulty?: string
          id?: string
          score?: number | null
          subject?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_goals: {
        Row: {
          completed_at: string | null
          completed_exercises: number | null
          created_at: string | null
          goal_date: string
          id: string
          is_completed: boolean | null
          target_exercises: number | null
          user_id: string
          xp_reward: number | null
        }
        Insert: {
          completed_at?: string | null
          completed_exercises?: number | null
          created_at?: string | null
          goal_date?: string
          id?: string
          is_completed?: boolean | null
          target_exercises?: number | null
          user_id: string
          xp_reward?: number | null
        }
        Update: {
          completed_at?: string | null
          completed_exercises?: number | null
          created_at?: string | null
          goal_date?: string
          id?: string
          is_completed?: boolean | null
          target_exercises?: number | null
          user_id?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      learning_history: {
        Row: {
          created_at: string | null
          id: string
          ki_after: number | null
          ki_before: number | null
          subject: string
          topic: string
          user_id: string
          xp_gained: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ki_after?: number | null
          ki_before?: number | null
          subject: string
          topic: string
          user_id: string
          xp_gained?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ki_after?: number | null
          ki_before?: number | null
          subject?: string
          topic?: string
          user_id?: string
          xp_gained?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      student_suggestions: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string
          id: string
          is_completed: boolean
          priority: number
          suggestion_type: string
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          is_completed?: boolean
          priority?: number
          suggestion_type: string
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          is_completed?: boolean
          priority?: number
          suggestion_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          created_at: string | null
          daily_streak: number | null
          id: string
          ki_level: number | null
          last_life_lost_at: string | null
          last_study_date: string | null
          lives: number | null
          sound_enabled: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
          vibration_enabled: boolean | null
          xp: number | null
        }
        Insert: {
          created_at?: string | null
          daily_streak?: number | null
          id?: string
          ki_level?: number | null
          last_life_lost_at?: string | null
          last_study_date?: string | null
          lives?: number | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
          vibration_enabled?: boolean | null
          xp?: number | null
        }
        Update: {
          created_at?: string | null
          daily_streak?: number | null
          id?: string
          ki_level?: number | null
          last_life_lost_at?: string | null
          last_study_date?: string | null
          lives?: number | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
          vibration_enabled?: boolean | null
          xp?: number | null
        }
        Relationships: []
      }
      wrong_answers: {
        Row: {
          correct_answer: number
          created_at: string | null
          difficulty: string
          explanation: string
          id: string
          options: string[]
          question: string
          subject: string
          topic: string
          user_answer: number
          user_id: string
        }
        Insert: {
          correct_answer: number
          created_at?: string | null
          difficulty: string
          explanation: string
          id?: string
          options: string[]
          question: string
          subject: string
          topic: string
          user_answer: number
          user_id: string
        }
        Update: {
          correct_answer?: number
          created_at?: string | null
          difficulty?: string
          explanation?: string
          id?: string
          options?: string[]
          question?: string
          subject?: string
          topic?: string
          user_answer?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_daily_goal_if_not_exists: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

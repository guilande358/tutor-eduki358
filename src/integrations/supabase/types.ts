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
      ad_impressions: {
        Row: {
          ad_type: string
          id: string
          placement_id: string | null
          reward_claimed: boolean | null
          reward_type: string | null
          user_id: string
          watched_at: string | null
        }
        Insert: {
          ad_type?: string
          id?: string
          placement_id?: string | null
          reward_claimed?: boolean | null
          reward_type?: string | null
          user_id: string
          watched_at?: string | null
        }
        Update: {
          ad_type?: string
          id?: string
          placement_id?: string | null
          reward_claimed?: boolean | null
          reward_type?: string | null
          user_id?: string
          watched_at?: string | null
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
      daily_challenges: {
        Row: {
          challenge_data: Json
          challenge_date: string
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          user_id: string
          xp_reward: number | null
        }
        Insert: {
          challenge_data: Json
          challenge_date?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          user_id: string
          xp_reward?: number | null
        }
        Update: {
          challenge_data?: Json
          challenge_date?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          user_id?: string
          xp_reward?: number | null
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
      daily_quiz_sessions: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          credits_reward: number | null
          difficulty: string
          id: string
          is_completed: boolean | null
          questions: Json
          quiz_date: string
          score: number | null
          subject: string
          total_questions: number
          user_id: string
          xp_reward: number | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          credits_reward?: number | null
          difficulty: string
          id?: string
          is_completed?: boolean | null
          questions?: Json
          quiz_date?: string
          score?: number | null
          subject: string
          total_questions?: number
          user_id: string
          xp_reward?: number | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          credits_reward?: number | null
          difficulty?: string
          id?: string
          is_completed?: boolean | null
          questions?: Json
          quiz_date?: string
          score?: number | null
          subject?: string
          total_questions?: number
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
      notification_settings: {
        Row: {
          created_at: string | null
          daily_challenge_reminders: boolean | null
          id: string
          push_enabled: boolean | null
          push_subscription: Json | null
          reminder_time: string | null
          streak_reminders: boolean | null
          study_reminders: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_challenge_reminders?: boolean | null
          id?: string
          push_enabled?: boolean | null
          push_subscription?: Json | null
          reminder_time?: string | null
          streak_reminders?: boolean | null
          study_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_challenge_reminders?: boolean | null
          id?: string
          push_enabled?: boolean | null
          push_subscription?: Json | null
          reminder_time?: string | null
          streak_reminders?: boolean | null
          study_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string
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
      reward_shop: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          reward_data: Json | null
          reward_type: string
          xp_cost: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          reward_data?: Json | null
          reward_type: string
          xp_cost: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          reward_data?: Json | null
          reward_type?: string
          xp_cost?: number
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          content: string
          content_type: string | null
          created_at: string | null
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_participants: {
        Row: {
          id: string
          is_tutor_active: boolean | null
          joined_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_tutor_active?: boolean | null
          joined_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_tutor_active?: boolean | null
          joined_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
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
      study_rooms: {
        Row: {
          code: string
          created_at: string | null
          host_user_id: string
          id: string
          is_active: boolean | null
          mode: string | null
          title: string
          updated_at: string | null
          whiteboard_data: Json | null
        }
        Insert: {
          code: string
          created_at?: string | null
          host_user_id: string
          id?: string
          is_active?: boolean | null
          mode?: string | null
          title?: string
          updated_at?: string | null
          whiteboard_data?: Json | null
        }
        Update: {
          code?: string
          created_at?: string | null
          host_user_id?: string
          id?: string
          is_active?: boolean | null
          mode?: string | null
          title?: string
          updated_at?: string | null
          whiteboard_data?: Json | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          country_region: string | null
          created_at: string | null
          credits: number | null
          credits_received_today: number | null
          credits_used_this_month: number | null
          daily_streak: number | null
          id: string
          is_premium: boolean | null
          ki_level: number | null
          language: string | null
          last_credits_reset: string | null
          last_daily_credit_date: string | null
          last_life_lost_at: string | null
          last_study_date: string | null
          level: number | null
          lives: number | null
          preferred_subjects: string[] | null
          premium_expires_at: string | null
          sound_enabled: boolean | null
          study_goals: string | null
          theme: string | null
          total_videos_watched: number | null
          updated_at: string | null
          user_id: string
          vibration_enabled: boolean | null
          xp: number | null
        }
        Insert: {
          country_region?: string | null
          created_at?: string | null
          credits?: number | null
          credits_received_today?: number | null
          credits_used_this_month?: number | null
          daily_streak?: number | null
          id?: string
          is_premium?: boolean | null
          ki_level?: number | null
          language?: string | null
          last_credits_reset?: string | null
          last_daily_credit_date?: string | null
          last_life_lost_at?: string | null
          last_study_date?: string | null
          level?: number | null
          lives?: number | null
          preferred_subjects?: string[] | null
          premium_expires_at?: string | null
          sound_enabled?: boolean | null
          study_goals?: string | null
          theme?: string | null
          total_videos_watched?: number | null
          updated_at?: string | null
          user_id: string
          vibration_enabled?: boolean | null
          xp?: number | null
        }
        Update: {
          country_region?: string | null
          created_at?: string | null
          credits?: number | null
          credits_received_today?: number | null
          credits_used_this_month?: number | null
          daily_streak?: number | null
          id?: string
          is_premium?: boolean | null
          ki_level?: number | null
          language?: string | null
          last_credits_reset?: string | null
          last_daily_credit_date?: string | null
          last_life_lost_at?: string | null
          last_study_date?: string | null
          level?: number | null
          lives?: number | null
          preferred_subjects?: string[] | null
          premium_expires_at?: string | null
          sound_enabled?: boolean | null
          study_goals?: string | null
          theme?: string | null
          total_videos_watched?: number | null
          updated_at?: string | null
          user_id?: string
          vibration_enabled?: boolean | null
          xp?: number | null
        }
        Relationships: []
      }
      user_quiz_preferences: {
        Row: {
          created_at: string | null
          difficulty_level: string
          exercises_per_quiz: number
          favorite_subject: string
          id: string
          question_types: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          difficulty_level?: string
          exercises_per_quiz?: number
          favorite_subject?: string
          id?: string
          question_types?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          difficulty_level?: string
          exercises_per_quiz?: number
          favorite_subject?: string
          id?: string
          question_types?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          id: string
          is_active: boolean | null
          purchased_at: string | null
          reward_id: string | null
          reward_type: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          purchased_at?: string | null
          reward_id?: string | null
          reward_type: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          purchased_at?: string | null
          reward_id?: string | null
          reward_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "reward_shop"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          payment_id: string | null
          payment_provider: string | null
          plan_type: string
          started_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_id?: string | null
          payment_provider?: string | null
          plan_type?: string
          started_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_id?: string | null
          payment_provider?: string | null
          plan_type?: string
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_ui_preferences: {
        Row: {
          banner_hidden_until: string | null
          chat_mode: string | null
          created_at: string | null
          hide_daily_banner: boolean | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          banner_hidden_until?: string | null
          chat_mode?: string | null
          created_at?: string | null
          hide_daily_banner?: boolean | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          banner_hidden_until?: string | null
          chat_mode?: string | null
          created_at?: string | null
          hide_daily_banner?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webrtc_signals: {
        Row: {
          created_at: string | null
          from_user_id: string
          id: string
          room_id: string | null
          signal_data: Json
          signal_type: string
          to_user_id: string
        }
        Insert: {
          created_at?: string | null
          from_user_id: string
          id?: string
          room_id?: string | null
          signal_data: Json
          signal_type: string
          to_user_id: string
        }
        Update: {
          created_at?: string | null
          from_user_id?: string
          id?: string
          room_id?: string | null
          signal_data?: Json
          signal_type?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webrtc_signals_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
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

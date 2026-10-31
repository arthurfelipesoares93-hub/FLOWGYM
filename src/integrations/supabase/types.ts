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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          activities_duration: string | null
          activities_frequency: string | null
          available_days: string[]
          birth_date: string | null
          created_at: string
          current_pain: string | null
          days_per_week: number | null
          equipment: string | null
          experience_level: string | null
          experience_time: string | null
          full_name: string
          goal_other: string | null
          goals: string[]
          height_cm: number | null
          id: string
          injuries: string | null
          medical_restrictions: string | null
          movement_limitations: string | null
          other_activities: string | null
          other_notes: string | null
          payment_confirmed_at: string | null
          payment_declared: string | null
          reviewed_at: string | null
          session_minutes: number | null
          student_id: string
          submitted_at: string | null
          training_location: string | null
          updated_at: string
          weight_kg: number | null
          weight_updated_at: string | null
        }
        Insert: {
          activities_duration?: string | null
          activities_frequency?: string | null
          available_days?: string[]
          birth_date?: string | null
          created_at?: string
          current_pain?: string | null
          days_per_week?: number | null
          equipment?: string | null
          experience_level?: string | null
          experience_time?: string | null
          full_name?: string
          goal_other?: string | null
          goals?: string[]
          height_cm?: number | null
          id?: string
          injuries?: string | null
          medical_restrictions?: string | null
          movement_limitations?: string | null
          other_activities?: string | null
          other_notes?: string | null
          payment_confirmed_at?: string | null
          payment_declared?: string | null
          reviewed_at?: string | null
          session_minutes?: number | null
          student_id: string
          submitted_at?: string | null
          training_location?: string | null
          updated_at?: string
          weight_kg?: number | null
          weight_updated_at?: string | null
        }
        Update: {
          activities_duration?: string | null
          activities_frequency?: string | null
          available_days?: string[]
          birth_date?: string | null
          created_at?: string
          current_pain?: string | null
          days_per_week?: number | null
          equipment?: string | null
          experience_level?: string | null
          experience_time?: string | null
          full_name?: string
          goal_other?: string | null
          goals?: string[]
          height_cm?: number | null
          id?: string
          injuries?: string | null
          medical_restrictions?: string | null
          movement_limitations?: string | null
          other_activities?: string | null
          other_notes?: string | null
          payment_confirmed_at?: string | null
          payment_declared?: string | null
          reviewed_at?: string | null
          session_minutes?: number | null
          student_id?: string
          submitted_at?: string | null
          training_location?: string | null
          updated_at?: string
          weight_kg?: number | null
          weight_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      body_photos: {
        Row: {
          angle: string | null
          created_at: string
          id: string
          notes: string | null
          storage_path: string
          student_id: string
          taken_on: string
          uploaded_by: string
        }
        Insert: {
          angle?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          storage_path: string
          student_id: string
          taken_on?: string
          uploaded_by?: string
        }
        Update: {
          angle?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          storage_path?: string
          student_id?: string
          taken_on?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "body_photos_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      charges: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          period_end: string
          period_start: string
          status: string
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          period_end: string
          period_start: string
          status?: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          period_end?: string
          period_start?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "charges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_history: {
        Row: {
          birthday_year: number | null
          contact_type: string
          created_at: string
          goal_id: string | null
          id: string
          lead_id: string | null
          message: string
          notes: string
          reason: string
          sent_at: string | null
          status: string
          student_id: string | null
          trainer_id: string
          updated_at: string
        }
        Insert: {
          birthday_year?: number | null
          contact_type: string
          created_at?: string
          goal_id?: string | null
          id?: string
          lead_id?: string | null
          message?: string
          notes?: string
          reason?: string
          sent_at?: string | null
          status?: string
          student_id?: string | null
          trainer_id?: string
          updated_at?: string
        }
        Update: {
          birthday_year?: number | null
          contact_type?: string
          created_at?: string
          goal_id?: string | null
          id?: string
          lead_id?: string | null
          message?: string
          notes?: string
          reason?: string
          sent_at?: string | null
          status?: string
          student_id?: string | null
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_history_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "student_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          birth_date: string | null
          converted_student_id: string | null
          created_at: string
          email: string
          first_contact_on: string
          id: string
          last_contact_at: string | null
          name: string
          next_contact_on: string | null
          notes: string
          objective: string
          phone: string
          source: string
          status: string
          trainer_id: string
        }
        Insert: {
          birth_date?: string | null
          converted_student_id?: string | null
          created_at?: string
          email?: string
          first_contact_on?: string
          id?: string
          last_contact_at?: string | null
          name: string
          next_contact_on?: string | null
          notes?: string
          objective?: string
          phone?: string
          source?: string
          status?: string
          trainer_id?: string
        }
        Update: {
          birth_date?: string | null
          converted_student_id?: string | null
          created_at?: string
          email?: string
          first_contact_on?: string
          id?: string
          last_contact_at?: string | null
          name?: string
          next_contact_on?: string | null
          notes?: string
          objective?: string
          phone?: string
          source?: string
          status?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_converted_student_id_fkey"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_actions: {
        Row: {
          action_key: string
          action_on: string
          completed_at: string
          id: string
          trainer_id: string
        }
        Insert: {
          action_key: string
          action_on?: string
          completed_at?: string
          id?: string
          trainer_id?: string
        }
        Update: {
          action_key?: string
          action_on?: string
          completed_at?: string
          id?: string
          trainer_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          completed: boolean
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          performed_on: string
          set_details: Json
          student_id: string
          training_session_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          performed_on?: string
          set_details?: Json
          student_id: string
          training_session_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          performed_on?: string
          set_details?: Json
          student_id?: string
          training_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          dedup_key: string | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          dedup_key?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dedup_key?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          created_at: string
          file_name: string
          id: string
          payment_id: string | null
          storage_path: string
          student_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          payment_id?: string | null
          storage_path: string
          student_id: string
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          payment_id?: string | null
          storage_path?: string
          student_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          charge_id: string | null
          created_at: string
          id: string
          method: string
          notes: string | null
          paid_on: string
          period_label: string | null
          recorded_by: string
          refund_reason: string | null
          refunded: boolean
          refunded_at: string | null
          student_id: string
        }
        Insert: {
          amount: number
          charge_id?: string | null
          created_at?: string
          id?: string
          method: string
          notes?: string | null
          paid_on: string
          period_label?: string | null
          recorded_by: string
          refund_reason?: string | null
          refunded?: boolean
          refunded_at?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          charge_id?: string | null
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          paid_on?: string
          period_label?: string | null
          recorded_by?: string
          refund_reason?: string | null
          refunded?: boolean
          refunded_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          end_date: string | null
          first_due_date: string
          grace_days: number
          id: string
          monthly_fee: number
          periodicity: Database["public"]["Enums"]["plan_periodicity"]
          start_date: string
          student_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          first_due_date: string
          grace_days?: number
          id?: string
          monthly_fee: number
          periodicity?: Database["public"]["Enums"]["plan_periodicity"]
          start_date: string
          student_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          first_due_date?: string
          grace_days?: number
          id?: string
          monthly_fee?: number
          periodicity?: Database["public"]["Enums"]["plan_periodicity"]
          start_date?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      progress_records: {
        Row: {
          chest_cm: number | null
          created_at: string
          hip_cm: number | null
          id: string
          measured_on: string
          notes: string
          recorded_by: string
          student_id: string
          waist_cm: number | null
          weight_kg: number
        }
        Insert: {
          chest_cm?: number | null
          created_at?: string
          hip_cm?: number | null
          id?: string
          measured_on: string
          notes?: string
          recorded_by?: string
          student_id: string
          waist_cm?: number | null
          weight_kg: number
        }
        Update: {
          chest_cm?: number | null
          created_at?: string
          hip_cm?: number | null
          id?: string
          measured_on?: string
          notes?: string
          recorded_by?: string
          student_id?: string
          waist_cm?: number | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "progress_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_goals: {
        Row: {
          completed_at: string | null
          confirmed_by: string | null
          created_at: string
          description: string
          due_on: string | null
          id: string
          initial_value: number | null
          metric: string
          name: string
          notes: string
          status: string
          student_id: string
          target_value: number | null
        }
        Insert: {
          completed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          description?: string
          due_on?: string | null
          id?: string
          initial_value?: number | null
          metric?: string
          name: string
          notes?: string
          status?: string
          student_id: string
          target_value?: number | null
        }
        Update: {
          completed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          description?: string
          due_on?: string | null
          id?: string
          initial_value?: number | null
          metric?: string
          name?: string
          notes?: string
          status?: string
          student_id?: string
          target_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_private_notes: {
        Row: {
          notes: string
          student_id: string
          updated_at: string
        }
        Insert: {
          notes?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          notes?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_private_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          accompaniment_started_on: string | null
          accompaniment_status: string
          created_at: string
          data_consent_at: string | null
          id: string
          last_access_at: string | null
          manual_block: boolean
          manual_block_at: string | null
          manual_block_reason: string | null
          photo_consent_at: string | null
          trainer_id: string | null
          trainer_notes: string | null
          user_id: string
        }
        Insert: {
          accompaniment_started_on?: string | null
          accompaniment_status?: string
          created_at?: string
          data_consent_at?: string | null
          id?: string
          last_access_at?: string | null
          manual_block?: boolean
          manual_block_at?: string | null
          manual_block_reason?: string | null
          photo_consent_at?: string | null
          trainer_id?: string | null
          trainer_notes?: string | null
          user_id: string
        }
        Update: {
          accompaniment_started_on?: string | null
          accompaniment_status?: string
          created_at?: string
          data_consent_at?: string | null
          id?: string
          last_access_at?: string | null
          manual_block?: boolean
          manual_block_at?: string | null
          manual_block_reason?: string | null
          photo_consent_at?: string | null
          trainer_id?: string | null
          trainer_notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trainer_settings: {
        Row: {
          attention_days: number
          auto_suspend: boolean
          blue_theme: string
          business_name: string
          contact_phone: string
          created_at: string
          due_soon_days: number
          invite_code: string
          logo_url: string
          message_templates: Json
          notification_preferences: Json
          payment_instructions: string
          pix_key: string
          priority_days: number
          professional_name: string
          profile_photo_url: string
          public_cta: string
          special_days: number
          suspension_days: number
          trainer_id: string
          updated_at: string
        }
        Insert: {
          attention_days?: number
          auto_suspend?: boolean
          blue_theme?: string
          business_name?: string
          contact_phone?: string
          created_at?: string
          due_soon_days?: number
          invite_code?: string
          logo_url?: string
          message_templates?: Json
          notification_preferences?: Json
          payment_instructions?: string
          pix_key?: string
          priority_days?: number
          professional_name?: string
          profile_photo_url?: string
          public_cta?: string
          special_days?: number
          suspension_days?: number
          trainer_id: string
          updated_at?: string
        }
        Update: {
          attention_days?: number
          auto_suspend?: boolean
          blue_theme?: string
          business_name?: string
          contact_phone?: string
          created_at?: string
          due_soon_days?: number
          invite_code?: string
          logo_url?: string
          message_templates?: Json
          notification_preferences?: Json
          payment_instructions?: string
          pix_key?: string
          priority_days?: number
          professional_name?: string
          profile_photo_url?: string
          public_cta?: string
          special_days?: number
          suspension_days?: number
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          finished_at: string | null
          id: string
          notes: string | null
          performed_on: string
          session_id: string
          started_at: string
          student_id: string
          version_id: string
        }
        Insert: {
          finished_at?: string | null
          id?: string
          notes?: string | null
          performed_on?: string
          session_id: string
          started_at?: string
          student_id: string
          version_id: string
        }
        Update: {
          finished_at?: string | null
          id?: string
          notes?: string | null
          performed_on?: string
          session_id?: string
          started_at?: string
          student_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "workout_versions"
            referencedColumns: ["id"]
          },
        ]
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
      workout_exercises: {
        Row: {
          alternatives: string | null
          id: string
          instructions: string | null
          muscle_group: string | null
          name: string
          notes: string | null
          position: number
          reps: string
          rest_seconds: number
          session_id: string
          sets: number
          version_id: string
          video_url: string | null
        }
        Insert: {
          alternatives?: string | null
          id?: string
          instructions?: string | null
          muscle_group?: string | null
          name: string
          notes?: string | null
          position?: number
          reps?: string
          rest_seconds?: number
          session_id: string
          sets?: number
          version_id: string
          video_url?: string | null
        }
        Update: {
          alternatives?: string | null
          id?: string
          instructions?: string | null
          muscle_group?: string | null
          name?: string
          notes?: string | null
          position?: number
          reps?: string
          rest_seconds?: number
          session_id?: string
          sets?: number
          version_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "workout_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_reviews: {
        Row: {
          action: string
          created_at: string
          id: string
          notes: string | null
          reviewer_id: string | null
          version_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          notes?: string | null
          reviewer_id?: string | null
          version_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          notes?: string | null
          reviewer_id?: string | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_reviews_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "workout_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          day_of_week: string | null
          id: string
          muscle_groups: string | null
          name: string
          notes: string | null
          position: number
          version_id: string
        }
        Insert: {
          day_of_week?: string | null
          id?: string
          muscle_groups?: string | null
          name: string
          notes?: string | null
          position?: number
          version_id: string
        }
        Update: {
          day_of_week?: string | null
          id?: string
          muscle_groups?: string | null
          name?: string
          notes?: string | null
          position?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "workout_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_versions: {
        Row: {
          ai_model: string | null
          cautions: string | null
          created_at: string
          created_by: string | null
          id: string
          progression: string | null
          published_at: string | null
          requires_clearance: boolean
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string
          status: Database["public"]["Enums"]["workout_status"]
          student_id: string
          summary: string | null
          trainer_notes: string | null
          updated_at: string
          version_number: number
          weekly_split: string | null
          workout_id: string
        }
        Insert: {
          ai_model?: string | null
          cautions?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          progression?: string | null
          published_at?: string | null
          requires_clearance?: boolean
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: Database["public"]["Enums"]["workout_status"]
          student_id: string
          summary?: string | null
          trainer_notes?: string | null
          updated_at?: string
          version_number: number
          weekly_split?: string | null
          workout_id: string
        }
        Update: {
          ai_model?: string | null
          cautions?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          progression?: string | null
          published_at?: string | null
          requires_clearance?: boolean
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: Database["public"]["Enums"]["workout_status"]
          student_id?: string
          summary?: string | null
          trainer_notes?: string | null
          updated_at?: string
          version_number?: number
          weekly_split?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_versions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_versions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          student_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          student_id: string
          title?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_student: { Args: { _student_id: string }; Returns: boolean }
      confirm_enrollment: {
        Args: {
          _fee: number
          _method: string
          _paid_on: string
          _periodicity: Database["public"]["Enums"]["plan_periodicity"]
          _student_id: string
        }
        Returns: string
      }
      convert_crm_lead: { Args: { _lead_id: string }; Returns: string }
      create_manual_workout: {
        Args: { _student_id: string; _title: string }
        Returns: string
      }
      create_workout_revision: {
        Args: { _version_id: string }
        Returns: string
      }
      get_my_payment_instructions: { Args: never; Returns: string }
      has_photo_consent: { Args: { _student_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_own_student: { Args: { _student_id: string }; Returns: boolean }
      is_trainer_of: { Args: { _student_id: string }; Returns: boolean }
      link_trainer: { Args: { _code: string }; Returns: undefined }
      log_audit: {
        Args: {
          _action: string
          _details: Json
          _entity: string
          _entity_id: string
          _student: string
        }
        Returns: undefined
      }
      make_admin: { Args: { _email: string }; Returns: undefined }
      manage_student_profile: {
        Args: {
          _birth: string
          _name: string
          _phone: string
          _student_id: string
        }
        Returns: undefined
      }
      my_access_status: { Args: never; Returns: Json }
      my_student_id: { Args: never; Returns: string }
      notify: {
        Args: {
          _body: string
          _dedup?: string
          _link: string
          _title: string
          _user: string
        }
        Returns: undefined
      }
      period_interval: {
        Args: { _p: Database["public"]["Enums"]["plan_periodicity"] }
        Returns: string
      }
      public_team_contact: { Args: never; Returns: Json }
      record_my_access: { Args: never; Returns: undefined }
      refund_payment: {
        Args: { _payment_id: string; _reason: string }
        Returns: undefined
      }
      register_payment: {
        Args: {
          _amount: number
          _charge_id: string
          _method: string
          _notes: string
          _paid_on: string
          _period_label: string
        }
        Returns: string
      }
      relationship_daily_notifications: { Args: never; Returns: undefined }
      restricted_student_access: {
        Args: { _student_id: string }
        Returns: boolean
      }
      review_workout_version: {
        Args: { _action: string; _notes: string; _version_id: string }
        Returns: undefined
      }
      run_daily_billing_notifications: { Args: never; Returns: undefined }
      safe_uuid: { Args: { _t: string }; Returns: string }
      save_ai_workout: {
        Args: { _model: string; _plan: Json; _student_id: string }
        Returns: string
      }
      set_consents: {
        Args: { _data: boolean; _photo: boolean }
        Returns: undefined
      }
      set_manual_block: {
        Args: { _blocked: boolean; _reason: string; _student_id: string }
        Returns: undefined
      }
      student_financial_status: {
        Args: { _student_id: string }
        Returns: string
      }
      student_has_access: { Args: { _student_id: string }; Returns: boolean }
      today_br: { Args: never; Returns: string }
      trainer_students_overview: {
        Args: never
        Returns: {
          assessment_status: string
          created_at: string
          email: string
          financial_status: string
          full_name: string
          has_access: boolean
          last_training: string
          monthly_fee: number
          next_due_date: string
          student_id: string
          workout_status: string
        }[]
      }
      training_open_for_me: { Args: { _ts: string }; Returns: boolean }
      update_student_management: {
        Args: { _start: string; _status: string; _student_id: string }
        Returns: undefined
      }
      upsert_plan: {
        Args: {
          _active: boolean
          _end: string
          _fee: number
          _first_due: string
          _grace: number
          _periodicity: Database["public"]["Enums"]["plan_periodicity"]
          _start: string
          _student_id: string
        }
        Returns: string
      }
      version_editable_by_trainer: {
        Args: { _version_id: string }
        Returns: boolean
      }
      version_trainer_can_read: {
        Args: { _version_id: string }
        Returns: boolean
      }
      version_visible_to_student: {
        Args: { _version_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
      plan_periodicity: "mensal" | "trimestral" | "semestral" | "anual"
      workout_status:
        | "pendente"
        | "ajustes"
        | "reprovado"
        | "aprovado"
        | "substituido"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "student"],
      plan_periodicity: ["mensal", "trimestral", "semestral", "anual"],
      workout_status: [
        "pendente",
        "ajustes",
        "reprovado",
        "aprovado",
        "substituido",
      ],
    },
  },
} as const

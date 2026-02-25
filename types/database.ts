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
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          daily_goal: number
          notification_enabled: boolean
          notification_time: string
          push_token: string | null
          push_token_registered_at: string | null
          selected_exam_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          daily_goal?: number
          notification_enabled?: boolean
          notification_time?: string
          push_token?: string | null
          push_token_registered_at?: string | null
          selected_exam_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          daily_goal?: number
          notification_enabled?: boolean
          notification_time?: string
          push_token?: string | null
          push_token_registered_at?: string | null
          selected_exam_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          exam_id: string | null
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          exam_id?: string | null
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string | null
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          category_id: string | null
          question_text: string
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          correct_answer: 'A' | 'B' | 'C' | 'D'
          explanation: string | null
          difficulty: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          question_text: string
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          correct_answer: 'A' | 'B' | 'C' | 'D'
          explanation?: string | null
          difficulty?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          question_text?: string
          choice_a?: string
          choice_b?: string
          choice_c?: string
          choice_d?: string
          correct_answer?: 'A' | 'B' | 'C' | 'D'
          explanation?: string | null
          difficulty?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_answers: {
        Row: {
          id: string
          user_id: string
          question_id: string
          selected_answer: 'A' | 'B' | 'C' | 'D'
          is_correct: boolean
          answered_at: string
          time_spent_seconds: number | null
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          selected_answer: 'A' | 'B' | 'C' | 'D'
          is_correct: boolean
          answered_at?: string
          time_spent_seconds?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          selected_answer?: 'A' | 'B' | 'C' | 'D'
          is_correct?: boolean
          answered_at?: string
          time_spent_seconds?: number | null
        }
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          previous_streak: number
          last_completed_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          previous_streak?: number
          last_completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          previous_streak?: number
          last_completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_progress: {
        Row: {
          id: string
          user_id: string
          date: string
          questions_answered: number
          questions_correct: number
          study_time_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          questions_answered?: number
          questions_correct?: number
          study_time_seconds?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          questions_answered?: number
          questions_correct?: number
          study_time_seconds?: number
          created_at?: string
        }
      }
      push_notification_log: {
        Row: {
          id: string
          user_id: string
          date: string
          slot: 'morning' | 'lunch' | 'evening' | 'night' | 'final' | 'deadline' | 'recovery'
          message_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          slot: 'morning' | 'lunch' | 'evening' | 'night' | 'final' | 'deadline' | 'recovery'
          message_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          slot?: 'morning' | 'lunch' | 'evening' | 'night' | 'final' | 'deadline' | 'recovery'
          message_id?: string
          created_at?: string
        }
      }
    }
  }
}


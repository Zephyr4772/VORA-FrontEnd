import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lgbtgdqzkepdxdiviuiy.supabase.co'
// Publishable (anon) key — safe to expose in frontend
const supabaseAnonKey = 'sb_publishable_BvNMLtAg_flBFnTqSyre6w_J9txPcYW'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
})

export type Profile = {
  id: string
  display_name: string | null
  is_guest: boolean
  created_at: string
}

export type Session = {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export type DBMessage = {
  id: string
  session_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  cases: any[]
  created_at: string
}

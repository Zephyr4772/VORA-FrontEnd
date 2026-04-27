import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lgbtgdqzkepdxdiviuiy.supabase.co'
const supabaseKey = 'sb_publishable_BvNMLtAg_flBFnTqSyre6w_J9txPcYW'

export const supabase = createClient(supabaseUrl, supabaseKey)

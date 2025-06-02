import { createClient } from '@supabase/supabase-js'

// Fallback values for production deployment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xsnoqjlzaqstwgfqqcol.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzbm9xamx6YXFzdHdnZnFxY29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4OTYwODYsImV4cCI6MjA2NDQ3MjA4Nn0.Staa0WT1ydkpXveDW6WqjxchTklXyvn2w_67VPkOpxE'

// Debug logging
console.log('Environment check:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey.substring(0, 10)
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration')
  throw new Error('Supabase configuration is missing')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Test connection
const testConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error('Supabase connection failed:', error.message)
    } else {
      console.log('✅ Supabase connection successful')
    }
  } catch (err) {
    console.error('Supabase test error:', err)
  }
}

testConnection()

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
} 
import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
  isStaff: boolean
  isViewer: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // If profile doesn't exist, create one automatically
        if (error.code === 'PGRST116') {
          await createProfile(userId)
          return
        }
        throw error
      }
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async (userId: string) => {
    try {
      const user = await supabase.auth.getUser()
      const email = user.data.user?.email || 'New User'
      const displayName = user.data.user?.user_metadata?.display_name || email

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          role: 'viewer', // Default role for new users
          display_name: displayName,
        })
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      console.log('Auto-created profile for new user:', displayName)
    } catch (error) {
      console.error('Error creating profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }

  const isAdmin = profile?.role === 'admin'
  const isStaff = profile?.role === 'staff'
  const isViewer = profile?.role === 'viewer'

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signOut,
        isAdmin,
        isStaff,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

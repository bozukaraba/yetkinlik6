import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Define user types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from Supabase on initial render
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session:', !!session);
        
        if (session?.user && mounted) {
          console.log('Found existing session for user:', session.user.id);
          await loadUserProfile(session.user);
        } else {
          console.log('No existing session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session, session?.user?.id, session?.user?.email);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            console.log('User signed in or token refreshed:', session.user.id, session.user.email);
            
            // For admin user, be more tolerant of token refresh
            const isAdminUser = session.user.email === 'yetkinlikxadmin@turksat.com.tr';
            
            // Don't reload profile on token refresh if user already exists and is admin
            if (event === 'TOKEN_REFRESHED' && currentUser) {
              if (isAdminUser && currentUser.role === 'admin') {
                console.log('Admin token refreshed, maintaining existing session');
                return;
              } else if (!isAdminUser) {
                console.log('Regular user token refreshed, maintaining existing session');
                return;
              }
            }
            
            await loadUserProfile(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (user: SupabaseUser) => {
    try {
      console.log('Loading user profile for:', user.id, user.email);
      
      // Special handling for admin user
      const isAdminEmail = user.email === 'yetkinlikxadmin@turksat.com.tr';
      
      // Reduce timeout to 3 seconds for better UX
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: User profile query took too long')), 3000)
      );
      
      // Check if user exists in our users table with timeout
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      let userData, error;
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        userData = result.data;
        error = result.error;
      } catch (timeoutError) {
        console.warn('User profile query timed out, using fallback for:', user.email);
        // Create fallback user object on timeout
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email || '',
          role: isAdminEmail ? 'admin' : 'user'
        });
        setLoading(false);
        
        // For admin user, try to fix the profile in background
        if (isAdminEmail) {
          console.log('Admin user timeout, attempting background fix...');
          setTimeout(async () => {
            try {
              await fixAdminUserProfile(user);
            } catch (bgError) {
              console.error('Background admin fix failed:', bgError);
            }
          }, 1000);
        }
        return;
      }

      console.log('User data query result:', { userData: !!userData, error: !!error, errorCode: error?.code });

      if (error) {
        console.error('Error loading user profile:', error);
        
        // If user doesn't exist in our table, create one
        if (error.code === 'PGRST116') {
          console.log('User not found in users table, creating...');
          await createUserProfile(user, isAdminEmail);
        } else {
          // Fallback user object for other errors
          console.log('Creating fallback profile for error:', error.code);
          setCurrentUser({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email || '',
            role: isAdminEmail ? 'admin' : 'user'
          });
        }
      } else {
        console.log('User profile loaded successfully:', userData);
        setCurrentUser({
          id: userData.id,
          email: userData.email,
          name: `${userData.first_name} ${userData.last_name}`.trim(),
          role: userData.role as 'user' | 'admin'
        });
      }
    } catch (error) {
      console.error('Unexpected error loading user profile:', error);
      // Always create fallback user object
      console.log('Creating fallback profile due to unexpected error');
      const isAdminEmail = user.email === 'yetkinlikxadmin@turksat.com.tr';
      setCurrentUser({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email || '',
        role: isAdminEmail ? 'admin' : 'user'
      });
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const createUserProfile = async (user: SupabaseUser, isAdmin: boolean) => {
    const nameParts = user.user_metadata?.full_name?.split(' ') || ['', ''];
    
    try {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          first_name: nameParts[0] || (isAdmin ? 'Admin' : ''),
          last_name: nameParts.slice(1).join(' ') || (isAdmin ? 'User' : ''),
          role: isAdmin ? 'admin' : 'user'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        // Create fallback profile without database insert
        console.log('Creating fallback profile');
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email || '',
          role: isAdmin ? 'admin' : 'user'
        });
      } else {
        console.log('User profile created successfully:', newUser);
        setCurrentUser({
          id: newUser.id,
          email: newUser.email,
          name: `${newUser.first_name} ${newUser.last_name}`.trim(),
          role: newUser.role as 'user' | 'admin'
        });
      }
    } catch (createError) {
      console.error('Failed to create user profile:', createError);
      // Fallback user object
      setCurrentUser({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email || '',
        role: isAdmin ? 'admin' : 'user'
      });
    }
  };

  const fixAdminUserProfile = async (user: SupabaseUser) => {
    try {
      console.log('Attempting to fix admin user profile...');
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // User doesn't exist, create it
        await createUserProfile(user, true);
      } else if (!checkError && existingUser.role !== 'admin') {
        // User exists but role is wrong, update it
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', user.id);
        
        if (!updateError) {
          console.log('Admin role fixed successfully');
        }
      }
    } catch (error) {
      console.error('Failed to fix admin user profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Starting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Login response:', { data: !!data, error: !!error });

      if (error) {
        console.error('Login error:', error);
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('User found, loading profile:', data.user.id);
        await loadUserProfile(data.user);
        console.log('Profile loaded successfully');
      } else {
        console.error('No user in login response');
        throw new Error('Giriş başarısız');
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      setLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      console.log('Registering user:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: name.split(' ')[0] || '',
            last_name: name.split(' ').slice(1).join(' ') || ''
          }
        }
      });

      if (error) {
        console.error('Auth signup error:', error);
        throw new Error(error.message);
      }

      console.log('Auth signup successful:', data);

      if (data.user) {
        // Always try to create user profile manually (trigger might not work)
        const nameParts = name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        console.log('Creating user profile manually...');
        const { data: insertData, error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            first_name: firstName,
            last_name: lastName,
            role: 'user'
          })
          .select()
          .single();

        if (profileError) {
          console.error('Manual user creation error:', profileError);
          
          // If it's a unique constraint violation, user might already exist
          if (profileError.code === '23505') {
            console.log('User already exists in users table, continuing...');
          } else {
            console.error('Failed to create user profile, but continuing with auth user');
          }
        } else {
          console.log('User profile created successfully:', insertData);
        }

        await loadUserProfile(data.user);
      }
    } catch (error) {
      console.error('Kayıt hatası:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase logout error:', error);
        throw error;
      }
      
      console.log('Logout successful, clearing user state');
      setCurrentUser(null);
    } catch (error) {
      console.error('Çıkış hatası:', error);
      // Even if logout fails, clear the user state
      setCurrentUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    console.log('isAdmin check:', { 
      currentUser: !!currentUser, 
      role: currentUser?.role, 
      email: currentUser?.email,
      isAdmin: currentUser?.role === 'admin' || currentUser?.email === 'yetkinlikxadmin@turksat.com.tr'
    });
    return currentUser?.role === 'admin' || currentUser?.email === 'yetkinlikxadmin@turksat.com.tr';
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
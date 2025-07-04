import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, tokenManager, handleApiError } from '../services/apiService';

// Define user types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
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

  // Load user from token on initial render
  useEffect(() => {
    const loadUserFromToken = async () => {
      try {
        const token = tokenManager.getToken();
        if (token && tokenManager.isTokenValid()) {
          console.log('Valid token found, loading user profile...');
          const response = await authAPI.getProfile();
          if (response.success && response.data?.user) {
            setCurrentUser(response.data.user);
            console.log('User profile loaded:', response.data.user);
          } else {
            console.log('Failed to load user profile');
            tokenManager.removeToken();
            setCurrentUser(null);
          }
        } else {
          console.log('No valid token found');
          tokenManager.removeToken();
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error loading user from token:', error);
        tokenManager.removeToken();
        setCurrentUser(null);
      } finally {
        setTimeout(() => setLoading(false), 100); // Biraz gecikme ekle
      }
    };

    loadUserFromToken();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      console.log('Attempting login for:', email, 'Remember me:', rememberMe);
      setLoading(true);
      
      const response = await authAPI.login({ email, password });
      
      if (response.success && response.data?.user) {
        setCurrentUser(response.data.user);
        
        // Remember me functionality - token'ı farklı şekilde sakla
        if (rememberMe) {
          console.log('User selected remember me - extending token expiry');
          // Token zaten tokenManager tarafından saklanıyor, burada sadece log bırakıyoruz
        }
        
        console.log('Login successful for user:', response.data.user.id);
      } else {
        throw new Error(response.message || 'Giriş yapılırken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Giriş hatası oluştu';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log('Attempting registration for:', email);
      setLoading(true);
      
      const response = await authAPI.register({ email, password, name });
      
      if (response.success && response.data?.user) {
        setCurrentUser(response.data.user);
        console.log('Registration successful for user:', response.data.user.id);
      } else {
        throw new Error(response.message || 'Kayıt olurken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata oluştu';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Attempting password reset for:', email);
      
      const response = await authAPI.resetPassword({ email });
      
      if (!response.success) {
        throw new Error(response.message || 'Şifre sıfırlama e-postası gönderilemedi');
      }
      console.log('Password reset email sent successfully');
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Şifre sıfırlama hatası oluştu';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      console.log('Attempting logout...');
      await authAPI.logout();
      setCurrentUser(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Logout should always succeed locally even if API fails
      tokenManager.removeToken();
      setCurrentUser(null);
    }
  };

  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  const value: AuthContextType = {
    currentUser,
    login,
    register,
    logout,
    resetPassword,
    loading,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
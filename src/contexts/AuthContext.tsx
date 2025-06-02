import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  logout: () => void;
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

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Kullanıcı bilgisi çözümlenemedi:', error);
        localStorage.removeItem('user'); // Geçersiz veriyi temizle
      }
    }
    setLoading(false);
  }, []);

  // Mock login function (in a real app, this would make an API request)
  const login = async (email: string, password: string) => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      // For demo purposes: admin user check
      const isAdminUser = email.includes('admin');
      
      // Persistant user ID - aynı e-posta için her zaman aynı ID kullan
      const userId = `user-${btoa(email.toLowerCase()).replace(/[+/=]/g, '')}`;
      
      const user: User = {
        id: userId,
        email,
        name: email.split('@')[0],
        role: isAdminUser ? 'admin' : 'user'
      };
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
    } catch (error) {
      console.error('Giriş hatası:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      // Persistant user ID - aynı e-posta için her zaman aynı ID kullan
      const userId = `user-${btoa(email.toLowerCase()).replace(/[+/=]/g, '')}`;
      
      const user: User = {
        id: userId,
        email,
        name,
        role: 'user'
      };
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
    } catch (error) {
      console.error('Kayıt hatası:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const isAdmin = () => {
    return currentUser?.role === 'admin';
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
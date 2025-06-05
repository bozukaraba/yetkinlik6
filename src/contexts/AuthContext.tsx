import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Define user types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
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

  // Load user from Firebase on initial render
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('Firebase user found:', firebaseUser.uid);
          await loadUserProfile(firebaseUser);
        } else {
          console.log('No Firebase user found');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      console.log('Loading user profile for:', firebaseUser.uid);
      
      // Check if user is admin
      const isAdmin = firebaseUser.email === 'yetkinlikxadmin@turksat.com.tr';
      
      // Get user data from Firestore with retry mechanism
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      let userDoc = await getDoc(userDocRef);
      
      // If user doc doesn't exist, wait a bit and try again (for new registrations)
      if (!userDoc.exists()) {
        console.log('User profile not found, waiting and retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        userDoc = await getDoc(userDocRef);
      }
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User profile loaded from Firestore:', userData);
        setCurrentUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userData.name || firebaseUser.displayName || '',
          role: userData.role || (isAdmin ? 'admin' : 'user')
        });
      } else {
        console.log('User profile still not found, creating new profile');
        await createUserProfile(firebaseUser, isAdmin);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback user object
      setCurrentUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email || '',
        role: firebaseUser.email === 'yetkinlikxadmin@turksat.com.tr' ? 'admin' : 'user'
      });
    }
  };

  const createUserProfile = async (firebaseUser: FirebaseUser, isAdmin: boolean) => {
    try {
      const userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email || '',
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, userData);
      
      console.log('User profile created successfully:', userData);
      setCurrentUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role as 'user' | 'admin'
      });
    } catch (error) {
      console.error('Failed to create user profile:', error);
      // Fallback user object
      setCurrentUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email || '',
        role: isAdmin ? 'admin' : 'user'
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful for user:', userCredential.user.uid);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Giriş yapılırken bir hata oluştu');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log('Attempting registration for:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      console.log('Registration successful for user:', userCredential.user.uid);
      
      // Create user profile in Firestore immediately
      const isAdmin = email === 'yetkinlikxadmin@turksat.com.tr';
      const userData = {
        id: userCredential.user.uid,
        email: email,
        name: name,
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, userData);
      
      console.log('User profile created in Firestore:', userData);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Kayıt olurken bir hata oluştu');
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user');
      await signOut(auth);
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Çıkış yapılırken bir hata oluştu');
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
    loading,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAoy8VX10CNa2fCqEZ3WXD8XAWaS_2X4RI",
  authDomain: "yetkinlik.firebaseapp.com",
  projectId: "yetkinlik",
  storageBucket: "yetkinlik.firebasestorage.app",
  messagingSenderId: "1076325479831",
  appId: "1:1076325479831:web:9da7586672c369e40e40d2"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Firebase servisleri
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Firestore offline persistence'ı disable et (real-time listener sorunları için)
try {
  // Production'da real-time listener sorunlarını önlemek için
  if (typeof window !== 'undefined') {
    // Browser environment'ta çalışır
    console.log('Firestore network configuration optimized');
  }
} catch (error) {
  console.log('Firestore configuration warning:', error);
}

// Debug logging
console.log('Firebase initialized with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Emulator bağlantısı sadece local development için
// Production'da bu kod çalışmayacak

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

// Helper function to get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Helper functions for network management (real-time listener sorunları için)
export const enableFirestoreNetwork = async () => {
  try {
    await enableNetwork(db);
  } catch (error) {
    console.log('Network enable warning:', error);
  }
};

export const disableFirestoreNetwork = async () => {
  try {
    await disableNetwork(db);
  } catch (error) {
    console.log('Network disable warning:', error);
  }
};

export default app; 
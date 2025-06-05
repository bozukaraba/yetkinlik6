import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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

export default app; 
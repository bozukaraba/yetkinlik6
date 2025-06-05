import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAoy8VX10CNa2fCqEZ3WXD8XAWaS_2X4RI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "yetkinlik.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "yetkinlik",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "yetkinlik.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1076325479831",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1076325479831:web:9da7586672c369e40e40d2"
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

// Geliştirme ortamında emulator kullan
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('Firebase emulators connected');
  } catch (error) {
    console.log('Firebase emulators already connected or not available');
  }
}

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

// Helper function to get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

export default app; 
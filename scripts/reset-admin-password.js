import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAoy8VX10CNa2fCqEZ3WXD8XAWaS_2X4RI",
  authDomain: "yetkinlik.firebaseapp.com",
  projectId: "yetkinlik",
  storageBucket: "yetkinlik.firebasestorage.app",
  messagingSenderId: "1076325479831",
  appId: "1:1076325479831:web:9da7586672c369e40e40d2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function resetAdminPassword() {
  const adminEmail = 'yetkinlikxadmin@turksat.com.tr';
  
  try {
    // Önce mevcut şifre ile giriş deneyelim
    console.log('Mevcut şifre ile giriş deneniyor...');
    await signInWithEmailAndPassword(auth, adminEmail, 'TkSat2024!@Admin#CV');
    console.log('✓ Admin girişi başarılı! Şifre doğru.');
    
  } catch (error) {
    console.log('Mevcut şifre ile giriş başarısız:', error.code);
    
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      console.log('Şifre sıfırlama emaili gönderiliyor...');
      
      try {
        await sendPasswordResetEmail(auth, adminEmail);
        console.log('✓ Şifre sıfırlama emaili gönderildi:', adminEmail);
        console.log('Email\'inizi kontrol edin ve şifrenizi sıfırlayın.');
      } catch (resetError) {
        console.error('Şifre sıfırlama hatası:', resetError.message);
      }
    }
  }
  
  console.log('\nAdmin Giriş Bilgileri:');
  console.log('Email:', adminEmail);
  console.log('Şifre: Email ile sıfırlayın veya TkSat2024!@Admin#CV');
  
  process.exit(0);
}

resetAdminPassword(); 
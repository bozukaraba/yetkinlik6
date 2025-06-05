import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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
const db = getFirestore(app);

async function createAdmin() {
  try {
    const adminEmail = 'yetkinlikxadmin@turksat.com.tr';
    const adminPassword = 'TkSat2024!@Admin#CV';
    
    console.log('Admin kullanıcısı oluşturuluyor...');
    
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    console.log('Admin kullanıcısı oluşturuldu:', user.uid);
    
    // Firestore'da admin profili oluştur
    await setDoc(doc(db, 'users', user.uid), {
      email: adminEmail,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Admin profili Firestore\'da oluşturuldu');
    console.log('Giriş bilgileri:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('UID:', user.uid);
    
  } catch (error) {
    console.error('Hata:', error.message);
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin kullanıcısı zaten mevcut.');
    }
  }
  
  process.exit(0);
}

createAdmin(); 
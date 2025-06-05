import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase config directly for script
const firebaseConfig = {
  apiKey: "AIzaSyAoy8VX10CNa2fCqEZ3WXD8XAWaS_2X4RI",
  authDomain: "yetkinlik.firebaseapp.com",
  projectId: "yetkinlik",
  storageBucket: "yetkinlik.firebasestorage.app",
  messagingSenderId: "1076325479831",
  appId: "1:1076325479831:web:9da7586672c369e40e40d2"
};

// Initialize Firebase for script
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const createAdminUser = async () => {
  try {
    console.log('🔄 Admin kullanıcısı oluşturuluyor...');
    
    const adminEmail = 'yetkinlikxadmin@turksat.com.tr';
    const adminPassword = 'TkSat2024!@Admin#CV';
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    
    // Update display name
    await updateProfile(userCredential.user, {
      displayName: 'Yetkinlikx Admin'
    });

    console.log('✅ Admin kullanıcısı Authentication\'da oluşturuldu:', userCredential.user.uid);

    // Insert into users collection in Firestore
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userDocRef, {
      id: userCredential.user.uid,
      email: adminEmail,
      name: 'Yetkinlikx Admin',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Admin kullanıcısı Firestore\'da oluşturuldu!');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('🆔 UID:', userCredential.user.uid);
    
    console.log('\n🎉 Admin hesabı başarıyla oluşturuldu!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Admin kullanıcısı oluşturulurken hata:', error.message);
    process.exit(1);
  }
};

// Run the script
createAdminUser(); 
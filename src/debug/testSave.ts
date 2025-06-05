import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const testCVSave = async () => {
  try {
    console.log('=== CV KAYDETME TESTİ BAŞLADI ===');
    
    // 1. Auth kontrolü
    const currentUser = auth.currentUser;
    
    console.log('Auth durumu:', {
      hasUser: !!currentUser,
      userId: currentUser?.uid,
      userEmail: currentUser?.email
    });
    
    if (!currentUser) {
      console.error('Kullanıcı oturumu bulunamadı');
      return;
    }
    
    // 2. Users koleksiyonunu kontrol et
    console.log('Users koleksiyonunu kontrol ediliyor...');
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    console.log('User data:', userDoc.exists() ? userDoc.data() : 'User not found');
    
    // 3. CV koleksiyonunu kontrol et
    console.log('CV koleksiyonunu kontrol ediliyor...');
    const cvDocRef = doc(db, 'cvs', currentUser.uid);
    const cvDoc = await getDoc(cvDocRef);
    
    console.log('CV data:', cvDoc.exists() ? cvDoc.data() : 'CV not found');
    
    // 4. Basit CV oluşturmayı dene
    console.log('Basit CV oluşturuluyor...');
    const testCV = {
      userId: currentUser.uid,
      personalInfo: {
        firstName: 'Test',
        lastName: 'User',
        email: currentUser.email
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(cvDocRef, testCV, { merge: true });
    console.log('Test CV başarıyla oluşturuldu');
    
    // 5. CV'yi tekrar oku
    const updatedCvDoc = await getDoc(cvDocRef);
    console.log('Updated CV data:', updatedCvDoc.data());

    console.log('=== TEST TAMAMLANDI ===');
  } catch (error) {
    console.error('Test hatası:', error);
  }
};

// Global olarak erişilebilir yap
(window as any).testCVSave = testCVSave; 
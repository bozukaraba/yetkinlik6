import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export const checkAdminUser = async () => {
  try {
    console.log('🔍 Admin kullanıcı kontrol ediliyor...');
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('❌ Oturum açmış kullanıcı bulunamadı');
      return;
    }

    console.log('Current user:', currentUser.email, currentUser.uid);
    
    // Check if user exists in Firestore users collection
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ Kullanıcı Firestore\'da bulundu:', {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        name: userData.name
      });
      
      if (userData.role !== 'admin' && currentUser.email === 'yetkinlikxadmin@turksat.com.tr') {
        console.log('🔄 Admin rolü güncelleniyor...');
        
        await updateDoc(userDocRef, {
          role: 'admin',
          updatedAt: new Date()
        });
        
        console.log('✅ Admin rolü başarıyla güncellendi');
      }
    } else {
      console.log('❌ Kullanıcı Firestore\'da bulunamadı');
    }
    
  } catch (error) {
    console.error('❌ Admin kontrol hatası:', error);
  }
};

export const fixAdminUser = async () => {
  try {
    console.log('🔧 Admin kullanıcı düzeltiliyor...');
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('❌ Oturum açmış kullanıcı bulunamadı');
      return;
    }
    
    console.log('Current auth user:', currentUser.email);
    
    if (currentUser.email === 'yetkinlikxadmin@turksat.com.tr') {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // User doesn't exist, create it
        console.log('🔄 Admin kullanıcı oluşturuluyor...');
        await setDoc(userDocRef, {
          id: currentUser.uid,
          email: currentUser.email,
          name: 'Yetkinlikx Admin',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log('✅ Admin kullanıcı başarıyla oluşturuldu');
      } else {
        // User exists, update role if needed
        const userData = userDoc.data();
        if (userData.role !== 'admin') {
          console.log('🔄 Admin rolü güncelleniyor...');
          await updateDoc(userDocRef, {
            role: 'admin',
            updatedAt: new Date()
          });
          
          console.log('✅ Admin rolü başarıyla güncellendi');
        } else {
          console.log('✅ Admin kullanıcı zaten doğru role sahip');
        }
      }
    } else {
      console.log('❌ Mevcut kullanıcı admin değil');
    }
    
  } catch (error) {
    console.error('❌ Admin düzeltme hatası:', error);
  }
};

// Make functions available globally for testing
(window as any).checkAdminUser = checkAdminUser;
(window as any).fixAdminUser = fixAdminUser; 
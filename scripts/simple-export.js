// Firebase web SDK kullanarak basit export
// Bu script tarayıcıda çalışır, Node.js'de değil

const exportFirestoreData = async () => {
  // Firebase modüllerini import et
  const { initializeApp } = await import('firebase/app');
  const { getFirestore, collection, getDocs } = await import('firebase/firestore');
  
  // Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyAoy8VX10CNa2fCqEZ3WXD8XAWaS_2X4RI",
    authDomain: "yetkinlik.firebaseapp.com",
    projectId: "yetkinlik",
    storageBucket: "yetkinlik.firebasestorage.app",
    messagingSenderId: "1076325479831",
    appId: "1:1076325479831:web:9da7586672c369e40e40d2"
  };
  
  // Firebase'i initialize et
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('Starting Firestore export...');
  
  const exportData = {
    timestamp: new Date().toISOString(),
    collections: {}
  };
  
  // CVs koleksiyonunu export et
  try {
    const cvsSnapshot = await getDocs(collection(db, 'cvs'));
    const cvsData = {};
    
    cvsSnapshot.forEach((doc) => {
      cvsData[doc.id] = doc.data();
    });
    
    exportData.collections.cvs = cvsData;
    console.log(`✓ Exported CVs: ${Object.keys(cvsData).length} documents`);
  } catch (error) {
    console.error('Error exporting CVs:', error);
  }
  
  // Users koleksiyonunu export et  
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersData = {};
    
    usersSnapshot.forEach((doc) => {
      usersData[doc.id] = doc.data();
    });
    
    exportData.collections.users = usersData;
    console.log(`✓ Exported Users: ${Object.keys(usersData).length} documents`);
  } catch (error) {
    console.error('Error exporting Users:', error);
  }
  
  // JSON olarak indir
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `firestore-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('✅ Export completed and downloaded!');
  
  return exportData;
};

// Export fonksiyonunu global olarak kullanılabilir yap
window.exportFirestoreData = exportFirestoreData; 
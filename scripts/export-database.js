const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase Admin SDK'yi service account ile initialize et
// NOT: Bu script için service account key dosyası gerekir
const serviceAccount = {
  "type": "service_account",
  "project_id": "yetkinlik",
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'yetkinlik'
});

const db = admin.firestore();

async function exportCollection(collectionName) {
  console.log(`Exporting collection: ${collectionName}`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const data = {};
    
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    
    return data;
  } catch (error) {
    console.error(`Error exporting collection ${collectionName}:`, error);
    return {};
  }
}

async function exportDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportDir = path.join(__dirname, '..', 'database-export', `firestore-backup-${timestamp}`);
  
  // Export dizinini oluştur
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  console.log('Starting database export...');
  
  // Ana koleksiyonları export et
  const collections = ['cvs', 'users']; // Ana koleksiyonlarınızı buraya ekleyin
  
  const exportData = {
    timestamp: new Date().toISOString(),
    collections: {}
  };
  
  for (const collectionName of collections) {
    try {
      const collectionData = await exportCollection(collectionName);
      exportData.collections[collectionName] = collectionData;
      console.log(`✓ Exported ${collectionName}: ${Object.keys(collectionData).length} documents`);
    } catch (error) {
      console.error(`✗ Failed to export ${collectionName}:`, error);
    }
  }
  
  // JSON dosyasına yaz
  const exportPath = path.join(exportDir, 'firestore-data.json');
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  
  console.log(`\n✅ Database export completed!`);
  console.log(`📁 Export location: ${exportPath}`);
  console.log(`📊 Total collections: ${collections.length}`);
  
  // Özet bilgi
  Object.entries(exportData.collections).forEach(([name, data]) => {
    console.log(`   - ${name}: ${Object.keys(data).length} documents`);
  });
  
  process.exit(0);
}

// Script çalıştır
exportDatabase().catch(error => {
  console.error('Export failed:', error);
  process.exit(1);
}); 
import { testConnection } from '../lib/database';
import { initializeTables } from '../services/postgresService';

const initDatabase = async () => {
  console.log('PostgreSQL veritabanı bağlantısı test ediliyor...');
  
  const connectionSuccess = await testConnection();
  
  if (!connectionSuccess) {
    console.error('Veritabanı bağlantısı başarısız!');
    process.exit(1);
  }
  
  console.log('Veritabanı tabloları oluşturuluyor...');
  
  try {
    await initializeTables();
    console.log('Veritabanı başarıyla initialize edildi!');
  } catch (error) {
    console.error('Veritabanı initialize hatası:', error);
    process.exit(1);
  }
};

// Script çalıştırıldığında
if (typeof window === 'undefined') {
  initDatabase();
}

export { initDatabase }; 
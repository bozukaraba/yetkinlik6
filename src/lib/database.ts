import { Pool } from 'pg';

// PostgreSQL bağlantı konfigürasyonu
const poolConfig = {
  host: '10.101.15.130',
  port: 6432,
  database: 'yetkinlik_prod',
  user: 'yetkinlik_appuser',
  password: 'Vaethe!ePhaesoZ2eiPhooKo',
  max: 20, // maksimum bağlantı sayısı
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false // Türksat sunucusu için SSL kapalı
};

// Admin kullanıcı için ayrı pool
const adminPoolConfig = {
  host: '10.101.15.130',
  port: 6432,
  database: 'yetkinlik_prod',
  user: 'ukotbas',
  password: 'shie0hieKohhie!leig0eequ',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false
};

// PostgreSQL bağlantı havuzları
export const db = new Pool(poolConfig);
export const adminDb = new Pool(adminPoolConfig);

// Bağlantı test fonksiyonu
export const testConnection = async () => {
  try {
    const client = await db.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('PostgreSQL bağlantısı başarılı:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('PostgreSQL bağlantı hatası:', error);
    return false;
  }
};

// Database helper fonksiyonları
export const query = async (text: string, params?: any[]) => {
  const client = await db.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export const adminQuery = async (text: string, params?: any[]) => {
  const client = await adminDb.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Uygulama kapatılırken bağlantıları temizle
process.on('SIGINT', () => {
  db.end();
  adminDb.end();
  process.exit(0);
}); 
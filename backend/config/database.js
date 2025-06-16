import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL bağlantı konfigürasyonu
const poolConfig = {
  host: process.env.DB_HOST || '10.101.15.130',
  port: parseInt(process.env.DB_PORT) || 6432,
  database: process.env.DB_NAME || 'yetkinlik_prod',
  user: process.env.DB_USER || 'yetkinlik_appuser',
  password: process.env.DB_PASSWORD || 'Vaethe!ePhaesoZ2eiPhooKo',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false
};

// Admin kullanıcı için ayrı pool
const adminPoolConfig = {
  host: process.env.DB_HOST || '10.101.15.130',
  port: parseInt(process.env.DB_PORT) || 6432,
  database: process.env.DB_NAME || 'yetkinlik_prod',
  user: process.env.DB_ADMIN_USER || 'ukotbas',
  password: process.env.DB_ADMIN_PASSWORD || 'shie0hieKohhie!leig0eequ',
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
export const query = async (text, params = []) => {
  const client = await db.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export const adminQuery = async (text, params = []) => {
  const client = await adminDb.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.end();
  await adminDb.end();
  process.exit(0);
}); 
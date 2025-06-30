import { Pool } from 'pg';
import dotenv from 'dotenv';
import { mockDB, testMockConnection } from './mockDatabase.js';

dotenv.config();

// Mock mode flag - Production database kullan
const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true';

// PostgreSQL bağlantı konfigürasyonu
const poolConfig = {
  host: process.env.DB_HOST || '10.101.15.130',
  port: parseInt(process.env.DB_PORT) || 6432,
  database: process.env.DB_NAME || 'yetkinlik_prod',
  user: process.env.DB_USER || 'yetkinlik_appuser',
  password: process.env.DB_PASSWORD || 'Vaethe!ePhaesoZ2eiPhooKo',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
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
  connectionTimeoutMillis: 10000,
  ssl: false
};

// PostgreSQL bağlantı havuzları
export const db = new Pool(poolConfig);
export const adminDb = new Pool(adminPoolConfig);

// Database initialization
const initDatabaseStructure = async () => {
  try {
    console.log('🔧 Database yapısı kontrol ediliyor...');
    
    // Users tablosu kontrol
    const checkUsersTable = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public';
    `;
    
    const userColumns = await adminDb.query(checkUsersTable);
    const columnNames = userColumns.rows.map(row => row.column_name);
    
    // password_hash kolonu yoksa ekle
    if (!columnNames.includes('password_hash')) {
      console.log('password_hash kolonu ekleniyor...');
      await adminDb.query('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)');
    }
    
    // Kullanıcı izinlerini ver
    await adminDb.query('GRANT SELECT, INSERT, UPDATE ON users TO yetkinlik_appuser');
    await adminDb.query('GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO yetkinlik_appuser');
    await adminDb.query('GRANT SELECT, INSERT, UPDATE, DELETE ON cvs TO yetkinlik_appuser');
    
    console.log('✅ Database yapısı hazır');
  } catch (error) {
    console.error('⚠️ Database init hatası (devam ediliyor):', error.message);
  }
};

// Bağlantı test fonksiyonu
export const testConnection = async () => {
  if (USE_MOCK_DB) {
    return await testMockConnection();
  }
  
  try {
    const client = await db.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('PostgreSQL bağlantısı başarılı:', result.rows[0]);
    
    // Database yapısını init et
    await initDatabaseStructure();
    
    return true;
  } catch (error) {
    console.error('PostgreSQL bağlantı hatası:', error);
    console.log('❌ Veritabanı bağlantısı başarısız!');
    console.log('🔗 Lütfen veritabanı bağlantı ayarlarını kontrol edin.');
    return false;
  }
};

// Database helper fonksiyonları
export const query = async (text, params = []) => {
  if (process.env.USE_MOCK_DB === 'true') {
    return await mockQuery(text, params);
  }
  
  const client = await db.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Mock query handler
const mockQuery = async (text, params = []) => {
  const sql = text.toLowerCase().trim();
  
  if (sql.includes('select') && sql.includes('from users') && sql.includes('email')) {
    const email = params[0];
    const user = await mockDB.findUserByEmail(email);
    return { rows: user ? [user] : [] };
  }
  
  if (sql.includes('select') && sql.includes('from users') && sql.includes('id')) {
    const id = params[0];
    const user = await mockDB.findUserById(id);
    return { rows: user ? [user] : [] };
  }
  
  if (sql.includes('insert into users')) {
    const [id, email, passwordHash, name] = params;
    const user = await mockDB.createUser({ id, email, password_hash: passwordHash, name });
    return { rows: [user] };
  }
  
  if (sql.includes('select') && sql.includes('from users') && !sql.includes('email') && !sql.includes('id =')) {
    const users = await mockDB.getAllUsers();
    return { rows: users };
  }
  
  if (sql.includes('select') && sql.includes('from cvs')) {
    if (sql.includes('user_id')) {
      const userId = params[0];
      const cv = await mockDB.findCVByUserId(userId);
      return { rows: cv ? [cv] : [] };
    } else {
      const cvs = await mockDB.getAllCVs();
      return { rows: cvs };
    }
  }
  
  if (sql.includes('insert into cvs') || sql.includes('update cvs')) {
    const userId = sql.includes('insert') ? params[0] : params[1];
    const data = sql.includes('insert') ? JSON.parse(params[1]) : JSON.parse(params[0]);
    const cv = await mockDB.saveCVData(userId, data);
    return { rows: [cv] };
  }
  
  if (sql.includes('delete from cvs')) {
    const userId = params[0];
    const deleted = await mockDB.deleteCVByUserId(userId);
    return { rowCount: deleted ? 1 : 0 };
  }
  
  if (sql.includes('insert into sessions')) {
    const [userId, tokenHash, expiresAt] = params;
    const session = await mockDB.createSession(userId, tokenHash, expiresAt);
    return { rows: [session] };
  }
  
  if (sql.includes('select') && sql.includes('from sessions')) {
    const [userId, tokenHash] = params;
    const session = await mockDB.findValidSession(userId, tokenHash);
    return { rows: session ? [session] : [] };
  }
  
  if (sql.includes('delete from sessions')) {
    const [userId, tokenHash] = params;
    const deleted = await mockDB.deleteSession(userId, tokenHash);
    return { rowCount: deleted ? 1 : 0 };
  }
  
  return { rows: [] };
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
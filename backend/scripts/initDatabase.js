import { testConnection, adminQuery } from '../config/database.js';

const initializeTables = async () => {
  try {
    // Users tablosu
    await adminQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        name VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // CVs tablosu
    await adminQuery(`
      CREATE TABLE IF NOT EXISTS cvs (
        user_id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Sessions tablosu (JWT token'lar için)
    await adminQuery(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Index'ler
    await adminQuery(`CREATE INDEX IF NOT EXISTS idx_cvs_updated_at ON cvs(updated_at DESC)`);
    await adminQuery(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
    await adminQuery(`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`);

    // Admin kullanıcı oluştur (eğer yoksa)
    await adminQuery(`
      INSERT INTO users (id, email, password_hash, role, name)
      VALUES ('admin-user', 'admin@turksat.com.tr', '$2a$10$defaultAdminPasswordHash', 'admin', 'System Admin')
      ON CONFLICT (email) DO NOTHING
    `);

    console.log('✅ Veritabanı tabloları başarıyla oluşturuldu');
  } catch (error) {
    console.error('❌ Tablo oluşturma hatası:', error);
    throw error;
  }
};

const initDatabase = async () => {
  try {
    console.log('🔧 Database tabloları kontrol ediliyor...');

    // Users tablosu kontrol ve düzeltme
    const checkUsersTable = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public';
    `;
    
    const userColumns = await adminQuery(checkUsersTable);
    const columnNames = userColumns.rows.map(row => row.column_name);
    
    console.log('Mevcut users tablosu kolonları:', columnNames);
    
    // password_hash kolonu yoksa ekle
    if (!columnNames.includes('password_hash')) {
      console.log('password_hash kolonu ekleniyor...');
      await adminQuery('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)');
    }
    
    // role kolonu yoksa ekle
    if (!columnNames.includes('role')) {
      console.log('role kolonu ekleniyor...');
      await adminQuery('ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT \'user\'');
    }
    
    // is_active kolonu yoksa ekle
    if (!columnNames.includes('is_active')) {
      console.log('is_active kolonu ekleniyor...');
      await adminQuery('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true');
    }
    
    // yetkinlik_appuser kullanıcısına izin ver
    console.log('Kullanıcı izinleri kontrol ediliyor...');
    await adminQuery('GRANT SELECT, INSERT, UPDATE ON users TO yetkinlik_appuser');
    await adminQuery('GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO yetkinlik_appuser');
    await adminQuery('GRANT SELECT, INSERT, UPDATE, DELETE ON cvs TO yetkinlik_appuser');
    
    console.log('✅ Database tabloları hazır');
    
  } catch (error) {
    console.error('❌ Database init hatası:', error);
    throw error;
  }
};

// Script doğrudan çalıştırılırsa
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase().then(() => {
    console.log('Database init tamamlandı');
    process.exit(0);
  }).catch(error => {
    console.error('Database init başarısız:', error);
    process.exit(1);
  });
}

export { initDatabase }; 
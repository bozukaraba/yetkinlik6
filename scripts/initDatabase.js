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
  console.log('🔗 PostgreSQL veritabanı bağlantısı test ediliyor...');
  
  const connectionSuccess = await testConnection();
  
  if (!connectionSuccess) {
    console.error('❌ Veritabanı bağlantısı başarısız!');
    process.exit(1);
  }
  
  console.log('📋 Veritabanı tabloları oluşturuluyor...');
  
  try {
    await initializeTables();
    console.log('🎉 Veritabanı başarıyla initialize edildi!');
  } catch (error) {
    console.error('❌ Veritabanı initialize hatası:', error);
    process.exit(1);
  }
};

initDatabase(); 
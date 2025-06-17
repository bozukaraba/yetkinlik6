import { adminDb } from '../config/database.js';

const fixDatabase = async () => {
  try {
    console.log('🔧 Database sorunları düzeltiliyor...');

    // 1. Users tablosuna password_hash kolonu ekle
    console.log('1. password_hash kolonu kontrol ediliyor...');
    try {
      await adminDb.query('SELECT password_hash FROM users LIMIT 1');
      console.log('✅ password_hash kolonu zaten mevcut');
    } catch (error) {
      if (error.code === '42703') {
        console.log('➕ password_hash kolonu ekleniyor...');
        await adminDb.query('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)');
        console.log('✅ password_hash kolonu eklendi');
      } else {
        throw error;
      }
    }

    // 2. Role kolonu kontrol et ve ekle
    console.log('2. role kolonu kontrol ediliyor...');
    try {
      await adminDb.query('SELECT role FROM users LIMIT 1');
      console.log('✅ role kolonu zaten mevcut');
    } catch (error) {
      if (error.code === '42703') {
        console.log('➕ role kolonu ekleniyor...');
        await adminDb.query('ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT \'user\'');
        console.log('✅ role kolonu eklendi');
      } else {
        throw error;
      }
    }

    // 3. is_active kolonu kontrol et ve ekle
    console.log('3. is_active kolonu kontrol ediliyor...');
    try {
      await adminDb.query('SELECT is_active FROM users LIMIT 1');
      console.log('✅ is_active kolonu zaten mevcut');
    } catch (error) {
      if (error.code === '42703') {
        console.log('➕ is_active kolonu ekleniyor...');
        await adminDb.query('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true');
        console.log('✅ is_active kolonu eklendi');
      } else {
        throw error;
      }
    }

    // 4. Created_at ve updated_at kolonları
    console.log('4. timestamp kolonları kontrol ediliyor...');
    try {
      await adminDb.query('SELECT created_at, updated_at FROM users LIMIT 1');
      console.log('✅ timestamp kolonları zaten mevcut');
    } catch (error) {
      if (error.code === '42703') {
        console.log('➕ timestamp kolonları ekleniyor...');
        await adminDb.query(`
          ALTER TABLE users 
          ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✅ timestamp kolonları eklendi');
      } else {
        throw error;
      }
    }

    // 5. yetkinlik_appuser izinlerini ver
    console.log('5. Kullanıcı izinleri veriliyor...');
    const permissions = [
      'GRANT SELECT, INSERT, UPDATE ON users TO yetkinlik_appuser',
      'GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO yetkinlik_appuser',
      'GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO yetkinlik_appuser',
      'GRANT USAGE, SELECT ON SEQUENCE sessions_id_seq TO yetkinlik_appuser',
      'GRANT SELECT, INSERT, UPDATE, DELETE ON cvs TO yetkinlik_appuser',
      'GRANT USAGE, SELECT ON SEQUENCE cvs_id_seq TO yetkinlik_appuser'
    ];

    for (const permission of permissions) {
      try {
        await adminDb.query(permission);
        console.log(`✅ İzin verildi: ${permission.split(' ')[3]}`);
      } catch (error) {
        console.log(`⚠️  İzin hatası (devam ediliyor): ${error.message}`);
      }
    }

    // 6. Tablolara trigger ekle (updated_at otomatik güncellemesi için)
    console.log('6. Trigger oluşturuluyor...');
    try {
      await adminDb.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      await adminDb.query(`
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
      
      console.log('✅ Trigger oluşturuldu');
    } catch (error) {
      console.log(`⚠️  Trigger hatası (devam ediliyor): ${error.message}`);
    }

    console.log('🎉 Database düzeltmeleri tamamlandı!');
    
    // Test sorgusu
    const testResult = await adminDb.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'users\' ORDER BY column_name');
    console.log('📋 Users tablosu kolonları:', testResult.rows.map(r => r.column_name));

  } catch (error) {
    console.error('❌ Database düzeltme hatası:', error);
    throw error;
  }
};

// Script doğrudan çalıştırılırsa
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDatabase().then(() => {
    console.log('Database fix tamamlandı');
    process.exit(0);
  }).catch(error => {
    console.error('Database fix başarısız:', error);
    process.exit(1);
  });
}

export { fixDatabase }; 
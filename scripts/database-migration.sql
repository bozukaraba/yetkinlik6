-- YETKİNLİK DATABASE MİGRATİON SCRIPT
-- Veritabanı görevlisi tarafından çalıştırılacak

-- 1. Users tablosuna eksik kolonları ekle
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. yetkinlik_appuser kullanıcısına gerekli izinleri ver
GRANT SELECT, INSERT, UPDATE ON users TO yetkinlik_appuser;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO yetkinlik_appuser;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO yetkinlik_appuser;
GRANT USAGE, SELECT ON SEQUENCE sessions_id_seq TO yetkinlik_appuser;
GRANT SELECT, INSERT, UPDATE, DELETE ON cvs TO yetkinlik_appuser;
GRANT USAGE, SELECT ON SEQUENCE cvs_id_seq TO yetkinlik_appuser;

-- 4. Test kullanıcısı için örnek hash (şifre: test123)
-- Hash değeri: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- Bu hash bcrypt ile oluşturulmuş, cost factor 10

-- Örnek kullanıcı ekleme (opsiyonel):
-- INSERT INTO users (id, email, password_hash, name, role, is_active) VALUES 
-- (gen_random_uuid(), 'test@turksat.com.tr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test User', 'user', true);

-- 5. Mevcut kullanıcıların şifrelerini güncelleme (gerekirse)
-- UPDATE users SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE password_hash IS NULL;

-- Migration tamamlandı
SELECT 'Migration completed successfully' as status; 
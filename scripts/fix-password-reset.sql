-- ŞIFRE SIFIRLAMA ÖZELLİĞİ İÇİN DATABASE FİX
-- Veritabanı ekibine teslim edilecek
-- Tarih: 2024-06-30

-- 1. Password reset tokens tablosunu oluştur
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Index'ler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- 3. yetkinlik_appuser kullanıcısına gerekli izinleri ver
GRANT SELECT, INSERT, UPDATE, DELETE ON password_reset_tokens TO yetkinlik_appuser;
GRANT USAGE, SELECT ON SEQUENCE password_reset_tokens_id_seq TO yetkinlik_appuser;

-- 4. Otomatik temizlik prosedürü (opsiyonel)
-- Süresi dolmuş token'ları otomatik temizlemek için
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 5. Test için örnek kontrol sorguları
SELECT 'Password reset tokens table created successfully' as status;

-- Mevcut kayıtları kontrol et
SELECT COUNT(*) as existing_records FROM password_reset_tokens;

-- Tablo yapısını kontrol et
\d password_reset_tokens;

-- Kullanıcı izinlerini kontrol et
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='password_reset_tokens' AND grantee='yetkinlik_appuser'; 
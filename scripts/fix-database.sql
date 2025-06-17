-- Yetkinlik-X Database Fix Script
-- Bu script PostgreSQL veritabanını düzeltir ve gerekli izinleri verir

\echo 'Yetkinlik-X Database Fix Script başlatılıyor...'

-- 1. Password hash kolonunu ekle (eğer yoksa)
\echo 'Password hash kolonu kontrol ediliyor...'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
        RAISE NOTICE 'Password hash kolonu eklendi';
    ELSE
        RAISE NOTICE 'Password hash kolonu zaten mevcut';
    END IF;
END $$;

-- 2. Sessions tablosunu oluştur (eğer yoksa)
\echo 'Sessions tablosu kontrol ediliyor...'
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Sessions tablosunda mevcut token kolonunu token_hash'e dönüştür
\echo 'Sessions tablosu token kolonu güncelleniyor...'
DO $$ 
BEGIN
    -- Eğer 'token' kolonu varsa ve 'token_hash' yoksa, yeniden adlandır
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'token'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'token_hash'
    ) THEN
        ALTER TABLE sessions RENAME COLUMN token TO token_hash;
        ALTER TABLE sessions ALTER COLUMN token_hash TYPE VARCHAR(1000);
        RAISE NOTICE 'Token kolonu token_hash olarak yeniden adlandırıldı ve boyutu artırıldı';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'token_hash'
    ) THEN
        -- token_hash kolonu varsa sadece boyutunu artır
        ALTER TABLE sessions ALTER COLUMN token_hash TYPE VARCHAR(1000);
        RAISE NOTICE 'Token_hash kolonu boyutu güncellendi';
    END IF;
END $$;

-- 3. CVs tablosunu oluştur (eğer yoksa)
\echo 'CVs tablosu kontrol ediliyor...'
CREATE TABLE IF NOT EXISTS cvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    personal_info JSONB,
    education JSONB,
    experience JSONB,
    skills JSONB,
    projects JSONB,
    languages JSONB,
    certificates JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. İndeksleri oluştur
\echo 'İndeksler oluşturuluyor...'
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);

-- 5. yetkinlik_appuser kullanıcısına izinleri ver
\echo 'Kullanıcı izinleri veriliyor...'
GRANT USAGE ON SCHEMA public TO yetkinlik_appuser;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO yetkinlik_appuser;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO yetkinlik_appuser;
GRANT SELECT, INSERT, UPDATE, DELETE ON cvs TO yetkinlik_appuser;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO yetkinlik_appuser;

-- 6. Test verisi ekle (eğer users tablosu boşsa)
\echo 'Test verisi kontrol ediliyor...'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at) VALUES
        (gen_random_uuid(), 'admin@turksat.com.tr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin', CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'test@turksat.com.tr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test', 'User', 'user', CURRENT_TIMESTAMP);
        RAISE NOTICE 'Test verileri eklendi';
    ELSE
        RAISE NOTICE 'Users tablosunda veri mevcut, test verisi atlandı';
    END IF;
END $$;

-- 7. Veritabanı durumunu kontrol et
\echo 'Veritabanı durumu kontrol ediliyor...'
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count,
    array_agg(column_name ORDER BY ordinal_position) as columns
FROM users, information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
GROUP BY 1

UNION ALL

SELECT 
    'sessions' as table_name, 
    COUNT(*) as record_count,
    array_agg(column_name ORDER BY ordinal_position) as columns
FROM sessions, information_schema.columns 
WHERE table_name = 'sessions' AND table_schema = 'public'
GROUP BY 1

UNION ALL

SELECT 
    'cvs' as table_name, 
    COUNT(*) as record_count,
    array_agg(column_name ORDER BY ordinal_position) as columns
FROM cvs, information_schema.columns 
WHERE table_name = 'cvs' AND table_schema = 'public'
GROUP BY 1;

\echo 'Database fix script tamamlandı!' 
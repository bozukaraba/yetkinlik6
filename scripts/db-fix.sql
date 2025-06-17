-- PRODUCTION HOTFİX - Database Schema Update
-- Çalıştırılacak SQL komutları

-- password_hash kolonu ekleme
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- İzinleri düzeltme  
GRANT SELECT, INSERT, UPDATE ON users TO yetkinlik_appuser;

-- Test hash (şifre: admin123)
-- $2a$10$CwTycUXWue0Thq9StjUM0uJ1/jW5eRmy.B6YYL4JgGAcYlnm.L/hy

SELECT 'Hotfix completed' as status; 
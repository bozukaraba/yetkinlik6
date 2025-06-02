-- Remove password_hash column from users table since Supabase Auth handles it
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Also remove any NOT NULL constraints that might be problematic
ALTER TABLE users ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;

-- Check the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position; 
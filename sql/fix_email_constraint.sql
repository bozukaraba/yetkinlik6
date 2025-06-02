-- Drop unique constraint on email since Supabase Auth handles it
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Check current constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'users' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'UNIQUE'; 
-- Temporarily disable RLS on users table to fix user creation
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Check current status
SELECT schemaname, tablename, rowsecurity, enablerls 
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename = 'users' AND t.schemaname = 'public'; 
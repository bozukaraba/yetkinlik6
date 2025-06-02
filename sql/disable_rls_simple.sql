-- Simply disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled by checking table info
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public'; 
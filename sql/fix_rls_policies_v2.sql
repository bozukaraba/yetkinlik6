-- First disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new simple policies
CREATE POLICY "users_select_policy" ON users
    FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE 
    USING (auth.uid() = id); 
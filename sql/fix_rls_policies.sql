-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create new simplified RLS policies for users table
CREATE POLICY "Enable read access for users based on user_id" ON users
    FOR SELECT 
    USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Enable insert for authenticated users during signup" ON users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON users
    FOR UPDATE 
    USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Make sure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY; 
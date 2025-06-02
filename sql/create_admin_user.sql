-- Create admin user in users table
-- First, you need to sign up this user via Supabase Auth Dashboard or API
-- Email: yetkinlikxadmin@turksat.com.tr
-- Password: TkSat2024!@Admin#CV

-- After creating the user in Supabase Auth, get the user ID and run this:
-- Replace 'USER_ID_FROM_SUPABASE_AUTH' with the actual UUID from auth.users table

-- Check if admin user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'yetkinlikxadmin@turksat.com.tr';

-- Insert admin user into users table (replace USER_ID with actual ID from above query)
INSERT INTO users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    created_at, 
    updated_at
) VALUES (
    'USER_ID_FROM_ABOVE_QUERY', -- Replace with actual UUID
    'yetkinlikxadmin@turksat.com.tr',
    'Yetkinlikx',
    'Admin',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Verify admin user was created
SELECT id, email, first_name, last_name, role 
FROM users 
WHERE email = 'yetkinlikxadmin@turksat.com.tr'; 
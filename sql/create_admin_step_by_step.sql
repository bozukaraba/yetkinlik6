-- Step 1: Check if admin user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'yetkinlikxadmin@turksat.com.tr';

-- Step 2: If user doesn't exist, you need to create it manually in Supabase Dashboard first
-- Go to Authentication > Users > Add User
-- Email: yetkinlikxadmin@turksat.com.tr
-- Password: TkSat2024!@Admin#CV

-- Step 3: After creating in auth, copy the UUID from above query and use it below:
-- Example: '12345678-1234-5678-9012-123456789012'

-- Step 4: Insert admin user into users table (REPLACE THE UUID BELOW)
-- INSERT INTO users (
--     id, 
--     email, 
--     first_name, 
--     last_name, 
--     role, 
--     created_at, 
--     updated_at
-- ) VALUES (
--     'PASTE_ACTUAL_UUID_HERE', -- Paste the UUID from Step 1 here
--     'yetkinlikxadmin@turksat.com.tr',
--     'Yetkinlikx',
--     'Admin',
--     'admin',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (id) DO UPDATE SET
--     role = 'admin',
--     updated_at = NOW();

-- Step 5: Verify admin user was created
-- SELECT id, email, first_name, last_name, role 
-- FROM users 
-- WHERE email = 'yetkinlikxadmin@turksat.com.tr'; 
-- Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Test query to see current users in auth.users (admin only)
SELECT id, email, created_at, raw_user_meta_data 
FROM auth.users 
LIMIT 5;

-- Test query to see current users in public.users
SELECT id, email, first_name, last_name, role, created_at 
FROM public.users 
LIMIT 5; 
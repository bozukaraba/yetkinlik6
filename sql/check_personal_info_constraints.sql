-- Check constraints on personal_info table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'personal_info' 
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_type;

-- Add primary key on cv_id if not exists
ALTER TABLE personal_info ADD CONSTRAINT personal_info_pkey PRIMARY KEY (cv_id); 
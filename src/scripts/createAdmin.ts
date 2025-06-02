import { supabase } from '../lib/supabase';

const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');
    
    const adminEmail = 'yetkinlikxadmin@turksat.com.tr';
    const adminPassword = 'TkSat2024!@Admin#CV';
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        first_name: 'Yetkinlikx',
        last_name: 'Admin'
      }
    });

    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }

    console.log('Admin user created in auth:', data.user?.id);

    // Insert into users table
    if (data.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: adminEmail,
          first_name: 'Yetkinlikx',
          last_name: 'Admin',
          role: 'admin'
        });

      if (userError) {
        console.error('Error inserting admin into users table:', userError);
      } else {
        console.log('Admin user created successfully!');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

// Run the script
createAdminUser(); 
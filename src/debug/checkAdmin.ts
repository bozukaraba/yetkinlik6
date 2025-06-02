import { supabase } from '../lib/supabase';

export const checkAdminUser = async () => {
  try {
    console.log('Checking admin user...');
    
    // Check if admin user exists in users table
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'yetkinlikxadmin@turksat.com.tr');
    
    if (error) {
      console.error('Error fetching admin user:', error);
      return;
    }
    
    console.log('Admin user data:', users);
    
    if (users && users.length > 0) {
      const adminUser = users[0];
      console.log('Admin user found:', {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        first_name: adminUser.first_name,
        last_name: adminUser.last_name
      });
      
      if (adminUser.role !== 'admin') {
        console.log('Admin user role is not admin, updating...');
        
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('email', 'yetkinlikxadmin@turksat.com.tr')
          .select();
        
        if (updateError) {
          console.error('Error updating admin role:', updateError);
        } else {
          console.log('Admin role updated successfully:', updateData);
        }
      }
    } else {
      console.log('Admin user not found in users table');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

export const fixAdminUser = async () => {
  try {
    console.log('Fixing admin user...');
    
    // Get current auth user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
      return;
    }
    
    console.log('Current auth user:', user.email);
    
    if (user.email === 'yetkinlikxadmin@turksat.com.tr') {
      // Check if user exists in users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // User doesn't exist, create it
        console.log('Creating admin user in users table...');
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin'
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating admin user:', createError);
        } else {
          console.log('Admin user created successfully:', newUser);
        }
      } else if (checkError) {
        console.error('Error checking admin user:', checkError);
      } else {
        // User exists, update role if needed
        if (existingUser.role !== 'admin') {
          console.log('Updating admin role...');
          const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', user.id)
            .select();
          
          if (updateError) {
            console.error('Error updating admin role:', updateError);
          } else {
            console.log('Admin role updated successfully:', updateData);
          }
        } else {
          console.log('Admin user already has correct role');
        }
      }
    } else {
      console.log('Current user is not admin');
    }
    
  } catch (error) {
    console.error('Error fixing admin user:', error);
  }
};

// Make functions available globally for testing
(window as any).checkAdminUser = checkAdminUser;
(window as any).fixAdminUser = fixAdminUser; 
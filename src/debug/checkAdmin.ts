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

// Make it available globally for testing
(window as any).checkAdminUser = checkAdminUser; 
import { supabase } from '../lib/supabase';

export const checkRLSPolicies = async () => {
  try {
    console.log('=== RLS POLİCY KONTROLÜ ===');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Kullanıcı oturumu bulunamadı');
      return;
    }
    
    console.log('Current user:', user.id, user.email);
    
    // Test her tablo için basit select işlemi
    const tables = ['users', 'cvs', 'personal_info', 'education', 'experience', 'skills', 'languages', 'certificates', 'publications', 'user_references', 'hobbies', 'awards', 'evaluations'];
    
    for (const table of tables) {
      try {
        console.log(`\n--- ${table.toUpperCase()} TABLOSU ---`);
        
        // Select test
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(1);
        
        console.log(`${table} select:`, {
          success: !error,
          error: error?.message,
          count: count,
          hasData: !!data && data.length > 0
        });
        
        // Insert test (sadece users ve cvs için)
        if (table === 'users') {
          const { error: insertError } = await supabase
            .from(table)
            .insert({
              id: user.id,
              email: user.email,
              first_name: 'Test',
              last_name: 'User',
              role: 'user'
            });
          
          console.log(`${table} insert test:`, {
            success: !insertError,
            error: insertError?.message
          });
        }
        
        if (table === 'cvs') {
          const { error: insertError } = await supabase
            .from(table)
            .insert({
              user_id: user.id
            });
          
          console.log(`${table} insert test:`, {
            success: !insertError,
            error: insertError?.message
          });
        }
        
      } catch (error) {
        console.error(`${table} test hatası:`, error);
      }
    }
    
    console.log('\n=== RLS POLİCY KONTROLÜ TAMAMLANDI ===');
    
  } catch (error) {
    console.error('RLS kontrol hatası:', error);
  }
};

// Global olarak erişilebilir yap
(window as any).checkRLSPolicies = checkRLSPolicies; 
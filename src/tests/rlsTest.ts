import { supabase } from '../lib/supabase';

// RLS Test Functions
export const testRLSPolicies = async () => {
  console.log('🔒 RLS Politika Testleri Başlıyor...\n');

  try {
    // 1. Test: Authenticated user can access their own CV
    console.log('1️⃣ Kullanıcının kendi CV\'sine erişim testi...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('❌ Kullanıcı oturumu bulunamadı. Lütfen giriş yapın.\n');
      return;
    }

    const userId = session.user.id;
    console.log(`   Kullanıcı ID: ${userId}`);

    // Test CV access
    const { data: cvs, error: cvError } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', userId);

    if (cvError) {
      console.log(`   ❌ CV erişim hatası: ${cvError.message}`);
    } else {
      console.log(`   ✅ CV erişimi başarılı: ${cvs?.length || 0} CV bulundu`);
    }

    // 2. Test: User cannot access other users' CVs
    console.log('\n2️⃣ Başka kullanıcıların CV\'lerine erişim engelleme testi...');
    
    const { data: otherCvs, error: otherError } = await supabase
      .from('cvs')
      .select('*')
      .neq('user_id', userId)
      .limit(1);

    if (otherError) {
      console.log(`   ✅ Başka kullanıcı CV\'lerine erişim engellendi: ${otherError.message}`);
    } else {
      if (otherCvs?.length === 0) {
        console.log('   ✅ Başka kullanıcı CV\'si bulunamadı (beklenen durum)');
      } else {
        console.log('   ❌ Başka kullanıcı CV\'lerine erişim sağlandı (güvenlik sorunu!)');
      }
    }

    // 3. Test: Admin access
    console.log('\n3️⃣ Admin yetkisi testi...');
    
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const isAdmin = userData?.role === 'admin';
    console.log(`   Kullanıcı rolü: ${userData?.role || 'user'}`);

    if (isAdmin) {
      // Admin should see all CVs
      const { data: allCvs, error: adminError } = await supabase
        .from('cvs')
        .select('*');

      if (adminError) {
        console.log(`   ❌ Admin CV erişim hatası: ${adminError.message}`);
      } else {
        console.log(`   ✅ Admin tüm CV\'lere erişebiliyor: ${allCvs?.length || 0} CV`);
      }
    } else {
      console.log('   ℹ️ Normal kullanıcı - admin testleri atlanıyor');
    }

    // 4. Test: Personal info access
    console.log('\n4️⃣ Kişisel bilgi erişim testi...');
    
    const { data: personalInfo, error: personalError } = await supabase
      .from('personal_info')
      .select('*')
      .limit(5);

    if (personalError) {
      console.log(`   ❌ Kişisel bilgi erişim hatası: ${personalError.message}`);
    } else {
      console.log(`   ✅ Kişisel bilgilere erişim: ${personalInfo?.length || 0} kayıt`);
    }

    // 5. Test: Insert permission
    console.log('\n5️⃣ CV oluşturma izni testi...');
    
    const { data: newCv, error: insertError } = await supabase
      .from('cvs')
      .insert({ user_id: userId })
      .select()
      .single();

    if (insertError) {
      console.log(`   ❌ CV oluşturma hatası: ${insertError.message}`);
    } else {
      console.log(`   ✅ CV oluşturma başarılı: ${newCv?.id}`);
      
      // Clean up test CV
      await supabase
        .from('cvs')
        .delete()
        .eq('id', newCv.id);
      console.log('   🧹 Test CV\'si temizlendi');
    }

    // 6. Test: Update permission
    console.log('\n6️⃣ CV güncelleme izni testi...');
    
    if (cvs && cvs.length > 0) {
      const testCvId = cvs[0].id;
      const { error: updateError } = await supabase
        .from('cvs')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testCvId);

      if (updateError) {
        console.log(`   ❌ CV güncelleme hatası: ${updateError.message}`);
      } else {
        console.log('   ✅ CV güncelleme başarılı');
      }
    } else {
      console.log('   ℹ️ Güncellenecek CV bulunamadı');
    }

    console.log('\n🎉 RLS Politika Testleri Tamamlandı!\n');

  } catch (error) {
    console.error('❌ Test sırasında hata:', error);
  }
};

// Function to test without authentication
export const testUnauthenticatedAccess = async () => {
  console.log('🔓 Kimlik doğrulamasız erişim testi...\n');

  // Sign out to test unauthenticated access
  await supabase.auth.signOut();

  try {
    const { data: cvs, error } = await supabase
      .from('cvs')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`✅ Kimlik doğrulamasız erişim engellendi: ${error.message}`);
    } else {
      console.log(`❌ Kimlik doğrulamasız erişim sağlandı: ${cvs?.length || 0} CV (güvenlik sorunu!)`);
    }
  } catch (error) {
    console.log(`✅ Kimlik doğrulamasız erişim engellendi: ${error}`);
  }

  console.log('\n🔒 Kimlik doğrulamasız erişim testi tamamlandı!\n');
};

// Run all tests
export const runAllRLSTests = async () => {
  console.log('🚀 Tüm RLS Testleri Başlıyor...\n');
  
  await testRLSPolicies();
  await testUnauthenticatedAccess();
  
  console.log('✅ Tüm testler tamamlandı!');
};

// Export for manual testing in browser console
(window as any).rlsTest = {
  testRLSPolicies,
  testUnauthenticatedAccess,
  runAllRLSTests
}; 
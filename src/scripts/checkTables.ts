import { testConnection, query } from '../lib/database';

const checkTables = async () => {
  console.log('PostgreSQL bağlantısı test ediliyor...');
  
  const connectionSuccess = await testConnection();
  
  if (!connectionSuccess) {
    console.error('Veritabanı bağlantısı başarısız!');
    return;
  }
  
  console.log('\nMevcut tablolar kontrol ediliyor...');
  
  try {
    // Mevcut tabloları listele
    const tablesResult = await query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n=== MEVCUT TABLOLAR ===');
    if (tablesResult.rows.length === 0) {
      console.log('Hiç tablo bulunamadı.');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name} (${row.table_type})`);
      });
    }
    
    // Her tablo için satır sayısını göster
    for (const table of tablesResult.rows) {
      try {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        console.log(`  ${table.table_name}: ${countResult.rows[0].count} kayıt`);
      } catch (error) {
        console.log(`  ${table.table_name}: Kayıt sayısı alınamadı`);
      }
    }
    
  } catch (error) {
    console.error('Tablo kontrol hatası:', error);
  }
};

// Script çalıştırıldığında
if (typeof window === 'undefined') {
  checkTables();
}

export { checkTables }; 
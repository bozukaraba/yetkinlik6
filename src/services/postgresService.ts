import { query, adminQuery } from '../lib/database';
import type { CVData } from '../types/cv';

// Veritabanı tablolarını başlat
export const initializeTables = async (): Promise<void> => {
  try {
    // Users tablosu
    await adminQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // CVs tablosu
    await adminQuery(`
      CREATE TABLE IF NOT EXISTS cvs (
        user_id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Index'ler
    await adminQuery(`
      CREATE INDEX IF NOT EXISTS idx_cvs_updated_at ON cvs(updated_at DESC)
    `);

    console.log('Veritabanı tabloları başarıyla oluşturuldu');
  } catch (error) {
    console.error('Tablo oluşturma hatası:', error);
    throw error;
  }
};

// CV verisini getir
export const getCVData = async (userId: string): Promise<CVData | null> => {
  try {
    const result = await query(
      'SELECT data FROM cvs WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].data as CVData;
  } catch (error) {
    console.error('CV verisi alma hatası:', error);
    throw error;
  }
};

// CV verisini kaydet
export const saveCVData = async (userId: string, data: CVData): Promise<CVData> => {
  try {
    const processedData = {
      ...data,
      userId,
      updatedAt: new Date().toISOString()
    };

    // Önce kayıt var mı kontrol et
    const existingResult = await query(
      'SELECT user_id FROM cvs WHERE user_id = $1',
      [userId]
    );

    if (existingResult.rows.length > 0) {
      // Güncelle
      await query(
        'UPDATE cvs SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [JSON.stringify(processedData), userId]
      );
    } else {
      // Yeni kayıt ekle
      await query(
        'INSERT INTO cvs (user_id, data) VALUES ($1, $2)',
        [userId, JSON.stringify(processedData)]
      );
    }

    console.log('CV verisi başarıyla kaydedildi:', userId);
    return processedData;
  } catch (error) {
    console.error('CV kaydetme hatası:', error);
    throw error;
  }
};

// Tüm CV'leri getir (admin)
export const getAllCVs = async (): Promise<CVData[]> => {
  try {
    const result = await query(
      'SELECT data FROM cvs ORDER BY updated_at DESC'
    );

    return result.rows.map(row => row.data as CVData);
  } catch (error) {
    console.error('Tüm CV\'leri alma hatası:', error);
    throw error;
  }
};

// CV sil
export const deleteCVData = async (userId: string): Promise<void> => {
  try {
    await query(
      'DELETE FROM cvs WHERE user_id = $1',
      [userId]
    );
    
    console.log('CV verisi başarıyla silindi:', userId);
  } catch (error) {
    console.error('CV silme hatası:', error);
    throw error;
  }
};

// Boş CV oluştur
export const initializeEmptyCV = async (userId: string): Promise<CVData> => {
  const emptyCV: CVData = {
    userId,
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      summary: ''
    },
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certificates: [],
    projects: [],
    references: [],
    updatedAt: new Date().toISOString()
  };

  return await saveCVData(userId, emptyCV);
};

// Anahtar kelimelerle CV ara
export const searchCVsByKeywords = async (keywords: string[]): Promise<CVData[]> => {
  try {
    if (keywords.length === 0) {
      return await getAllCVs();
    }

    // JSON içinde arama yapmak için PostgreSQL'in JSONB fonksiyonlarını kullan
    const searchConditions = keywords.map((_, index) => 
      `data::text ILIKE $${index + 1}`
    ).join(' OR ');

    const searchParams = keywords.map(keyword => `%${keyword}%`);

    const result = await query(
      `SELECT data FROM cvs WHERE ${searchConditions} ORDER BY updated_at DESC`,
      searchParams
    );

    return result.rows.map(row => row.data as CVData);
  } catch (error) {
    console.error('CV arama hatası:', error);
    throw error;
  }
};

// Kullanıcı oluştur/güncelle
export const upsertUser = async (userId: string, email: string, name?: string, role: string = 'user'): Promise<void> => {
  try {
    const existingResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (existingResult.rows.length > 0) {
      // Güncelle
      await query(
        'UPDATE users SET email = $1, name = $2, role = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [email, name, role, userId]
      );
    } else {
      // Yeni kayıt ekle
      await query(
        'INSERT INTO users (id, email, name, role) VALUES ($1, $2, $3, $4)',
        [userId, email, name, role]
      );
    }
  } catch (error) {
    console.error('Kullanıcı kaydetme hatası:', error);
    throw error;
  }
};

// Kullanıcı rolünü kontrol et
export const getUserRole = async (userId: string): Promise<string | null> => {
  try {
    const result = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    return result.rows.length > 0 ? result.rows[0].role : null;
  } catch (error) {
    console.error('Kullanıcı rolü alma hatası:', error);
    throw error;
  }
}; 
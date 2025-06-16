import { query } from '../config/database.js';
import { body, validationResult } from 'express-validator';

// CV verisini getir
export const getCVData = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      'SELECT data FROM cvs WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'CV bulunamadı'
      });
    }

    res.json({
      success: true,
      data: result.rows[0].data
    });
  } catch (error) {
    console.error('CV getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// CV verisini kaydet
export const saveCVData = async (req, res) => {
  try {
    const { userId } = req.params;
    const cvData = req.body;

    const processedData = {
      ...cvData,
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

    res.json({
      success: true,
      message: 'CV başarıyla kaydedildi',
      data: processedData
    });
  } catch (error) {
    console.error('CV kaydetme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// Tüm CV'leri getir (admin)
export const getAllCVs = async (req, res) => {
  try {
    const result = await query(
      'SELECT data FROM cvs ORDER BY updated_at DESC'
    );

    const cvs = result.rows.map(row => row.data);

    res.json({
      success: true,
      data: cvs
    });
  } catch (error) {
    console.error('CV\'leri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// CV sil
export const deleteCVData = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      'DELETE FROM cvs WHERE user_id = $1',
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'CV bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'CV başarıyla silindi'
    });
  } catch (error) {
    console.error('CV silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// Boş CV oluştur
export const initializeEmptyCV = async (req, res) => {
  try {
    const { userId } = req.params;

    const emptyCV = {
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

    // CV zaten var mı kontrol et
    const existingResult = await query(
      'SELECT user_id FROM cvs WHERE user_id = $1',
      [userId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı için CV zaten mevcut'
      });
    }

    // Yeni CV oluştur
    await query(
      'INSERT INTO cvs (user_id, data) VALUES ($1, $2)',
      [userId, JSON.stringify(emptyCV)]
    );

    res.status(201).json({
      success: true,
      message: 'Boş CV başarıyla oluşturuldu',
      data: emptyCV
    });
  } catch (error) {
    console.error('Boş CV oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// CV ara
export const searchCVs = async (req, res) => {
  try {
    const { keywords } = req.query;

    if (!keywords) {
      // Anahtar kelime yoksa tüm CV'leri döndür
      return getAllCVs(req, res);
    }

    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    if (keywordArray.length === 0) {
      return getAllCVs(req, res);
    }

    // JSON içinde arama yapmak için PostgreSQL'in JSONB fonksiyonlarını kullan
    const searchConditions = keywordArray.map((_, index) => 
      `data::text ILIKE $${index + 1}`
    ).join(' OR ');

    const searchParams = keywordArray.map(keyword => `%${keyword}%`);

    const result = await query(
      `SELECT data FROM cvs WHERE ${searchConditions} ORDER BY updated_at DESC`,
      searchParams
    );

    const cvs = result.rows.map(row => row.data);

    res.json({
      success: true,
      data: cvs,
      meta: {
        searchKeywords: keywordArray,
        resultCount: cvs.length
      }
    });
  } catch (error) {
    console.error('CV arama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
}; 
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yetkinlik_super_secret_key_2024';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token gerekli'
      });
    }

    const token = authHeader.substring(7); // "Bearer " kısmını çıkar

    // Token'ı doğrula
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Kullanıcının aktif olup olmadığını kontrol et
    const userResult = await query(
      'SELECT id, email, role, name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token - kullanıcı bulunamadı'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Hesap deaktive edilmiş'
      });
    }

    // Token'ın session tablosunda olup olmadığını kontrol et
    const sessionResult = await query(
      'SELECT id FROM sessions WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()',
      [decoded.userId, token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token süresi dolmuş veya geçersiz'
      });
    }

    // Kullanıcı bilgilerini request'e ekle
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token format'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token süresi dolmuş'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Token doğrulama hatası'
    });
  }
};

export const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication gerekli'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin yetkisi gerekli'
    });
  }

  next();
};

export const requireOwnerOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication gerekli'
      });
    }

    const targetUserId = req.params[userIdField] || req.body[userIdField];
    
    if (req.user.role === 'admin' || req.user.id === targetUserId) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }
  };
}; 
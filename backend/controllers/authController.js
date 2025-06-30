import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'yetkinlik_super_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Validation rules
export const registerValidation = [
  body('email').isEmail().withMessage('Geçerli bir email adresi girin'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
  body('name').notEmpty().withMessage('Ad soyad gerekli')
];

export const loginValidation = [
  body('email').isEmail().withMessage('Geçerli bir email adresi girin'),
  body('password').notEmpty().withMessage('Şifre gerekli')
];

export const resetPasswordValidation = [
  body('email').isEmail().withMessage('Geçerli bir email adresi girin')
];

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper function to save session
const saveSession = async (userId, token) => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 saat
  
  await query(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
};

// Kullanıcı kaydı
export const register = async (req, res) => {
  try {
    // Validation kontrolü
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation hatası',
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Email zaten kayıtlı mı kontrol et
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kayıtlı'
      });
    }

    // Şifreyi hash'le
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Kullanıcıyı kaydet
    await query(
      'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
      [userId, email, passwordHash, name]
    );

    // Token oluştur
    const token = generateToken(userId);
    await saveSession(userId, token);

    // Kullanıcı bilgilerini al (şifre hariç)
    const userResult = await query(
      'SELECT id, email, role, name, created_at FROM users WHERE id = $1',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: {
        user: userResult.rows[0],
        token
      }
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// Kullanıcı girişi
export const login = async (req, res) => {
  try {
    // Validation kontrolü
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation hatası',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Kullanıcıyı bul
    const userResult = await query(
      'SELECT id, email, password_hash, role, name, is_active FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Hesap deaktive edilmiş'
      });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Eski session'ları temizle
    await query(
      'DELETE FROM sessions WHERE user_id = $1 AND expires_at < NOW()',
      [user.id]
    );

    // Token oluştur
    const token = generateToken(user.id);
    await saveSession(user.id, token);

    // Kullanıcı bilgilerini döndür (şifre hariç)
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// Kullanıcı çıkışı
export const logout = async (req, res) => {
  try {
    // Session'ı sil
    await query(
      'DELETE FROM sessions WHERE user_id = $1 AND token_hash = $2',
      [req.user.id, req.token]
    );

    res.json({
      success: true,
      message: 'Çıkış başarılı'
    });
  } catch (error) {
    console.error('Çıkış hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// Kullanıcı profili
export const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Profil hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// Şifre sıfırlama
export const resetPassword = async (req, res) => {
  try {
    // Validation kontrolü
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation hatası',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Kullanıcıyı kontrol et
    const userResult = await query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    // Güvenlik için her durumda başarılı yanıt döndür
    // Gerçek uygulamada email gönderme servisi burada çalışır
    res.json({
      success: true,
      message: 'Şifre sıfırlama e-postası gönderildi (eğer email kayıtlıysa)'
    });

    // Kullanıcı varsa reset token oluştur ve kaydet
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const resetToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 saat

      await query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3',
        [user.id, resetToken, expiresAt]
      );

      console.log(`Şifre sıfırlama token'ı oluşturuldu: ${resetToken} (${user.email})`);
      // Burada email gönderme servisi çalışacak
    }
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
}; 
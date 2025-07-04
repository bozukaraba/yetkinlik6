import express from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  resetPassword,
  changePassword,
  registerValidation,
  loginValidation,
  resetPasswordValidation,
  changePasswordValidation
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Kullanıcı kaydı
router.post('/register', registerValidation, register);

// Kullanıcı girişi
router.post('/login', loginValidation, login);

// Kullanıcı çıkışı (token gerekli)
router.post('/logout', verifyToken, logout);

// Kullanıcı profili (token gerekli)
router.get('/profile', verifyToken, getProfile);

// Şifre sıfırlama
router.post('/reset-password', resetPasswordValidation, resetPassword);

// Şifre değiştirme (token gerekli)
router.post('/change-password', verifyToken, changePasswordValidation, changePassword);

export default router; 
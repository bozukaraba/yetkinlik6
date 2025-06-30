import express from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  resetPassword,
  getUsers,
  resetUserPassword,
  registerValidation,
  loginValidation,
  resetPasswordValidation
} from '../controllers/authController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

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

// Admin route'ları
router.get('/admin/users', verifyToken, requireAdmin, getUsers);
router.post('/admin/reset-user-password', verifyToken, requireAdmin, resetUserPassword);

export default router; 
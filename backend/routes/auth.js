import express from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  resetPassword,
  getAllUsers,
  updateUserRole,
  updateUserPassword,
  registerValidation,
  loginValidation,
  resetPasswordValidation
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

// Admin endpoint'leri
router.get('/admin/users', verifyToken, getAllUsers);
router.put('/admin/user/role', verifyToken, updateUserRole);
router.put('/admin/user/password', verifyToken, updateUserPassword);

export default router; 
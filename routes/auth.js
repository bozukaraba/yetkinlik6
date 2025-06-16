import express from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  registerValidation,
  loginValidation
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

export default router; 
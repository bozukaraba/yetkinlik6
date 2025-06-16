import express from 'express';
import {
  getCVData,
  saveCVData,
  getAllCVs,
  deleteCVData,
  initializeEmptyCV,
  searchCVs
} from '../controllers/cvController.js';
import { verifyToken, requireAdmin, requireOwnerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// CV verilerini getir (kullanıcı kendi CV'sini veya admin hepsini görebilir)
router.get('/:userId', verifyToken, requireOwnerOrAdmin('userId'), getCVData);

// CV kaydet (kullanıcı kendi CV'sini veya admin hepsini güncelleyebilir)
router.put('/:userId', verifyToken, requireOwnerOrAdmin('userId'), saveCVData);

// CV sil (kullanıcı kendi CV'sini veya admin hepsini silebilir)
router.delete('/:userId', verifyToken, requireOwnerOrAdmin('userId'), deleteCVData);

// Boş CV oluştur (kullanıcı kendi CV'sini oluşturabilir)
router.post('/:userId/initialize', verifyToken, requireOwnerOrAdmin('userId'), initializeEmptyCV);

// Tüm CV'leri getir (sadece admin)
router.get('/', verifyToken, requireAdmin, getAllCVs);

// CV ara (sadece admin)
router.get('/search/query', verifyToken, requireAdmin, searchCVs);

export default router; 
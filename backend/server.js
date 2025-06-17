import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

// Routes
import authRoutes from './routes/auth.js';
import cvRoutes from './routes/cv.js';

// Environment değişkenlerini yükle
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for GitLab load balancer
app.set('trust proxy', true);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // maksimum 100 request per window
  message: {
    success: false,
    message: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Auth endpoint'leri için özel rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // maksimum 5 login denemesi per window
  message: {
    success: false,
    message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      success: true,
      message: 'Server çalışıyor',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server hatası',
      timestamp: new Date().toISOString(),
      database: 'error'
    });
  }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/cv', cvRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Yetkinlik-X Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      cv: '/api/cv'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Sunucu hatası' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Server'ı başlat
const startServer = async () => {
  try {
    // Veritabanı bağlantısını test et
    console.log('🔗 Veritabanı bağlantısı test ediliyor...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Veritabanı bağlantısı başarısız!');
      console.log('⚠️  Server yine de başlatılıyor, ancak veritabanı işlemleri çalışmayabilir.');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server ${PORT} portunda çalışıyor`);
      console.log(`📡 CORS origin: ${corsOptions.origin}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Server başlatma hatası:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server kapatılıyor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Server kapatılıyor...');
  process.exit(0);
});

startServer(); 
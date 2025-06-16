# Yetkinlikx CV Management System

Türksat için geliştirilmiş modern CV yönetim sistemi.

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Lucide Icons  
- **Auth**: JWT-based authentication
- **State**: Context API

### Backend (Separate Repository)
- **Repository**: `yetkinlikx-backend` (GitLab)
- **Framework**: Express.js + Node.js 18+
- **Database**: PostgreSQL (Türksat: 10.101.15.130:6432)
- **Security**: JWT, Rate Limiting, CORS, Helmet

## 🚀 Quick Start

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Setup
Backend artık ayrı bir repository'de bulunmaktadır:

```bash
# Backend'i clone edin
git clone https://gitlab.turksat.com.tr/your-username/yetkinlikx-backend.git

# Backend kurulum talimatları için
cd yetkinlikx-backend
cat README.md
```

## 📁 Project Structure

```
yetkinlikx-project/
├── src/                     # Frontend kaynak kodu
│   ├── components/          # React bileşenleri
│   ├── pages/              # Sayfa bileşenleri  
│   ├── contexts/           # React Context'leri
│   ├── services/           # API servis katmanı
│   ├── types/              # TypeScript tip tanımları
│   └── assets/             # Statik dosyalar
├── public/                 # Statik dosyalar
├── package.json
└── README.md

# Backend (Ayrı Repository)
yetkinlikx-backend/         # GitLab'da ayrı repo
├── config/                 # Database ve ayar dosyaları
├── controllers/            # Business logic
├── middleware/             # Auth, CORS, Rate limiting
├── routes/                 # API endpoint'leri
└── server.js              # Ana server dosyası
```

## 🔧 Configuration

### Frontend Environment (.env)
```env
VITE_API_URL=http://localhost:3001/api
# Production:
# VITE_API_URL=https://your-backend-domain.com/api
```

### Backend Configuration
Backend konfigürasyonu için ayrı repository'deki README.md dosyasına bakın.

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)
```bash
npm run build
# dist/ klasörünü deploy edin
```

### Backend Deployment (Türksat Servers)
Backend deployment talimatları ayrı repository'de bulunmaktadır.

## 🛡️ Security Features

- JWT-based authentication
- Protected routes (user/admin)
- CORS configuration
- Rate limiting
- Input validation
- Secure password hashing

## 📊 Features

### User Features
- ✅ CV oluşturma ve düzenleme
- ✅ Kişisel bilgiler yönetimi
- ✅ Eğitim ve deneyim takibi
- ✅ Yetenek ve dil seviyeleri
- ✅ Sertifika ve proje kayıtları
- ✅ PDF export
- ✅ Profil resmi yükleme

### Admin Features
- ✅ Tüm CV'leri görüntüleme
- ✅ Gelişmiş arama ve filtreleme
- ✅ Kullanıcı yönetimi
- ✅ CV export ve analiz
- ✅ Sistem yönetimi

## 🏢 Türksat Integration

### Database
- **Server**: 10.101.15.130:6432
- **Database**: yetkinlik_prod
- **Fallback**: Mock database system

### Infrastructure
- Production-ready architecture
- PM2 process management
- Nginx reverse proxy support
- GitLab CI/CD pipeline ready

## 🧪 Development

### Frontend Development
```bash
npm run dev    # Development server (Port 5173)
npm run build  # Production build
npm run test   # Run tests
```

### API Integration
Frontend otomatik olarak backend API'sine bağlanır:
- Development: http://localhost:3001/api
- Production: Environment variable ile belirlenir

## 📞 Support

- **Frontend Issues**: Bu repository'deki GitHub Issues
- **Backend Issues**: Backend repository'deki GitLab Issues  
- **Infrastructure**: Türksat IT Team
- **Database**: Türksat Database Team

## 🔗 Related Repositories

- **Backend**: `yetkinlikx-backend` (GitLab - Private)
- **Frontend**: Bu repository (GitHub)

## 📄 License

Internal Türksat Project - Confidential 
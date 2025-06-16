# Yetkinlik-X Backend API

## Kurulum

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Environment Değişkenlerini Ayarla
```bash
# .env dosyası oluştur
cp .env.example .env

# Aşağıdaki değişkenleri düzenle:
PORT=3001
NODE_ENV=production
DB_HOST=10.101.15.130
DB_PORT=6432
DB_NAME=yetkinlik_prod
DB_USER=yetkinlik_appuser
DB_PASSWORD=your_password_here
JWT_SECRET=your_super_secret_jwt_key_here
CORS_ORIGIN=https://your-frontend-domain.com
```

### 3. Veritabanını Initialize Et
```bash
npm run init-db
```

### 4. Server'ı Başlat

#### Development
```bash
npm run dev
```

#### Production
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/profile` - Profil

### CV Management
- `GET /api/cv/:userId` - CV getir
- `PUT /api/cv/:userId` - CV kaydet
- `DELETE /api/cv/:userId` - CV sil
- `POST /api/cv/:userId/initialize` - Boş CV oluştur
- `GET /api/cv` - Tüm CV'ler (admin)
- `GET /api/cv/search/query?keywords=...` - CV ara (admin)

### Health Check
- `GET /health` - Server durumu

## Güvenlik Özellikleri

- JWT tabanlı authentication
- Rate limiting (15 dk 100 request, auth için 5 request)
- CORS protection
- Helmet security headers
- Input validation
- SQL injection protection

## Production Deployment

### Türksat Sunucusu
```bash
# 1. Kodu sunucuya yükle
git clone https://github.com/your-repo/yetkinlik.git
cd yetkinlik/backend

# 2. Node.js yükle (v18+)
# 3. Dependencies yükle
npm install --production

# 4. Environment ayarla
cp .env.example .env
# .env dosyasını düzenle

# 5. PM2 ile başlat (recommended)
npm install -g pm2
pm2 start npm --name "yetkinlik-backend" -- start
pm2 save
pm2 startup

# 6. Nginx reverse proxy (optional)
# /etc/nginx/sites-available/yetkinlik-api
server {
    listen 80;
    server_name api.yetkinlik.turksat.com.tr;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Frontend Environment
Frontend `.env` dosyasında:
```
VITE_API_URL=http://localhost:3001/api
# Production için:
# VITE_API_URL=https://api.yetkinlik.turksat.com.tr/api
``` 
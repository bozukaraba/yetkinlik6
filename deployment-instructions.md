# GitLab Deployment Instructions

## 🚀 GitLab Repository Setup

Bu backend repository'si GitLab'a push etmek için hazırlanmıştır.

### 1. GitLab Repository Oluşturma

GitLab'da yeni bir repository oluşturun:
- Repository name: `yetkinlikx-backend`
- Visibility: Private (Türksat internal)
- Description: "Yetkinlikx CV Management System - Backend API"

### 2. GitLab Remote Ekleme & Push

```bash
# GitLab remote'u ekleyin (URL'yi kendi GitLab instance'ınızla değiştirin)
git remote add origin https://gitlab.turksat.com.tr/your-username/yetkinlikx-backend.git

# Ana branch'i push edin
git push -u origin main

# Veya farklı GitLab instance için:
# git remote add origin https://your-gitlab-instance.com/your-username/yetkinlikx-backend.git
```

### 3. Environment Variables (GitLab CI/CD)

GitLab CI/CD Variables bölümüne ekleyin:

```
DB_HOST=10.101.15.130
DB_PORT=6432
DB_NAME=yetkinlik_prod
DB_USER=yetkinlik_appuser
DB_PASSWORD=Vaethe!ePhaesoZ2eiPhooKo
DB_ADMIN_USER=ukotbas
DB_ADMIN_PASSWORD=shie0hieKohhie!leig0eequ
JWT_SECRET=your-production-secret-key
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-domain.com
```

### 4. GitLab CI/CD Pipeline (.gitlab-ci.yml)

Proje root'una `.gitlab-ci.yml` ekleyebilirsiniz:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

# Test Stage
test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm run test
  only:
    - main
    - merge_requests

# Build Stage
build:
  stage: build
  image: node:18
  script:
    - npm ci --production
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 hour
  only:
    - main

# Deploy to Production
deploy_production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh
    - eval $(ssh-agent -s)
    - ssh-add <(echo "$SSH_PRIVATE_KEY")
    - mkdir -p ~/.ssh
    - echo "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts
  script:
    - scp -r . user@your-production-server:/path/to/app/
    - ssh user@your-production-server "cd /path/to/app && pm2 restart yetkinlik-backend"
  only:
    - main
  when: manual
```

## 🏢 Türksat Infrastructure Integration

### Database Connection
- **Server**: 10.101.15.130:6432
- **Database**: yetkinlik_prod
- **Users**: yetkinlik_appuser, ukotbas

### Production Deployment
1. **Server Requirements**
   - Node.js 18+
   - PM2 process manager
   - Nginx (optional reverse proxy)
   - PostgreSQL client

2. **Deployment Steps**
   ```bash
   # Server'da
   git clone https://gitlab.turksat.com.tr/your-username/yetkinlikx-backend.git
   cd yetkinlikx-backend
   npm ci --production
   
   # Environment variables set et
   cp .env.example .env
   # .env dosyasını düzenle
   
   # PM2 ile başlat
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Frontend Integration

Ana frontend projesinde backend URL'ini güncelleyin:

```javascript
// Frontend .env
VITE_API_URL=https://your-backend-domain.com/api
```

## 📞 Support

Deployment sorunları için:
- GitLab Issues kullanın
- Türksat IT team ile iletişime geçin
- Database bağlantı sorunları için network team'e danışın

## 🔒 Security Notes

- Tüm environment variables encrypted olarak saklanmalı
- SSH keys GitLab CI/CD variables'da secure olarak tutulmalı
- Production database credentials sadece authorized personnel ile paylaşılmalı 
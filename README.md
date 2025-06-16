# Yetkinlikx CV Management System - Backend API

Backend API for the Yetkinlikx CV Management System, designed for Türksat infrastructure.

## 🏗️ Architecture

- **Framework**: Express.js
- **Database**: PostgreSQL (Türksat Server: 10.101.15.130:6432)
- **Authentication**: JWT-based
- **Environment**: Node.js 18+

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- PostgreSQL access to Türksat server
- PM2 (for production deployment)

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with mock database (for testing)
USE_MOCK_DB=true npm run dev
```

### Production
```bash
# Install dependencies
npm ci --production

# Start with PM2
pm2 start ecosystem.config.js

# Or start directly
npm start
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# Database Configuration
DB_HOST=10.101.15.130
DB_PORT=6432
DB_NAME=yetkinlik_prod
DB_USER=yetkinlik_appuser
DB_PASSWORD=Vaethe!ePhaesoZ2eiPhooKo

# Admin Database User
DB_ADMIN_USER=ukotbas
DB_ADMIN_PASSWORD=shie0hieKohhie!leig0eequ

# JWT Configuration
JWT_SECRET=your-secret-key-here

# Server Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com

# Mock Database (for development)
USE_MOCK_DB=false
```

### Database Connection

The system automatically falls back to mock database if PostgreSQL connection fails:

- **Primary**: PostgreSQL (Türksat Server)
- **Fallback**: Mock Database (Development)

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js          # PostgreSQL & Mock DB configuration
│   └── mockDatabase.js      # Mock database implementation
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── cvController.js      # CV CRUD operations
│   └── userController.js    # User management
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── cors.js              # CORS configuration
│   └── rateLimiter.js       # Rate limiting
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── cv.js                # CV management routes
│   └── users.js             # User management routes
├── scripts/
│   └── checkDb.js           # Database connection tester
├── server.js                # Main server file
├── package.json
└── README.md
```

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### CV Management
- `GET /api/cv` - Get user's CV
- `POST /api/cv` - Create/Update CV
- `DELETE /api/cv` - Delete CV
- `GET /api/cv/all` - Get all CVs (Admin only)
- `GET /api/cv/search` - Search CVs (Admin only)

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🏥 Health Check

- `GET /health` - Server health status

## 🚀 Deployment

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'yetkinlik-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-api-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🧪 Testing Database Connection

```bash
# Test PostgreSQL connection
node scripts/checkDb.js

# Test with mock database
USE_MOCK_DB=true node scripts/checkDb.js
```

## 📝 Development Notes

- Mock database automatically activates if PostgreSQL connection fails
- Rate limiting: 100 requests per 15 minutes
- JWT tokens expire in 24 hours
- CORS configured for frontend domain

## 🔧 Türksat Infrastructure

This backend is specifically configured for Türksat's infrastructure:

- **Database Server**: 10.101.15.130:6432
- **Database**: yetkinlik_prod
- **App User**: yetkinlik_appuser
- **Admin User**: ukotbas

## 📞 Support

For technical support or deployment questions, contact the development team.

## 📄 License

Internal Türksat Project - Confidential 
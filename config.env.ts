export const config = {
  // Firebase Configuration (Development/Test)
  firebase: {
    apiKey: 'your-firebase-api-key',
    authDomain: 'your-auth-domain',
    projectId: 'your-project-id',
    storageBucket: 'your-storage-bucket',
    messagingSenderId: 'your-sender-id',
    appId: 'your-app-id'
  },

  // PostgreSQL Configuration (Production)
  postgresql: {
    host: '10.101.15.130',
    port: 6432,
    database: 'yetkinlik_prod',
    adminUser: {
      username: 'ukotbas',
      password: 'shie0hieKohhie!leig0eequ'
    },
    appUser: {
      username: 'yetkinlik_appuser',
      password: 'Vaethe!ePhaesoZ2eiPhooKo'
    }
  },

  // Environment Mode
  databaseMode: 'production' // development, test, production
}; 
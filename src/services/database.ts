import { Client } from 'pg';
import { config } from '../../config.env';

// PostgreSQL Client Setup
export class PostgreSQLService {
  private client: Client;

  constructor() {
    this.client = new Client({
      host: config.postgresql.host,
      port: config.postgresql.port,
      database: config.postgresql.database,
      user: config.postgresql.appUser.username,
      password: config.postgresql.appUser.password,
      ssl: {
        rejectUnauthorized: false // Türksat iç ağ için
      }
    });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('PostgreSQL bağlantısı başarılı');
    } catch (error) {
      console.error('PostgreSQL bağlantı hatası:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.client.end();
  }

  async query(text: string, params?: any[]) {
    try {
      const result = await this.client.query(text, params);
      return result.rows;
    } catch (error) {
      console.error('PostgreSQL sorgu hatası:', error);
      throw error;
    }
  }

  // Kullanıcı işlemleri
  async getUsers() {
    return this.query('SELECT * FROM users ORDER BY created_at DESC');
  }

  async getUserById(id: string) {
    return this.query('SELECT * FROM users WHERE id = $1', [id]);
  }

  async createUser(userData: any) {
    const { email, name, role, department } = userData;
    return this.query(
      'INSERT INTO users (email, name, role, department, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [email, name, role, department]
    );
  }

  async updateUser(id: string, userData: any) {
    const { email, name, role, department } = userData;
    return this.query(
      'UPDATE users SET email = $1, name = $2, role = $3, department = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [email, name, role, department, id]
    );
  }

  async deleteUser(id: string) {
    return this.query('DELETE FROM users WHERE id = $1', [id]);
  }

  // CV işlemleri
  async getCVs() {
    return this.query('SELECT * FROM cvs ORDER BY created_at DESC');
  }

  async getCVById(id: string) {
    return this.query('SELECT * FROM cvs WHERE id = $1', [id]);
  }

  async createCV(cvData: any) {
    const { user_id, title, content, status } = cvData;
    return this.query(
      'INSERT INTO cvs (user_id, title, content, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [user_id, title, content, status]
    );
  }

  async updateCV(id: string, cvData: any) {
    const { title, content, status } = cvData;
    return this.query(
      'UPDATE cvs SET title = $1, content = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [title, content, status, id]
    );
  }

  async deleteCV(id: string) {
    return this.query('DELETE FROM cvs WHERE id = $1', [id]);
  }
}

// Database Factory - Firebase veya PostgreSQL seçimi
export class DatabaseService {
  private static instance: DatabaseService;
  private postgresService: PostgreSQLService;

  private constructor() {
    this.postgresService = new PostgreSQLService();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize() {
    if (config.databaseMode === 'production') {
      await this.postgresService.connect();
      console.log('PostgreSQL veritabanı kullanılıyor');
    } else {
      console.log('Firebase veritabanı kullanılıyor');
    }
  }

  // Unified interface for both databases
  async getUsers() {
    if (config.databaseMode === 'production') {
      return this.postgresService.getUsers();
    } else {
      // Firebase implementation burada kalır
      return []; // Firebase service'den döner
    }
  }

  async getUserById(id: string) {
    if (config.databaseMode === 'production') {
      return this.postgresService.getUserById(id);
    } else {
      return null; // Firebase service'den döner
    }
  }

  async createUser(userData: any) {
    if (config.databaseMode === 'production') {
      return this.postgresService.createUser(userData);
    } else {
      return null; // Firebase service'den döner
    }
  }

  async updateUser(id: string, userData: any) {
    if (config.databaseMode === 'production') {
      return this.postgresService.updateUser(id, userData);
    } else {
      return null; // Firebase service'den döner
    }
  }

  async deleteUser(id: string) {
    if (config.databaseMode === 'production') {
      return this.postgresService.deleteUser(id);
    } else {
      return null; // Firebase service'den döner
    }
  }

  async getCVs() {
    if (config.databaseMode === 'production') {
      return this.postgresService.getCVs();
    } else {
      return []; // Firebase service'den döner
    }
  }

  async getCVById(id: string) {
    if (config.databaseMode === 'production') {
      return this.postgresService.getCVById(id);
    } else {
      return null; // Firebase service'den döner
    }
  }

  async createCV(cvData: any) {
    if (config.databaseMode === 'production') {
      return this.postgresService.createCV(cvData);
    } else {
      return null; // Firebase service'den döner
    }
  }

  async updateCV(id: string, cvData: any) {
    if (config.databaseMode === 'production') {
      return this.postgresService.updateCV(id, cvData);
    } else {
      return null; // Firebase service'den döner
    }
  }

  async deleteCV(id: string) {
    if (config.databaseMode === 'production') {
      return this.postgresService.deleteCV(id);
    } else {
      return null; // Firebase service'den döner
    }
  }
}

export default DatabaseService; 
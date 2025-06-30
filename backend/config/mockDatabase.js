// Mock database for development/testing when real DB is not accessible
let mockUsers = [
  {
    id: 'admin-user',
    email: 'admin@turksat.com.tr',
    password_hash: '$2a$10$defaultAdminPasswordHash',
    role: 'admin',
    name: 'System Admin',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }
];

let mockCVs = [];
let mockSessions = [];

export const mockDB = {
  // Users operations
  async findUserByEmail(email) {
    return mockUsers.find(user => user.email === email);
  },

  async findUserById(id) {
    return mockUsers.find(user => user.id === id);
  },

  async createUser(userData) {
    const newUser = {
      ...userData,
      role: userData.role || 'user', // Default role
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true
    };
    
    // Test için admin@test.com'u admin yap
    if (userData.email === 'admin@test.com') {
      newUser.role = 'admin';
    }
    
    mockUsers.push(newUser);
    return newUser;
  },

  async getAllUsers() {
    return mockUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at
    }));
  },

  // CV operations
  async findCVByUserId(userId) {
    const cv = mockCVs.find(cv => cv.user_id === userId);
    return cv ? { data: cv.data } : null;
  },

  async saveCVData(userId, data) {
    const existingIndex = mockCVs.findIndex(cv => cv.user_id === userId);
    const cvRecord = {
      user_id: userId,
      data: data,
      created_at: existingIndex === -1 ? new Date() : mockCVs[existingIndex].created_at,
      updated_at: new Date()
    };

    if (existingIndex !== -1) {
      mockCVs[existingIndex] = cvRecord;
    } else {
      mockCVs.push(cvRecord);
    }
    
    return cvRecord;
  },

  async getAllCVs() {
    return mockCVs.map(cv => ({ data: cv.data }));
  },

  async deleteCVByUserId(userId) {
    const index = mockCVs.findIndex(cv => cv.user_id === userId);
    if (index !== -1) {
      mockCVs.splice(index, 1);
      return true;
    }
    return false;
  },

  async searchCVs(keywords) {
    if (!keywords || keywords.length === 0) {
      return this.getAllCVs();
    }

    return mockCVs.filter(cv => {
      const searchText = JSON.stringify(cv.data).toLowerCase();
      return keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
    }).map(cv => ({ data: cv.data }));
  },

  // Session operations
  async createSession(userId, tokenHash, expiresAt) {
    const session = {
      id: mockSessions.length + 1,
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_at: new Date()
    };
    mockSessions.push(session);
    return session;
  },

  async findValidSession(userId, tokenHash) {
    return mockSessions.find(session => 
      session.user_id === userId && 
      session.token_hash === tokenHash && 
      new Date(session.expires_at) > new Date()
    );
  },

  async deleteSession(userId, tokenHash) {
    const index = mockSessions.findIndex(session => 
      session.user_id === userId && session.token_hash === tokenHash
    );
    if (index !== -1) {
      mockSessions.splice(index, 1);
      return true;
    }
    return false;
  },

  async cleanExpiredSessions(userId) {
    mockSessions = mockSessions.filter(session => 
      session.user_id !== userId || new Date(session.expires_at) > new Date()
    );
  }
};

// Test connection for mock mode
export const testMockConnection = async () => {
  console.log('🔄 Mock database modunda çalışıyor');
  return true;
}; 
// PostgreSQL servisleri
import * as postgresService from './postgresService';
import { auth } from '../lib/firebase'; // Auth için Firebase kullanmaya devam
import type { CVData } from '../types/cv';

// Get CV data from PostgreSQL
export const getCVData = async (userId: string): Promise<CVData | null> => {
  try {
    return await postgresService.getCVData(userId);
  } catch (error) {
    console.error('Error getting CV data:', error);
    throw error;
  }
};

// Save CV data to PostgreSQL
export const saveCVData = async (userId: string, data: CVData): Promise<CVData> => {
  try {
    console.log('=== saveCVData BAŞLADI ===');
    console.log('saveCVData called for user:', userId);
    
    // Check authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('No current user found');
      throw new Error('Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
    }
    
    console.log('Current user UID:', currentUser.uid);
    console.log('Target user ID:', userId);
    
    if (currentUser.uid !== userId) {
      console.error('User ID mismatch:', { currentUser: currentUser.uid, targetUser: userId });
      throw new Error('Kullanıcı ID eşleşmiyor');
    }

    // Check if user has valid token
    const token = await currentUser.getIdToken(true);
    console.log('User token obtained successfully');
    
    if (!token) {
      throw new Error('Authentication token alınamadı. Lütfen tekrar giriş yapın.');
    }

    // Save to PostgreSQL
    const result = await postgresService.saveCVData(userId, data);
    console.log('CV data saved successfully');
    return result;
  } catch (error: any) {
    console.error('Error saving CV data:', error);
    
    // Network or other errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('İnternet bağlantısı sorunu. Lütfen bağlantınızı kontrol edin.');
    }
    
    throw error;
  }
};

// Get all CVs (admin only)
export const getAllCVs = async (): Promise<CVData[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    // Check if user is admin
    const userRole = await postgresService.getUserRole(currentUser.uid);
    if (userRole !== 'admin') {
      throw new Error('Bu işlem için admin yetkisi gerekli');
    }

    return await postgresService.getAllCVs();
  } catch (error) {
    console.error('Error getting all CVs:', error);
    throw error;
  }
};

// Delete CV
export const deleteCVData = async (userId: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }
    
    // Check if user owns the CV or is admin
    if (currentUser.uid !== userId) {
      const userRole = await postgresService.getUserRole(currentUser.uid);
      if (userRole !== 'admin') {
        throw new Error('Bu CV\'yi silme yetkiniz yok');
      }
    }

    await postgresService.deleteCVData(userId);
    console.log('CV deleted successfully');
  } catch (error) {
    console.error('Error deleting CV:', error);
    throw error;
  }
};

// Initialize empty CV for new users
export const initializeEmptyCV = async (userId: string): Promise<CVData> => {
  return await postgresService.initializeEmptyCV(userId);
};

// Search CVs by keywords (admin only)
export const searchCVsByKeywords = async (keywords: string[]): Promise<CVData[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    // Check if user is admin
    const userRole = await postgresService.getUserRole(currentUser.uid);
    if (userRole !== 'admin') {
      throw new Error('Bu işlem için admin yetkisi gerekli');
    }

    return await postgresService.searchCVsByKeywords(keywords);
  } catch (error) {
    console.error('Error searching CVs:', error);
    throw error;
  }
};
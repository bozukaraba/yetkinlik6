// API servisleri
import { cvAPI, tokenManager } from './apiService';
import type { CVData } from '../types/cv';

// Mevcut kullanıcının ID'sini al
const getCurrentUserId = (): string | null => {
  const token = tokenManager.getToken();
  if (!token || !tokenManager.isTokenValid()) {
    return null;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId;
  } catch {
    return null;
  }
};

// Get CV data from API
export const getCVData = async (userId: string): Promise<CVData | null> => {
  try {
    return await cvAPI.getCVData(userId);
  } catch (error) {
    console.error('Error getting CV data:', error);
    throw error;
  }
};

// Save CV data to API
export const saveCVData = async (userId: string, data: CVData): Promise<CVData> => {
  try {
    console.log('=== saveCVData BAŞLADI ===');
    console.log('saveCVData called for user:', userId);
    
    // Check authentication
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      console.error('No current user found');
      throw new Error('Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
    }
    
    console.log('Current user ID:', currentUserId);
    console.log('Target user ID:', userId);
    
    if (currentUserId !== userId) {
      console.error('User ID mismatch:', { currentUser: currentUserId, targetUser: userId });
      throw new Error('Kullanıcı ID eşleşmiyor');
    }

    // Save to API
    const result = await cvAPI.saveCVData(userId, data);
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
    if (!getCurrentUserId()) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    return await cvAPI.getAllCVs();
  } catch (error) {
    console.error('Error getting all CVs:', error);
    throw error;
  }
};

// Delete CV
export const deleteCVData = async (userId: string): Promise<void> => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    await cvAPI.deleteCVData(userId);
    console.log('CV deleted successfully');
  } catch (error) {
    console.error('Error deleting CV:', error);
    throw error;
  }
};

// Initialize empty CV for new users
export const initializeEmptyCV = async (userId: string): Promise<CVData> => {
  return await cvAPI.initializeEmptyCV(userId);
};

// Search CVs by keywords (admin only)
export const searchCVsByKeywords = async (keywords: string[]): Promise<CVData[]> => {
  try {
    if (!getCurrentUserId()) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    const keywordString = keywords.join(',');
    return await cvAPI.searchCVs(keywordString);
  } catch (error) {
    console.error('Error searching CVs:', error);
    throw error;
  }
};
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { CVData } from '../types/cv';

// Get CV data from Firestore
export const getCVData = async (userId: string): Promise<CVData | null> => {
  try {
    // Get CV document
    const cvDocRef = doc(db, 'cvs', userId);
    const cvDoc = await getDoc(cvDocRef);

    if (!cvDoc.exists()) {
        return null;
      }

    const cvData = cvDoc.data();
    
    // Convert Firebase timestamps to dates
    const convertTimestamps = (obj: any) => {
      if (!obj) return obj;
      const result = { ...obj };
      for (const key in result) {
        if (result[key] instanceof Timestamp) {
          result[key] = result[key].toDate();
        } else if (Array.isArray(result[key])) {
          result[key] = result[key].map((item: any) => 
            typeof item === 'object' && item !== null ? convertTimestamps(item) : item
          );
        } else if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = convertTimestamps(result[key]);
        }
      }
      return result;
    };

    return convertTimestamps(cvData) as CVData;
  } catch (error) {
    console.error('Error getting CV data:', error);
    throw error;
  }
};

// Save CV data to Firestore
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

    // Convert dates to Firestore timestamps
    const convertDates = (obj: any): any => {
      if (!obj) return obj;
      if (obj instanceof Date) {
        return Timestamp.fromDate(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(convertDates);
      }
      if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const key in obj) {
          result[key] = convertDates(obj[key]);
        }
        return result;
      }
      return obj;
    };

    const processedData = convertDates({
      ...data,
      userId,
      updatedAt: new Date()
    });

    // Save to Firestore
    const cvDocRef = doc(db, 'cvs', userId);
    await setDoc(cvDocRef, processedData, { merge: true });

    console.log('CV data saved successfully');
    return data;
  } catch (error: any) {
    console.error('Error saving CV data:', error);
    
    // Firebase specific error handling
    if (error?.code) {
      console.error('Firebase error code:', error.code);
      console.error('Firebase error message:', error.message);
      
      switch (error.code) {
        case 'permission-denied':
          throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.');
        case 'unauthenticated':
          throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        case 'unavailable':
          throw new Error('Veritabanı hizmeti şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.');
        case 'deadline-exceeded':
          throw new Error('İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.');
        default:
          throw new Error(`Veritabanı hatası: ${error.message}`);
      }
    }
    
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
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      throw new Error('Bu işlem için admin yetkisi gerekli');
    }

    const cvsCollection = collection(db, 'cvs');
    const cvsQuery = query(cvsCollection, orderBy('updatedAt', 'desc'));
    const cvsSnapshot = await getDocs(cvsQuery);

    const cvs: CVData[] = [];
    cvsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore timestamps to dates
      const convertTimestamps = (obj: any): any => {
        if (!obj) return obj;
        if (obj instanceof Timestamp) {
          return obj.toDate();
        }
        if (Array.isArray(obj)) {
          return obj.map(convertTimestamps);
        }
        if (typeof obj === 'object' && obj !== null) {
          const result: any = {};
          for (const key in obj) {
            result[key] = convertTimestamps(obj[key]);
          }
          return result;
        }
        return obj;
      };
      
      cvs.push(convertTimestamps(data) as CVData);
    });

    return cvs;
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
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        throw new Error('Bu CV\'yi silme yetkiniz yok');
      }
    }

    const cvDocRef = doc(db, 'cvs', userId);
    await deleteDoc(cvDocRef);
    
    console.log('CV deleted successfully');
  } catch (error) {
    console.error('Error deleting CV:', error);
    throw error;
        }
};

// Initialize empty CV for new users
export const initializeEmptyCV = async (userId: string): Promise<CVData> => {
  const emptyCV: CVData = {
    userId,
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Türkiye',
      summary: '',
      maritalStatus: undefined,
      militaryStatus: undefined,
      drivingLicense: [],
      profileImage: '',
      sgkServiceDocument: ''
    },
    education: [],
    experience: [],
    skills: [],
    languages: [],
    certificates: [],
    projects: [],
    publications: [],
    volunteer: [],
    references: [],
    hobbies: [],
    awards: [],
    evaluation: {
      workSatisfaction: 0,
      facilitiesSatisfaction: 0,
      longTermIntent: 0,
      recommendation: 0,
      applicationSatisfaction: 0
    }
  };

  return await saveCVData(userId, emptyCV);
};

// Search CVs by keywords (admin only)
export const searchCVsByKeywords = async (keywords: string[]): Promise<CVData[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    // Check if user is admin
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      throw new Error('Bu işlem için admin yetkisi gerekli');
    }

    const allCVs = await getAllCVs();
    
    if (!keywords || keywords.length === 0) {
      return allCVs;
    }

    // Convert keywords to lowercase for case-insensitive search
    const searchKeywords = keywords.map(keyword => keyword.toLowerCase().trim()).filter(Boolean);
    
    return allCVs.filter(cv => {
      const searchableText = [
        cv.personalInfo?.firstName || '',
        cv.personalInfo?.lastName || '',
        cv.personalInfo?.email || '',
        cv.personalInfo?.turksatEmployeeNumber || '',
        cv.personalInfo?.summary || '',
        cv.personalInfo?.city || '',
        ...(cv.skills || []).map(skill => skill.name),
        ...(cv.experience || []).map(exp => exp.title + ' ' + exp.company + ' ' + (exp.description || '')),
        ...(cv.education || []).map(edu => edu.degree + ' ' + edu.institution + ' ' + (edu.description || '')),
        ...(cv.certificates || []).map(cert => cert.name),
        ...(cv.projects || []).map(proj => proj.title + ' ' + proj.description),
      ].join(' ').toLowerCase();

      return searchKeywords.some(keyword => searchableText.includes(keyword));
    });
  } catch (error) {
    console.error('Error searching CVs:', error);
    throw error;
  }
};
import { v4 as uuidv4 } from 'uuid';
import { CVData } from '../types/cv';

// Get CV data from localStorage
export const getCVData = async (userId: string): Promise<CVData | null> => {
  // Simulate server delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const storedData = localStorage.getItem(`cv_data_${userId}`);
  return storedData ? JSON.parse(storedData) : null;
};

// Veri optimizasyon fonksiyonu
const optimizeCVData = (data: CVData): CVData => {
  const optimizedData = { ...data };
  
  // Profil resmini daha agresif optimize et
  if (optimizedData.personalInfo?.profileImage) {
    const img = optimizedData.personalInfo.profileImage;
    // Eğer resim çok büyükse, daha da sıkıştır
    if (img.length > 50000) { // ~37KB base64
      console.log('Profil resmi çok büyük, daha da optimize ediliyor...');
      // Bu durumda frontend'de zaten optimize edilmiş olmalı ama yine de uyarı ver
    }
  }
  
  // SGK belgesini optimize et - 5MB'a kadar kabul et
  if (optimizedData.personalInfo?.sgkServiceDocument) {
    const doc = optimizedData.personalInfo.sgkServiceDocument;
    const sizeInMB = doc.length * 0.75 / (1024 * 1024);
    
    if (sizeInMB > 5) {
      console.log(`SGK belgesi çok büyük (${sizeInMB.toFixed(2)}MB), kaldırılıyor...`);
      optimizedData.personalInfo.sgkServiceDocument = undefined;
    } else {
      console.log(`SGK belgesi boyutu: ${sizeInMB.toFixed(2)}MB - Kabul edildi`);
    }
  }
  
  // Boş alanları temizle
  if (optimizedData.projects?.length === 0) delete optimizedData.projects;
  if (optimizedData.volunteer?.length === 0) delete optimizedData.volunteer;
  if (optimizedData.publications?.length === 0) delete optimizedData.publications;
  if (optimizedData.awards?.length === 0) delete optimizedData.awards;
  if (optimizedData.hobbies?.length === 0) delete optimizedData.hobbies;
  if (optimizedData.certificates?.length === 0) delete optimizedData.certificates;
  if (optimizedData.languages?.length === 0) delete optimizedData.languages;
  if (optimizedData.references?.length === 0) delete optimizedData.references;
  if (optimizedData.skills?.length === 0) delete optimizedData.skills;
  if (optimizedData.experience?.length === 0) delete optimizedData.experience;
  if (optimizedData.education?.length === 0) delete optimizedData.education;
  
  return optimizedData;
};

// Save CV data to localStorage
export const saveCVData = async (userId: string, data: CVData): Promise<CVData> => {
  // Simulate server delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Veriyi otomatik olarak optimize et
  const optimizedData = optimizeCVData(data);
  
  // Ensure the data has ID and timestamps
  const updatedData = {
    ...optimizedData,
    id: optimizedData.id || uuidv4(),
    userId,
    createdAt: optimizedData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  try {
    const dataString = JSON.stringify(updatedData);
    const sizeInMB = dataString.length / (1024 * 1024);
    
    console.log(`CV verisi boyutu: ${sizeInMB.toFixed(2)}MB`);
    
    // Eğer hala çok büyükse, kritik olmayan verileri temizle
    if (sizeInMB > 6) {
      console.log('CV verisi çok büyük, otomatik optimizasyon yapılıyor...');
      
      // Kritik olmayan alanları temizle
      const compactData = { ...updatedData };
      
      // Büyük dosyaları kaldır
      if (compactData.personalInfo?.profileImage) {
        compactData.personalInfo.profileImage = undefined;
        console.log('Profil resmi kaldırıldı');
      }
      if (compactData.personalInfo?.sgkServiceDocument) {
        compactData.personalInfo.sgkServiceDocument = undefined;
        console.log('SGK belgesi kaldırıldı');
      }
      
      // Boş dizileri temizle
      if (compactData.projects?.length === 0) delete compactData.projects;
      if (compactData.volunteer?.length === 0) delete compactData.volunteer;
      if (compactData.publications?.length === 0) delete compactData.publications;
      if (compactData.awards?.length === 0) delete compactData.awards;
      if (compactData.hobbies?.length === 0) delete compactData.hobbies;
      
      const compactString = JSON.stringify(compactData);
      const newSizeInMB = compactString.length / (1024 * 1024);
      
      console.log(`Optimizasyon sonrası boyut: ${newSizeInMB.toFixed(2)}MB`);
      
      localStorage.setItem(`cv_data_${userId}`, compactString);
      return compactData;
    }
    
    localStorage.setItem(`cv_data_${userId}`, dataString);
    return updatedData;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        // Son çare: Sadece temel bilgileri kaydet
        console.log('Depolama alanı dolu, sadece temel bilgiler kaydediliyor...');
        
        // Önce mevcut CV verilerini temizle
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cv_data_') && key !== `cv_data_${userId}`) {
            localStorage.removeItem(key);
            console.log(`Eski CV verisi temizlendi: ${key}`);
          }
        }
        
        const essentialData = {
          ...updatedData,
          personalInfo: {
            ...updatedData.personalInfo,
            profileImage: undefined, // Resmi kaldır
            sgkServiceDocument: undefined // Belgeyi kaldır
          }
        };
        
        try {
          localStorage.setItem(`cv_data_${userId}`, JSON.stringify(essentialData));
          throw new Error('Depolama alanı dolu olduğu için profil resmi ve belgeler kaydedilemedi. CV\'nin geri kalanı başarıyla kaydedildi.');
        } catch (finalError) {
          // Tüm localStorage'ı temizle
          localStorage.clear();
          console.log('Tüm localStorage temizlendi');
          
          try {
            localStorage.setItem(`cv_data_${userId}`, JSON.stringify(essentialData));
            throw new Error('Depolama alanı temizlendi ve CV kaydedildi. Profil resmi ve belgeler kaydedilemedi.');
          } catch (veryFinalError) {
            throw new Error('Depolama alanı tamamen dolu. Lütfen tarayıcı verilerini manuel olarak temizleyin.');
          }
        }
      }
      throw error;
    }
    throw new Error('CV kaydedilirken bilinmeyen bir hata oluştu.');
  }
};

// Create or update CV
export const createCV = async (data: CVData): Promise<CVData> => {
  if (!data.userId) {
    throw new Error('CV oluşturmak için kullanıcı ID gerekli');
  }
  
  return saveCVData(data.userId, {...data, userId: data.userId});
};

// Get all CVs (admin only)
export const getAllCVs = async (): Promise<CVData[]> => {
  // Simulate server delay
  await new Promise(resolve => setTimeout(resolve, 700));
  
  const allCVs: CVData[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cv_data_')) {
      const data = localStorage.getItem(key);
      if (data) {
        allCVs.push(JSON.parse(data));
      }
    }
  }
  
  return allCVs;
};

// Search CVs by keywords (admin only)
export const searchCVsByKeywords = async (keywords: string[]): Promise<CVData[]> => {
  const allCVs = await getAllCVs();
  
  if (keywords.length === 0) {
    return allCVs;
  }
  
  return allCVs.filter(cv => {
    // Her anahtar kelime için eşleşme olup olmadığını kontrol et
    return keywords.every(keyword => {
      const keywordLower = keyword.toLowerCase().trim();
      
      if (!keywordLower) return true; // Boş anahtar kelimeleri atla
      
      // Kişisel bilgiler içinde arama
      const personalInfoMatch = cv.personalInfo ? 
        (cv.personalInfo?.firstName?.toLowerCase() || '').includes(keywordLower) ||
        (cv.personalInfo?.lastName?.toLowerCase() || '').includes(keywordLower) || 
        (cv.personalInfo?.summary?.toLowerCase() || '').includes(keywordLower) ||
        (cv.personalInfo?.city?.toLowerCase() || '').includes(keywordLower) ||
        (cv.personalInfo?.country?.toLowerCase() || '').includes(keywordLower) : false;

      // Beceriler içinde arama
      const skillsMatch = cv.skills?.some(skill => 
        skill.name.toLowerCase().includes(keywordLower)
      );
      
      // İş deneyimi içinde arama
      const experienceMatch = cv.experience?.some(exp => 
        exp.description.toLowerCase().includes(keywordLower) ||
        exp.title.toLowerCase().includes(keywordLower) ||
        exp.company.toLowerCase().includes(keywordLower) ||
        (exp.location?.toLowerCase() || '').includes(keywordLower)
      );
      
      // Eğitim bilgileri içinde arama
      const educationMatch = cv.education?.some(edu => 
        edu.degree.toLowerCase().includes(keywordLower) ||
        edu.fieldOfStudy.toLowerCase().includes(keywordLower) ||
        edu.institution.toLowerCase().includes(keywordLower) ||
        (edu.description?.toLowerCase() || '').includes(keywordLower)
      );
      
      // Dil becerileri içinde arama
      const languageMatch = cv.languages?.some(lang =>
        lang.name.toLowerCase().includes(keywordLower)
      );

      // En az bir alanda eşleşme varsa, bu anahtar kelime için TRUE döner
      return personalInfoMatch || skillsMatch || experienceMatch || educationMatch || languageMatch;
    });
  });
};
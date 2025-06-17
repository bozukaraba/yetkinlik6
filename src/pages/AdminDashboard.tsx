import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { getAllCVs, searchCVsByKeywords } from '../services/cvService';
import { CVData } from '../types/cv';
import { Search, FileText, User, Calendar, Briefcase, Tag, Download, Star, Filter, X, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const AdminDashboard: React.FC = () => {
  const [allCVs, setAllCVs] = useState<CVData[]>([]);
  const [cvList, setCVList] = useState<CVData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCV, setSelectedCV] = useState<CVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uniqueUsers, setUniqueUsers] = useState<number>(0);
  

  
  // Gelişmiş filtreleme state'leri
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minExperienceYears: '',
    maxExperienceYears: '',
    minSkillLevel: '',
    skillCategories: [] as string[],
    cities: [] as string[],
    educationLevels: [] as string[]
  });

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Cache için
  const [searchCache, setSearchCache] = useState<Map<string, CVData[]>>(new Map());

  useEffect(() => {
    const loadAllCVs = async () => {
      try {
        const data = await getAllCVs();
        setAllCVs(data);
        setCVList(data);
        
        // Benzersiz kullanıcı sayısını hesapla (email bazında)
        const uniqueEmails = new Set(data.map(cv => cv.personalInfo?.email).filter(Boolean));
        setUniqueUsers(uniqueEmails.size);
      } catch (error) {
        console.error('Error loading CVs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllCVs();
  }, []);

  // Filtreleme seçeneklerini otomatik oluştur
  const filterOptions = useMemo(() => {
    const skillCategories = new Set<string>();
    const cities = new Set<string>();
    const educationLevels = new Set<string>();

    allCVs.forEach(cv => {
      cv.skills?.forEach(skill => {
        if (skill.category) skillCategories.add(skill.category);
      });
      if (cv.personalInfo?.city) cities.add(cv.personalInfo.city);
      cv.education?.forEach(edu => {
        if (edu.educationLevel) educationLevels.add(edu.educationLevel);
      });
    });

    return {
      skillCategories: Array.from(skillCategories).sort(),
      cities: Array.from(cities).sort(),
      educationLevels: Array.from(educationLevels).sort()
    };
  }, [allCVs]);

  // Gelişmiş filtreleme fonksiyonu
  const applyFilters = useCallback((cvs: CVData[]) => {
    return cvs.filter(cv => {
      // Deneyim yılı filtresi
      if (filters.minExperienceYears || filters.maxExperienceYears) {
        const totalExperience = cv.experience?.reduce((total, exp) => {
          if (exp.workDuration) {
            const match = exp.workDuration.match(/(\d+(?:\.\d+)?)/);
            return total + (match ? parseFloat(match[1]) : 0);
          }
          return total;
        }, 0) || 0;

        if (filters.minExperienceYears && totalExperience < parseFloat(filters.minExperienceYears)) {
          return false;
        }
        if (filters.maxExperienceYears && totalExperience > parseFloat(filters.maxExperienceYears)) {
          return false;
        }
      }

      // Beceri seviyesi filtresi
      if (filters.minSkillLevel) {
        const hasRequiredSkillLevel = cv.skills?.some(skill => 
          (skill.level || 0) >= parseFloat(filters.minSkillLevel)
        );
        if (!hasRequiredSkillLevel) return false;
      }

      // Beceri kategorisi filtresi
      if (filters.skillCategories.length > 0) {
        const hasRequiredCategory = cv.skills?.some(skill =>
          filters.skillCategories.includes(skill.category || '')
        );
        if (!hasRequiredCategory) return false;
      }

      // Şehir filtresi
      if (filters.cities.length > 0) {
        if (!cv.personalInfo?.city || !filters.cities.includes(cv.personalInfo.city)) {
          return false;
        }
      }

      // Öğrenim düzeyi filtresi
      if (filters.educationLevels.length > 0) {
        const hasRequiredEducation = cv.education?.some(edu =>
          filters.educationLevels.includes(edu.educationLevel || '')
        );
        if (!hasRequiredEducation) return false;
      }

      return true;
    });
  }, [filters]);

  // Debounced search effect
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery.trim()) {
        const filtered = applyFilters(allCVs);
        setCVList(filtered);
        return;
      }

      setIsSearching(true);
      try {
        const cacheKey = `${debouncedSearchQuery}-${JSON.stringify(filters)}`;
        
        // Cache'den kontrol et
        if (searchCache.has(cacheKey)) {
          setCVList(searchCache.get(cacheKey)!);
          setSelectedCV(null);
          setIsSearching(false);
          return;
        }

        // Split by comma and trim whitespace
        const keywords = debouncedSearchQuery
          .split(',')
          .map(keyword => keyword.trim())
          .filter(Boolean);

        const searchResults = await searchCVsByKeywords(keywords);
        const filteredResults = applyFilters(searchResults);
        
        // Cache'e kaydet
        setSearchCache(prev => new Map(prev.set(cacheKey, filteredResults)));
        setCVList(filteredResults);
        setSelectedCV(null);
      } catch (error) {
        console.error('Error searching CVs:', error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery, filters, allCVs, applyFilters, searchCache]);

  const handleSearch = async () => {
    // Manuel arama butonu için
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        const filtered = applyFilters(allCVs);
        setCVList(filtered);
        return;
      }

      setIsSearching(true);
      try {
        const keywords = searchQuery
          .split(',')
          .map(keyword => keyword.trim())
          .filter(Boolean);

        const searchResults = await searchCVsByKeywords(keywords);
        const filteredResults = applyFilters(searchResults);
        setCVList(filteredResults);
        setSelectedCV(null);
      } catch (error) {
        console.error('Error searching CVs:', error);
      } finally {
        setIsSearching(false);
      }
    };

    await performSearch();
  };

  const handleViewCV = (cv: CVData) => {
    setSelectedCV(cv);
  };









  const handleDownloadCV = async (cv: CVData) => {
    try {
      // CV önizleme elementini oluştur
      const element = document.createElement('div');
      element.id = 'cv-preview-temp';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '0';
      element.style.padding = '40px';
      element.style.width = '210mm';
      element.style.minHeight = '297mm';
      element.style.fontFamily = 'Arial, sans-serif';
      element.style.backgroundColor = '#ffffff';
      
      // CV içeriğini HTML olarak oluştur - ESTETİK VERSİYON
      element.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2d3748; line-height: 1.6;">
          <!-- CV Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; margin: -40px -40px 30px -40px; text-align: center; position: relative;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);"></div>
            <div style="position: relative; z-index: 1;">
              <h1 style="font-size: 36px; font-weight: 700; margin: 0 0 10px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                ${cv.personalInfo?.firstName} ${cv.personalInfo?.lastName}
              </h1>
              <div style="height: 3px; width: 60px; background: #fff; margin: 15px auto 20px auto; border-radius: 2px;"></div>
              <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; font-size: 16px;">
                ${cv.personalInfo?.email ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; background: #fff; border-radius: 50%; display: inline-block;"></span>
                    ${cv.personalInfo.email}
                  </div>
                ` : ''}
                ${cv.personalInfo?.phone ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; background: #fff; border-radius: 50%; display: inline-block;"></span>
                    ${cv.personalInfo.phone}
                  </div>
                ` : ''}
                ${cv.personalInfo?.turksatEmployeeNumber ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; background: #fff; border-radius: 50%; display: inline-block;"></span>
                    Türksat Sicil No: ${cv.personalInfo.turksatEmployeeNumber}
                  </div>
                ` : ''}
                ${cv.personalInfo?.residenceCity || cv.personalInfo?.residenceDistrict ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; background: #fff; border-radius: 50%; display: inline-block;"></span>
                    ${cv.personalInfo?.residenceCity || ''}${cv.personalInfo?.residenceCity && cv.personalInfo?.residenceDistrict ? ' / ' : ''}${cv.personalInfo?.residenceDistrict || ''}
                  </div>
                ` : ''}
              </div>
              ${cv.personalInfo?.gender ? `
                <div style="margin-top: 15px; font-size: 14px; opacity: 0.9;">
                  Cinsiyet: ${cv.personalInfo.gender}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Summary -->
          ${cv.personalInfo?.summary ? `
          <div style="margin-bottom: 35px; background: #f8fafc; padding: 25px; border-radius: 12px; border-left: 5px solid #667eea;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
              <span style="width: 8px; height: 8px; background: #667eea; border-radius: 50%; display: inline-block;"></span>
              Hakkımda
            </h2>
            <p style="color: #4a5568; line-height: 1.7; margin: 0; font-size: 15px;">${cv.personalInfo.summary}</p>
          </div>
          ` : ''}

          <!-- Education -->
          ${cv.education && cv.education.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🎓</span>
              Öğrenim
            </h2>
            ${cv.education.map((edu, index) => `
              <div style="margin-bottom: 25px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 4px solid #38b2ac; position: relative;">
                <div style="position: absolute; top: -5px; left: -7px; width: 14px; height: 14px; background: #38b2ac; border-radius: 50%; border: 3px solid white;"></div>
                <h3 style="font-weight: 600; color: #2d3748; margin: 0 0 8px 0; font-size: 16px;">${edu.degree}</h3>
                <p style="color: #667eea; font-weight: 500; font-size: 14px; margin: 0 0 5px 0;">${edu.fieldOfStudy} - ${edu.institution}</p>
                ${edu.educationLevel ? `<p style="color: #9ca3af; font-size: 13px; margin: 0 0 5px 0;">${edu.educationLevel}</p>` : ''}
                <p style="color: #a0aec0; font-size: 13px; margin: 0 0 15px 0; display: flex; align-items: center; gap: 5px;">
                  <span style="width: 6px; height: 6px; background: #38b2ac; border-radius: 50%; display: inline-block;"></span>
                  ${edu.current ? 'Devam ediyor' : edu.endDate ? `Mezun: ${new Date(edu.endDate).getFullYear()}` : 'Mezuniyet tarihi belirtilmemiş'}
                </p>
                ${edu.description ? `<p style="color: #4a5568; line-height: 1.6; margin: 0; font-size: 14px; font-style: italic;">${edu.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Experience -->
          ${cv.experience && cv.experience.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">💼</span>
              İş Deneyimi
            </h2>
            ${cv.experience.map((exp, index) => `
              <div style="margin-bottom: 25px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 4px solid #ed8936; position: relative;">
                <div style="position: absolute; top: -5px; left: -7px; width: 14px; height: 14px; background: #ed8936; border-radius: 50%; border: 3px solid white;"></div>
                <h3 style="font-weight: 600; color: #2d3748; margin: 0 0 5px 0; font-size: 16px;">${exp.company}</h3>
                <p style="color: #667eea; font-weight: 500; font-size: 15px; margin: 0 0 8px 0;">${exp.title}</p>
                ${exp.department ? `<p style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0; font-style: italic;">🏢 Departman: ${exp.department}</p>` : ''}
                ${exp.location ? `<p style="color: #a0aec0; font-size: 13px; margin: 0 0 5px 0;">📍 ${exp.location}</p>` : ''}
                <p style="color: #a0aec0; font-size: 13px; margin: 0 0 15px 0; display: flex; align-items: center; gap: 5px;">
                  <span style="width: 6px; height: 6px; background: #ed8936; border-radius: 50%; display: inline-block;"></span>
                  ${new Date(exp.startDate).getFullYear()} - ${exp.current ? 'Günümüz' : exp.endDate ? new Date(exp.endDate).getFullYear() : 'Belirtilmemiş'}
                  ${exp.workDuration ? ` (${exp.workDuration})` : ''}
                </p>
                ${exp.tasks ? `<div style="margin-bottom: 12px;"><strong style="color: #2d3748; font-size: 14px;">📋 Görevler:</strong><p style="color: #4a5568; line-height: 1.6; margin: 5px 0 0 0; font-size: 14px;">${exp.tasks}</p></div>` : ''}
                ${exp.projectDetails ? `<div style="margin-bottom: 12px;"><strong style="color: #2d3748; font-size: 14px;">🚀 Projeler:</strong><p style="color: #4a5568; line-height: 1.6; margin: 5px 0 0 0; font-size: 14px;">${exp.projectDetails}</p></div>` : ''}
                ${exp.description ? `<div style="margin-bottom: 0;"><strong style="color: #2d3748; font-size: 14px;">📝 Açıklama:</strong><p style="color: #4a5568; line-height: 1.6; margin: 5px 0 0 0; font-size: 14px;">${exp.description}</p></div>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Skills -->
          ${cv.skills && cv.skills.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">⚡</span>
              Yetenek ve Yetkinlikler
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              ${cv.skills.map(skill => `
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 10px 16px; border-radius: 25px; font-size: 14px; font-weight: 500; box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3); display: flex; align-items: center; gap: 8px;">
                  <span style="width: 6px; height: 6px; background: white; border-radius: 50%; display: inline-block;"></span>
                  ${skill.name}${skill.level ? ` (${skill.level}/5)` : ''}${skill.yearsOfExperience ? ` - ${skill.yearsOfExperience} yıl` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Certificates -->
          ${cv.certificates && cv.certificates.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🏆</span>
              Sertifikalar
            </h2>
            ${cv.certificates.map(cert => `
              <div style="margin-bottom: 20px; background: white; padding: 18px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); border-left: 4px solid #38a169; position: relative;">
                <div style="position: absolute; top: -5px; left: -7px; width: 14px; height: 14px; background: #38a169; border-radius: 50%; border: 3px solid white;"></div>
                <h3 style="font-weight: 600; color: #2d3748; margin: 0 0 8px 0; font-size: 15px;">${cert.name}</h3>
                <p style="color: #a0aec0; font-size: 13px; margin: 0;">📅 ${cert.startDate} - ${cert.endDate}</p>
                ${cert.duration ? `<p style="color: #a0aec0; font-size: 13px; margin: 5px 0 0 0;">⏱️ Süre: ${cert.duration} saat</p>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Languages -->
          ${cv.languages && cv.languages.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🌍</span>
              Yabancı Dil
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 15px;">
              ${cv.languages.map(lang => `
                <div style="background: white; padding: 15px 20px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); border: 2px solid #e2e8f0; min-width: 150px; text-align: center;">
                  <div style="font-weight: 600; color: #2d3748; font-size: 15px; margin-bottom: 5px;">${lang.name}</div>
                  ${lang.examType ? `<div style="color: #667eea; font-size: 13px; margin-bottom: 3px;">${lang.examType}</div>` : ''}
                  ${lang.examScore ? `<div style="color: #38a169; font-weight: 500; font-size: 14px;">${lang.examScore}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Footer -->
          <div style="margin-top: 40px; padding: 20px; background: #f7fafc; border-radius: 10px; text-align: center; border: 2px dashed #e2e8f0;">
            <p style="color: #a0aec0; font-size: 12px; margin: 0;">
              Bu CV Yetkinlik-X Sistemi ile oluşturulmuştur • ${new Date().toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
      `;

      // Elementi DOM'a ekle
      document.body.appendChild(element);

      // HTML'i canvas'a çevir
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Elementi kaldır
      document.body.removeChild(element);

      // Canvas'ı PDF'e ekle
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 genişliği mm
      const pageHeight = 295; // A4 yüksekliği mm  
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // İlk sayfayı ekle
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Çok sayfalı PDF için
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // ARANABILIR METIN KATMANI EKLE
      // Sayfa başına git
      const pageCount = pdf.getNumberOfPages();
      
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Invisible text layer için font ayarları
        pdf.setTextColor(255, 255, 255, 0); // Şeffaf metin
        pdf.setFontSize(1); // Çok küçük font
        
        let yPosition = 10;
        const lineHeight = 2;
        
        // Kişisel bilgiler
        if (cv.personalInfo && i === 1) {
          pdf.text(`${cv.personalInfo.firstName || ''} ${cv.personalInfo.lastName || ''}`, 10, yPosition);
          yPosition += lineHeight;
          
          if (cv.personalInfo.email) {
            pdf.text(cv.personalInfo.email, 10, yPosition);
            yPosition += lineHeight;
          }
          
          if (cv.personalInfo.phone) {
            pdf.text(cv.personalInfo.phone, 10, yPosition);
            yPosition += lineHeight;
          }
          
          if (cv.personalInfo.residenceCity || cv.personalInfo.residenceDistrict) {
            pdf.text(`${cv.personalInfo.residenceCity || ''} ${cv.personalInfo.residenceDistrict || ''}`, 10, yPosition);
            yPosition += lineHeight;
          }
          
          if (cv.personalInfo.summary) {
            const summaryLines = pdf.splitTextToSize(cv.personalInfo.summary, 180);
            summaryLines.forEach((line: string) => {
              pdf.text(line, 10, yPosition);
              yPosition += lineHeight;
            });
          }
        }
        
        // Eğitim bilgileri
        if (cv.education && cv.education.length > 0) {
          pdf.text('Öğrenim Eğitim', 10, yPosition);
          yPosition += lineHeight;
          
          cv.education.forEach(edu => {
            pdf.text(`${edu.degree} ${edu.fieldOfStudy} ${edu.institution}`, 10, yPosition);
            yPosition += lineHeight;
            
            if (edu.description) {
              const descLines = pdf.splitTextToSize(edu.description, 180);
              descLines.forEach((line: string) => {
                pdf.text(line, 10, yPosition);
                yPosition += lineHeight;
              });
            }
          });
        }
        
        // İş deneyimi
        if (cv.experience && cv.experience.length > 0) {
          pdf.text('İş Deneyimi Çalışma Tecrübe', 10, yPosition);
          yPosition += lineHeight;
          
          cv.experience.forEach(exp => {
            pdf.text(`${exp.company} ${exp.title} ${exp.location || ''}`, 10, yPosition);
            yPosition += lineHeight;
            
            if (exp.description) {
              const descLines = pdf.splitTextToSize(exp.description, 180);
              descLines.forEach((line: string) => {
                pdf.text(line, 10, yPosition);
                yPosition += lineHeight;
              });
            }
          });
        }
        
        // Yetenekler
        if (cv.skills && cv.skills.length > 0) {
          pdf.text('Yetenek Yetkinlik Beceri Skill', 10, yPosition);
          yPosition += lineHeight;
          
          cv.skills.forEach(skill => {
            pdf.text(`${skill.name} ${skill.level || ''} ${skill.yearsOfExperience || ''}`, 10, yPosition);
            yPosition += lineHeight;
          });
        }
        
        // Sertifikalar
        if (cv.certificates && cv.certificates.length > 0) {
          pdf.text('Sertifika Certificate Belge', 10, yPosition);
          yPosition += lineHeight;
          
          cv.certificates.forEach(cert => {
            pdf.text(`${cert.name} ${cert.startDate} ${cert.endDate} ${cert.duration || ''}`, 10, yPosition);
            yPosition += lineHeight;
          });
        }
        
        // Diller
        if (cv.languages && cv.languages.length > 0) {
          pdf.text('Yabancı Dil Language İngilizce', 10, yPosition);
          yPosition += lineHeight;
          
          cv.languages.forEach(lang => {
            pdf.text(`${lang.name} ${lang.examType || ''} ${lang.examScore || ''}`, 10, yPosition);
            yPosition += lineHeight;
          });
        }
      }

      // PDF'i indir
      const fileName = `${cv.personalInfo?.firstName}_${cv.personalInfo?.lastName}_CV.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-8 bg-white bg-opacity-95 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Yönetici Paneli
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Tüm CV'leri görüntüleyin ve yönetin
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Beceriler, iş ünvanları veya eğitim bilgileri ile ara (virgülle ayırın)"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Örnek: JavaScript, React, Bilgisayar Mühendisliği
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                showFilters
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtreler
            </button>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className={`px-4 py-2 rounded-md transition-colors ${
                isSearching 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSearching ? 'Aranıyor...' : 'Ara'}
            </button>
          </div>
        </div>

        {/* Gelişmiş Filtreler */}
        {showFilters && (
          <div className="mt-4 bg-white bg-opacity-95 rounded-lg p-4 backdrop-blur-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Gelişmiş Filtreler</h3>
              <button
                onClick={() => {
                  setFilters({
                    minExperienceYears: '',
                    maxExperienceYears: '',
                    minSkillLevel: '',
                    skillCategories: [],
                    cities: [],
                    educationLevels: []
                  });
                  setSearchCache(new Map());
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Filtreleri Temizle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Deneyim Yılı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deneyim Yılı
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minExperienceYears}
                    onChange={(e) => setFilters(prev => ({ ...prev, minExperienceYears: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxExperienceYears}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxExperienceYears: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    min="0"
                  />
                </div>
              </div>

              {/* Minimum Beceri Seviyesi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min. Beceri Seviyesi
                </label>
                <select
                  value={filters.minSkillLevel}
                  onChange={(e) => setFilters(prev => ({ ...prev, minSkillLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Tümü</option>
                  <option value="1">1 - Başlangıç</option>
                  <option value="2">2 - Temel</option>
                  <option value="3">3 - Orta</option>
                  <option value="4">4 - İleri</option>
                  <option value="5">5 - Uzman</option>
                </select>
              </div>

              {/* Şehirler */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şehir
                </label>
                <select
                  multiple
                  value={filters.cities}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setFilters(prev => ({ ...prev, cities: values }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
                >
                  {filterOptions.cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Ctrl+click ile çoklu seçim</p>
              </div>

              {/* Beceri Kategorileri */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beceri Kategorisi
                </label>
                <select
                  multiple
                  value={filters.skillCategories}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setFilters(prev => ({ ...prev, skillCategories: values }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
                >
                  {filterOptions.skillCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Ctrl+click ile çoklu seçim</p>
              </div>

              {/* Öğrenim Düzeyi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Öğrenim Düzeyi
                </label>
                <select
                  multiple
                  value={filters.educationLevels}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setFilters(prev => ({ ...prev, educationLevels: values }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
                >
                  {filterOptions.educationLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Ctrl+click ile çoklu seçim</p>
              </div>
            </div>

            {/* Aktif Filtreler */}
            {(filters.minExperienceYears || filters.maxExperienceYears || filters.minSkillLevel || 
              filters.skillCategories.length > 0 || filters.cities.length > 0 || filters.educationLevels.length > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {filters.minExperienceYears && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Min deneyim: {filters.minExperienceYears} yıl
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, minExperienceYears: '' }))}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.maxExperienceYears && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Max deneyim: {filters.maxExperienceYears} yıl
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, maxExperienceYears: '' }))}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.minSkillLevel && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Min beceri: {filters.minSkillLevel}
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, minSkillLevel: '' }))}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.cities.map(city => (
                    <span key={city} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {city}
                      <button
                        onClick={() => setFilters(prev => ({ 
                          ...prev, 
                          cities: prev.cities.filter(c => c !== city) 
                        }))}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.skillCategories.map(category => (
                    <span key={category} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {category}
                      <button
                        onClick={() => setFilters(prev => ({ 
                          ...prev, 
                          skillCategories: prev.skillCategories.filter(c => c !== category) 
                        }))}
                        className="ml-1 text-yellow-600 hover:text-yellow-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.educationLevels.map(level => (
                    <span key={level} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {level}
                      <button
                        onClick={() => setFilters(prev => ({ 
                          ...prev, 
                          educationLevels: prev.educationLevels.filter(l => l !== level) 
                        }))}
                        className="ml-1 text-indigo-600 hover:text-indigo-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CV List */}
        <div className="lg:col-span-1">
          <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">CV Listesi</h2>
              <div className="text-sm text-gray-600">
                {isLoading ? 'Yükleniyor...' : `${cvList.length} sonuç`}
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {cvList.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">CV bulunamadı</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {cvList.map((cv) => (
                      <div 
                        key={cv.id} 
                        className={`p-4 rounded-md transition-colors cursor-pointer ${
                          selectedCV?.id === cv.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                        onClick={() => handleViewCV(cv)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{cv.personalInfo?.firstName} {cv.personalInfo?.lastName}</h3>
                            <p className="text-sm text-gray-600">{cv.personalInfo?.email}</p>
                            
                            {cv.skills && cv.skills.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {cv.skills.slice(0, 3).map(skill => (
                                  <span 
                                    key={skill.id} 
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                  >
                                    {skill.name}
                                  </span>
                                ))}
                                {cv.skills.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                    +{cv.skills.length - 3} daha
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          </div>
                          <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* CV Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">CV Önizleme</h2>
            
            {selectedCV ? (
              <div id="cv-preview">
                {/* CV Header */}
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                      {/* Profil Resmi */}
                      {selectedCV.personalInfo?.profileImage ? (
                        <img
                          src={selectedCV.personalInfo.profileImage}
                          alt="Profil"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          {selectedCV.personalInfo?.firstName} {selectedCV.personalInfo?.lastName}
                        </h1>
                        <div className="mt-2 space-y-1">
                          <p className="flex items-center text-gray-600">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            {selectedCV.personalInfo?.email}
                          </p>
                          <p className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            Son güncelleme: {new Date(selectedCV.updatedAt || Date.now()).toLocaleDateString()}
                          </p>
                          {selectedCV.personalInfo?.phone && (
                            <p className="flex items-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {selectedCV.personalInfo?.phone}
                            </p>
                          )}
                          {selectedCV.personalInfo?.turksatEmployeeNumber && (
                            <p className="flex items-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              Türksat Sicil No: {selectedCV.personalInfo?.turksatEmployeeNumber}
                            </p>
                          )}
                          {selectedCV.personalInfo?.gender && (
                            <p className="flex items-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Cinsiyet: {selectedCV.personalInfo?.gender}
                            </p>
                          )}
                          {(selectedCV.personalInfo?.residenceCity || selectedCV.personalInfo?.residenceDistrict) && (
                            <p className="flex items-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              İkametgah: {selectedCV.personalInfo?.residenceCity || ''}{selectedCV.personalInfo?.residenceCity && selectedCV.personalInfo?.residenceDistrict ? ' / ' : ''}{selectedCV.personalInfo?.residenceDistrict || ''}
                            </p>
                          )}
                          {(selectedCV.personalInfo?.linkedIn || selectedCV.personalInfo?.github || selectedCV.personalInfo?.twitter || selectedCV.personalInfo?.website || selectedCV.personalInfo?.instagram || selectedCV.personalInfo?.facebook || selectedCV.personalInfo?.youtube || selectedCV.personalInfo?.tiktok || selectedCV.personalInfo?.discord || selectedCV.personalInfo?.telegram || selectedCV.personalInfo?.whatsapp || selectedCV.personalInfo?.medium || selectedCV.personalInfo?.behance || selectedCV.personalInfo?.dribbble || selectedCV.personalInfo?.stackoverflow) && (
                            <div className="mt-2 space-y-1">
                              {selectedCV.personalInfo?.linkedIn && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  LinkedIn: {selectedCV.personalInfo.linkedIn}
                                </p>
                              )}
                              {selectedCV.personalInfo?.github && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  GitHub: {selectedCV.personalInfo.github}
                                </p>
                              )}
                              {selectedCV.personalInfo?.twitter && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Twitter: {selectedCV.personalInfo.twitter}
                                </p>
                              )}
                              {selectedCV.personalInfo?.instagram && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Instagram: {selectedCV.personalInfo.instagram}
                                </p>
                              )}
                              {selectedCV.personalInfo?.facebook && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Facebook: {selectedCV.personalInfo.facebook}
                                </p>
                              )}
                              {selectedCV.personalInfo?.youtube && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  YouTube: {selectedCV.personalInfo.youtube}
                                </p>
                              )}
                              {selectedCV.personalInfo?.tiktok && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  TikTok: {selectedCV.personalInfo.tiktok}
                                </p>
                              )}
                              {selectedCV.personalInfo?.discord && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Discord: {selectedCV.personalInfo.discord}
                                </p>
                              )}
                              {selectedCV.personalInfo?.telegram && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Telegram: {selectedCV.personalInfo.telegram}
                                </p>
                              )}
                              {selectedCV.personalInfo?.whatsapp && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  WhatsApp: {selectedCV.personalInfo.whatsapp}
                                </p>
                              )}
                              {selectedCV.personalInfo?.medium && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Medium: {selectedCV.personalInfo.medium}
                                </p>
                              )}
                              {selectedCV.personalInfo?.behance && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Behance: {selectedCV.personalInfo.behance}
                                </p>
                              )}
                              {selectedCV.personalInfo?.dribbble && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Dribbble: {selectedCV.personalInfo.dribbble}
                                </p>
                              )}
                              {selectedCV.personalInfo?.stackoverflow && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Stack Overflow: {selectedCV.personalInfo.stackoverflow}
                                </p>
                              )}
                              {selectedCV.personalInfo?.website && (
                                <p className="flex items-center text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Website: {selectedCV.personalInfo.website}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDownloadCV(selectedCV)}
                      className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      CV İndir
                    </button>
                  </div>
                  
                  {selectedCV.personalInfo?.summary && (
                    <div className="mt-4">
                      <h2 className="text-lg font-semibold text-gray-800 mb-2">Profesyonel Özet</h2>
                      <p className="text-gray-700">{selectedCV.personalInfo.summary}</p>
                    </div>
                  )}
                  
                  {/* SGK Hizmet Dökümü */}
                  {selectedCV.personalInfo?.sgkServiceDocument && (
                    <div className="mt-4">
                      <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        SGK Hizmet Dökümü
                      </h2>
                      <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                        <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">SGK Hizmet Dökümü PDF</p>
                          <p className="text-xs text-green-600">Dosya yüklenmiş</p>
                        </div>
                        <a
                          href={selectedCV.personalInfo.sgkServiceDocument}
                          download="SGK_Hizmet_Dokumu.pdf"
                          className="ml-3 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          İndir
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Education */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                    Öğrenim
                  </h2>
                  
                  {selectedCV.education && selectedCV.education.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCV.education.map(edu => (
                        <div key={edu.id} className="border-l-2 border-gray-200 pl-4">
                          <h3 className="font-medium text-gray-900">{edu.degree}</h3>
                          <p className="text-sm text-gray-600">{edu.fieldOfStudy} - {edu.institution}</p>
                          {edu.educationLevel && (
                            <p className="text-sm text-gray-500">{edu.educationLevel}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            {edu.current 
                              ? 'Devam ediyor' 
                              : edu.endDate 
                                ? (edu.endDate.includes('-') && edu.endDate.split('-').length === 3 ? 
                                   `Mezun: ${edu.endDate}` : 'Mezuniyet tarihi belirtilmemiş')
                                : 'Mezuniyet tarihi belirtilmemiş'
                            }
                          </p>
                          {edu.description && (
                            <p className="mt-2 text-gray-700">{edu.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Öğrenim bilgisi listelenmemiş</p>
                  )}
                </div>
                
                {/* Experience */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-blue-500" />
                    İş Deneyimi
                  </h2>
                  
                  {selectedCV.experience && selectedCV.experience.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCV.experience.map(exp => (
                        <div key={exp.id} className="border-l-2 border-gray-200 pl-4">
                          <h3 className="font-medium text-gray-900">{exp.company} - {exp.title}</h3>
                          {exp.department && (
                            <p className="text-sm text-gray-600 italic">🏢 Departman: {exp.department}</p>
                          )}
                          <p className="text-sm text-gray-600">{exp.location && `📍 ${exp.location}`}</p>
                          <p className="text-sm text-gray-500">
                            {exp.startDate ? 
                              (exp.startDate.includes('-') && exp.startDate.split('-').length === 3 ? 
                                exp.startDate : 'Başlangıç tarihi belirtilmemiş') : 
                              'Başlangıç tarihi belirtilmemiş'} - 
                            {exp.current 
                              ? ' Günümüz' 
                              : exp.endDate 
                                ? (exp.endDate.includes('-') && exp.endDate.split('-').length === 3 ? 
                                   ` ${exp.endDate}` : ' Bitiş tarihi belirtilmemiş')
                                : ' Bitiş tarihi belirtilmemiş'
                            }
                            {exp.workDuration && ` (${exp.workDuration})`}
                          </p>
                          {exp.tasks && (
                            <div className="mt-2">
                              <strong className="text-sm text-gray-700">📋 Görevler:</strong>
                              <p className="text-sm text-gray-700 mt-1">{exp.tasks}</p>
                            </div>
                          )}
                          {exp.projectDetails && (
                            <div className="mt-2">
                              <strong className="text-sm text-gray-700">🚀 Projeler:</strong>
                              <p className="text-sm text-gray-700 mt-1">{exp.projectDetails}</p>
                            </div>
                          )}
                          {exp.description && (
                            <div className="mt-2">
                              <strong className="text-sm text-gray-700">📝 Açıklama:</strong>
                              <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">İş deneyimi listelenmemiş</p>
                  )}
                </div>
                
                {/* Skills */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-blue-500" />
                    Yetenek ve Yetkinlikler
                  </h2>
                  
                  {selectedCV.skills && selectedCV.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedCV.skills.map(skill => (
                        <span 
                          key={skill.id} 
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded"
                        >
                          {skill.name} 
                          {skill.level && (
                            <span className="ml-1 text-blue-600">
                              ({skill.level}/5)
                            </span>
                          )}
                          {skill.yearsOfExperience && (
                            <span className="ml-1 text-blue-600">
                              - {skill.yearsOfExperience} yıl
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Beceri listelenmemiş</p>
                  )}
                </div>
                
                {/* Certificates */}
                {selectedCV.certificates && selectedCV.certificates.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Sertifikalar
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCV.certificates.map(cert => (
                        <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{cert.name}</h3>
                          <p className="text-sm text-gray-600">Başlangıç: {cert.startDate}</p>
                          <p className="text-sm text-gray-600">Bitiş: {cert.endDate}</p>
                          {cert.duration && (
                            <p className="text-sm text-gray-500">Süre: {cert.duration} saat</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Languages */}
                {selectedCV.languages && selectedCV.languages.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      Yabancı Dil
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCV.languages.map(lang => (
                        <div key={lang.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{lang.name}</h3>
                          {lang.examType && (
                            <p className="text-sm text-gray-600">Sınav Türü: {lang.examType}</p>
                          )}
                          {lang.examScore && (
                            <p className="text-sm text-gray-600">Sınav Puanı: {lang.examScore}</p>
                          )}
                          {lang.certificateDate && (
                            <p className="text-sm text-gray-500">Belge Tarihi: {lang.certificateDate}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Publications */}
                {selectedCV.publications && selectedCV.publications.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Yayınlar ve Makaleler
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCV.publications.map(pub => (
                        <div key={pub.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{pub.title}</h3>
                          <p className="text-sm text-gray-600">Yayınlayıcı: {pub.publisher}</p>
                          <p className="text-sm text-gray-600">Tarih: {pub.publishDate}</p>
                          {pub.description && (
                            <p className="text-sm text-gray-500 mt-2">{pub.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Awards */}
                {selectedCV.awards && selectedCV.awards.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Ödüller ve Başarılar
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCV.awards.map(award => (
                        <div key={award.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{award.title}</h3>
                          <p className="text-sm text-gray-600">{award.organization}</p>
                          <p className="text-sm text-gray-600">Tarih: {award.date}</p>
                          {award.description && (
                            <p className="text-sm text-gray-500 mt-2">{award.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Awards */}
                {selectedCV.awards && selectedCV.awards.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Ödüller ve Başarılar
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCV.awards.map(award => (
                        <div key={award.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{award.title}</h3>
                          <p className="text-sm text-gray-600">{award.organization}</p>
                          <p className="text-sm text-gray-600">Tarih: {award.date}</p>
                          {award.description && (
                            <p className="text-sm text-gray-500 mt-2">{award.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Publications */}
                {selectedCV.publications && selectedCV.publications.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Yayınlar ve Makaleler
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCV.publications.map(pub => (
                        <div key={pub.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{pub.title}</h3>
                          <p className="text-sm text-gray-600">Yayınlayıcı: {pub.publisher}</p>
                          <p className="text-sm text-gray-600">Tarih: {pub.publishDate}</p>
                          {pub.description && (
                            <p className="text-sm text-gray-500 mt-2">{pub.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Hobbies */}
                {selectedCV.hobbies && selectedCV.hobbies.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-6V7a3 3 0 00-3-3H6a3 3 0 00-3 3v4a3 3 0 003 3h7m2 5.172V14h-8c-1.105 0-2-.895-2-2V9c0-1.105.895-2 2-2h8c1.105 0 2 .895 2 2v3" />
                      </svg>
                      Hobi ve İlgi Alanları
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedCV.hobbies.map((hobby, index) => (
                        <div 
                          key={hobby.id || index} 
                          className="border border-purple-200 bg-purple-50 rounded-lg p-3"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-purple-800 text-sm">
                              {typeof hobby === 'string' ? hobby : hobby.category}
                            </span>
                            {typeof hobby !== 'string' && hobby.customValue && (
                              <span className="text-purple-600 text-xs mt-1">
                                {hobby.customValue}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* References */}
                {selectedCV.references && selectedCV.references.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-500" />
                      Referanslar
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCV.references.map(ref => (
                        <div key={ref.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{ref.name}</h3>
                          <p className="text-sm text-gray-600">{ref.company}</p>
                          <p className="text-sm text-gray-600">{ref.phone}</p>
                          {ref.type && (
                            <p className="text-sm text-gray-500 mt-2">
                              {ref.type}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">CV Seçilmedi</h3>
                <p className="mt-1 text-gray-500 max-w-sm">
                  Detayları görüntülemek için listeden bir CV seçin veya belirli adayları bulmak için arama yapın
                </p>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default AdminDashboard;
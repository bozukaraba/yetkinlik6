import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { getAllCVs, searchCVsByKeywords } from '../services/cvService';
import { CVData } from '../types/cv';
import { Search, FileText, User, Calendar, Briefcase, Tag, Download, Star, BarChart3, Filter, X } from 'lucide-react';
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
      // CV önizleme elementini bul
      const previewElement = document.getElementById('cv-preview');
      
      if (!previewElement) {
        alert('CV önizleme ekranı bulunamadı. Lütfen önce bir CV seçin.');
        return;
      }

      // HTML'i canvas'a çevir
      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: previewElement.scrollWidth,
        windowHeight: previewElement.scrollHeight
      });

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
                              {selectedCV.personalInfo.phone}
                            </p>
                          )}
                          {selectedCV.personalInfo?.turksatEmployeeNumber && (
                            <p className="flex items-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              Türksat Sicil: {selectedCV.personalInfo.turksatEmployeeNumber}
                            </p>
                          )}
                          {selectedCV.personalInfo?.birthDate && (
                            <p className="flex items-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Doğum Tarihi: {new Date(selectedCV.personalInfo.birthDate).toLocaleDateString()}
                            </p>
                          )}
                          {(selectedCV.personalInfo?.residenceCity || selectedCV.personalInfo?.city) && (
                            <p className="flex items-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              İkametgah: {selectedCV.personalInfo.residenceCity || selectedCV.personalInfo.city}
                              {selectedCV.personalInfo?.residenceDistrict && ` / ${selectedCV.personalInfo.residenceDistrict}`}
                            </p>
                          )}
                          {selectedCV.personalInfo?.gender && (
                            <p className="flex items-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Cinsiyet: {selectedCV.personalInfo.gender}
                            </p>
                          )}
                          {selectedCV.personalInfo?.maritalStatus && (
                            <p className="flex items-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              Medeni Durum: {selectedCV.personalInfo.maritalStatus === 'evli' ? 'Evli' : 'Bekar'}
                            </p>
                          )}
                          {selectedCV.personalInfo?.militaryStatus && (
                            <p className="flex items-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Askerlik: {
                                selectedCV.personalInfo.militaryStatus === 'yapıldı' ? 'Yapıldı' :
                                selectedCV.personalInfo.militaryStatus === 'muaf' ? 'Muaf' :
                                selectedCV.personalInfo.militaryStatus === 'tecilli' ? 'Tecilli' :
                                'Yapılmadı'
                              }
                            </p>
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
                                ? `Mezun: ${edu.endDate}`
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
                          <p className="text-sm text-gray-600">{exp.location && `📍 ${exp.location}`}</p>
                          <p className="text-sm text-gray-500">
                            {exp.startDate || 'Başlangıç tarihi belirtilmemiş'} - 
                            {exp.current 
                              ? ' Günümüz' 
                              : exp.endDate || ' Bitiş tarihi belirtilmemiş'
                            }
                            {exp.workDuration && ` (${exp.workDuration})`}
                          </p>
                          {exp.description && (
                            <p className="mt-2 text-gray-700">{exp.description}</p>
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
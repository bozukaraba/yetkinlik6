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
                          {selectedCV.personalInfo?.address && (
                            <p className="flex items-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                              Adres: {selectedCV.personalInfo.address}
                              {selectedCV.personalInfo?.city && ` - ${selectedCV.personalInfo.city}`}
                              {selectedCV.personalInfo?.postalCode && ` (${selectedCV.personalInfo.postalCode})`}
                              {selectedCV.personalInfo?.country && ` - ${selectedCV.personalInfo.country}`}
                            </p>
                          )}
                          {selectedCV.personalInfo?.drivingLicense && selectedCV.personalInfo.drivingLicense.length > 0 && (
                            <p className="flex items-center text-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v3a1 1 0 01-1 1h-1v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8H4a1 1 0 01-1-1V5a1 1 0 011-1h3zM9 3v1h6V3H9zm1 6h4v2h-4V9z" />
                              </svg>
                              Sürücü Belgesi: {selectedCV.personalInfo.drivingLicense.join(', ')}
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
                  
                  {/* SGK Belgesi */}
                  {selectedCV.personalInfo?.sgkServiceDocument && (
                    <div className="mt-4">
                      <h2 className="text-lg font-semibold text-gray-800 mb-2">SGK Hizmet Dökümü</h2>
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-green-800">SGK Hizmet Dökümü PDF</p>
                          <p className="text-xs text-green-600">Dosya yüklenmiş</p>
                        </div>
                        <a
                          href={selectedCV.personalInfo.sgkServiceDocument}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Görüntüle
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Sosyal Medya Hesapları */}
                  {(selectedCV.personalInfo?.linkedIn || selectedCV.personalInfo?.github || selectedCV.personalInfo?.twitter || 
                    selectedCV.personalInfo?.instagram || selectedCV.personalInfo?.facebook || selectedCV.personalInfo?.youtube ||
                    selectedCV.personalInfo?.tiktok || selectedCV.personalInfo?.discord || selectedCV.personalInfo?.telegram ||
                    selectedCV.personalInfo?.whatsapp || selectedCV.personalInfo?.medium || selectedCV.personalInfo?.behance ||
                    selectedCV.personalInfo?.dribbble || selectedCV.personalInfo?.stackoverflow || selectedCV.personalInfo?.website) && (
                    <div className="mt-4">
                      <h2 className="text-lg font-semibold text-gray-800 mb-3">Sosyal Medya & İletişim</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedCV.personalInfo?.linkedIn && (
                          <a
                            href={selectedCV.personalInfo.linkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            LinkedIn
                          </a>
                        )}
                        {selectedCV.personalInfo?.github && (
                          <a
                            href={selectedCV.personalInfo.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            GitHub
                          </a>
                        )}
                        {selectedCV.personalInfo?.website && (
                          <a
                            href={selectedCV.personalInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            Website
                          </a>
                        )}
                        {selectedCV.personalInfo?.twitter && (
                          <a
                            href={selectedCV.personalInfo.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                            Twitter
                          </a>
                        )}
                        {selectedCV.personalInfo?.instagram && (
                          <a
                            href={selectedCV.personalInfo.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors text-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            Instagram
                          </a>
                        )}
                        {selectedCV.personalInfo?.medium && (
                          <a
                            href={selectedCV.personalInfo.medium}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
                            </svg>
                            Medium
                          </a>
                        )}
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
                
                {/* Projects */}
                {selectedCV.projects && selectedCV.projects.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Projeler
                    </h2>
                    
                    <div className="space-y-4">
                      {selectedCV.projects.map(project => (
                        <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{project.title}</h3>
                          <p className="text-sm text-gray-700 mt-2">{project.description}</p>
                          {project.role && (
                            <p className="text-sm text-gray-600 mt-1">Rol: {project.role}</p>
                          )}
                          {project.url && (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                            >
                              Proje Linki →
                            </a>
                          )}
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {project.technologies.map((tech, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                          {(project.startDate || project.endDate) && (
                            <p className="text-sm text-gray-500 mt-2">
                              {project.startDate} - {project.endDate || 'Devam ediyor'}
                            </p>
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
                      Yayınlar
                    </h2>
                    
                    <div className="space-y-4">
                      {selectedCV.publications.map(pub => (
                        <div key={pub.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{pub.title}</h3>
                          <p className="text-sm text-gray-600">Yazarlar: {pub.authors.join(', ')}</p>
                          <p className="text-sm text-gray-600">Yayın Tarihi: {pub.publishDate}</p>
                          {pub.publisher && (
                            <p className="text-sm text-gray-600">Yayıncı: {pub.publisher}</p>
                          )}
                          {pub.description && (
                            <p className="text-sm text-gray-700 mt-2">{pub.description}</p>
                          )}
                          {pub.url && (
                            <a
                              href={pub.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                            >
                              Yayını Görüntüle →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Volunteer Experience */}
                {selectedCV.volunteer && selectedCV.volunteer.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Gönüllü Deneyim
                    </h2>
                    
                    <div className="space-y-4">
                      {selectedCV.volunteer.map(vol => (
                        <div key={vol.id} className="border-l-2 border-gray-200 pl-4">
                          <h3 className="font-medium text-gray-900">{vol.organization} - {vol.role}</h3>
                          <p className="text-sm text-gray-500">
                            {vol.startDate} - {vol.current ? 'Devam ediyor' : (vol.endDate || 'Bitiş tarihi belirtilmemiş')}
                          </p>
                          {vol.description && (
                            <p className="mt-2 text-gray-700">{vol.description}</p>
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
                      Ödüller & Başarılar
                    </h2>
                    
                    <div className="space-y-4">
                      {selectedCV.awards.map(award => (
                        <div key={award.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{award.title}</h3>
                          <p className="text-sm text-gray-600">{award.organization}</p>
                          <p className="text-sm text-gray-500">Tarih: {award.date}</p>
                          {award.description && (
                            <p className="text-sm text-gray-700 mt-2">{award.description}</p>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-12 5.757c0 1.061.421 2.078 1.172 2.828L12 21l8.828-8.415A4.005 4.005 0 0022 10.172V6.828a1 1 0 00-.293-.707l-2.828-2.828A1 1 0 0018.172 3H5.828a1 1 0 00-.707.293L2.293 6.121A1 1 0 002 6.828v3.344a4.005 4.005 0 001.172 2.828L12 21z" />
                      </svg>
                      Hobiler & İlgi Alanları
                    </h2>
                    
                    <div className="space-y-3">
                      {selectedCV.hobbies.map(hobby => (
                        <div 
                          key={hobby.id} 
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                        >
                          <div className="flex items-start gap-2">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              {hobby.category === 'Diğer' && hobby.customValue ? hobby.customValue : hobby.category}
                            </span>
                          </div>
                          {hobby.category !== 'Diğer' && hobby.customValue && (
                            <p className="text-sm text-gray-700 mt-2 pl-1">
                              <span className="font-medium">Detay:</span> {hobby.customValue}
                            </p>
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

                {/* Goals (Hedefleriniz) */}
                {selectedCV.goals && selectedCV.goals.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      Hedefleriniz
                    </h2>
                    <div className="space-y-3">
                      {selectedCV.goals.map(goal => (
                        <div key={goal.category} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <span className="font-medium text-gray-800 w-56">{goal.category}</span>
                          <span className="flex items-center">
                            {[1,2,3,4,5].map(star => (
                              <svg key={star} className={`w-5 h-5 ${star <= goal.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.049 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                              </svg>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">({goal.rating}/5)</span>
                          </span>
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
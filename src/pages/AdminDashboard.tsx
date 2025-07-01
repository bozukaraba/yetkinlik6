import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { getAllCVs, searchCVsByKeywords } from '../services/cvService';
import { authAPI } from '../services/apiService';
import { CVData } from '../types/cv';
import { Search, FileText, User, Calendar, Briefcase, Tag, Download, Star, BarChart3, Filter, X, Settings, Users, Shield, Key } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// User type için interface
interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

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
  const [activeTab, setActiveTab] = useState<'cvs' | 'users'>('cvs');
  const [allCVs, setAllCVs] = useState<CVData[]>([]);
  const [cvList, setCVList] = useState<CVData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCV, setSelectedCV] = useState<CVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Kullanıcı yönetimi state'leri
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
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

  // Kullanıcı yönetimi fonksiyonları
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await authAPI.getAllUsers();
      if (response.success && response.data?.users) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
      alert('Kullanıcılar yüklenirken hata oluştu.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const response = await authAPI.updateUserRole(userId, newRole);
      if (response.success) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        alert(`Kullanıcı rolü "${newRole}" olarak güncellendi.`);
      }
    } catch (error) {
      console.error('Rol değiştirme hatası:', error);
      alert('Rol değiştirilirken hata oluştu.');
    }
  };

  const handlePasswordChange = async () => {
    if (!selectedUser || !newPassword.trim()) {
      alert('Lütfen geçerli bir şifre girin.');
      return;
    }

    if (newPassword.length < 6) {
      alert('Şifre en az 6 karakter olmalı.');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await authAPI.updateUserPassword(selectedUser.id, newPassword);
      if (response.success) {
        alert('Kullanıcı şifresi başarıyla güncellendi.');
        setShowPasswordModal(false);
        setNewPassword('');
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      alert('Şifre değiştirilirken hata oluştu.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Tab değiştiğinde kullanıcıları yükle
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

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

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('cvs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'cvs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              CV Yönetimi
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Kullanıcı Yönetimi
            </button>
          </nav>
        </div>
      </div>

      {/* CV Yönetimi Sekmesi */}
      {activeTab === 'cvs' && (
        <>
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

            {/* Gelişmiş Filtreler - buraya mevcut filter içeriğini ekleyeceğim */}
            {showFilters && (
              <div className="mt-4 bg-white bg-opacity-95 rounded-lg p-4 backdrop-blur-sm border border-gray-200">
                {/* Mevcut filter içeriği buraya */}
              </div>
            )}
          </div>

          {/* CV Grid Layout */}
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
                    {/* CV içeriği buraya gelecek */}
                    <div className="text-center py-8">
                      <p className="text-gray-500">CV içeriği yüklenecek...</p>
                    </div>
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
        </>
      )}

      {/* Kullanıcı Yönetimi Sekmesi */}
      {activeTab === 'users' && (
        <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Kullanıcı Yönetimi</h2>
            <button
              onClick={loadUsers}
              disabled={usersLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {usersLoading ? 'Yükleniyor...' : 'Yenile'}
            </button>
          </div>

          {usersLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kayıt Tarihi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1"
                        >
                          <option value="user">Kullanıcı</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPasswordModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3 flex items-center"
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Şifre Değiştir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && !usersLoading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Henüz kullanıcı bulunamadı.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Şifre Değiştirme Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedUser.name} için Şifre Değiştir
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum 6 karakter"
                  minLength={6}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  İptal
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading || newPassword.length < 6}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {passwordLoading ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
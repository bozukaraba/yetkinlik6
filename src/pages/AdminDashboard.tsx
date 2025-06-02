import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllCVs, searchCVsByKeywords } from '../services/cvService';
import { CVData } from '../types/cv';
import { Search, FileText, User, Calendar, Briefcase, Tag, Download, Star, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [cvList, setCVList] = useState<CVData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCV, setSelectedCV] = useState<CVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAllCVs = async () => {
      try {
        const data = await getAllCVs();
        setCVList(data);
      } catch (error) {
        console.error('Error loading CVs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllCVs();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      const allCVs = await getAllCVs();
      setCVList(allCVs);
      return;
    }

    setIsSearching(true);
    try {
      // Split by comma and trim whitespace
      const keywords = searchQuery
        .split(',')
        .map(keyword => keyword.trim())
        .filter(Boolean);

      const results = await searchCVsByKeywords(keywords);
      setCVList(results);
      setSelectedCV(null);
    } catch (error) {
      console.error('Error searching CVs:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewCV = (cv: CVData) => {
    setSelectedCV(cv);
  };

  const handleDownloadCV = async (cv: CVData) => {
    try {
      // CV preview elementini bul
      const element = document.getElementById('cv-preview');
      if (!element) {
        alert('CV önizleme bulunamadı. Lütfen tekrar deneyin.');
        return;
      }

      // HTML'i canvas'a çevir
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // PDF oluştur
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 genişlik
      const pageHeight = 295; // A4 yükseklik
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // İlk sayfa
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Eğer içerik birden fazla sayfaya sığmıyorsa
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Yönetici Paneli
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Aday CV'lerini ara ve yönet
            </p>
          </div>
          <Link
            to="/admin/reports"
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            Değerlendirme Raporu
          </Link>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CV List */}
        <div className="lg:col-span-1">
          <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-4 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">CV Listesi</h2>
            
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
                        className={`p-4 rounded-md cursor-pointer transition-colors ${
                          selectedCV?.id === cv.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                        onClick={() => handleViewCV(cv)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
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
                          <FileText className="h-5 w-5 text-gray-400" />
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
                          <p className="text-sm text-gray-600">{exp.location && `${exp.location}`}</p>
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
                          <p className="mt-2 text-gray-700">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">İş deneyimi listelenmemiş</p>
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
                      Hobiler
                    </h2>
                    
                    <div className="flex flex-wrap gap-2">
                      {selectedCV.hobbies.map((hobby, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded"
                        >
                          {hobby}
                        </span>
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
                
                {/* Evaluations */}
                {selectedCV.evaluation && (selectedCV.evaluation.workSatisfaction > 0 || selectedCV.evaluation.facilitiesSatisfaction > 0 || selectedCV.evaluation.longTermIntent > 0 || selectedCV.evaluation.recommendation > 0 || selectedCV.evaluation.applicationSatisfaction > 0) && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-500" />
                      Değerlendirmeler
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCV.evaluation.workSatisfaction > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">Türksat'ta çalışmaktan memnunum</h3>
                          <div className="flex items-center">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < selectedCV.evaluation.workSatisfaction ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">({selectedCV.evaluation.workSatisfaction}/5)</span>
                          </div>
                        </div>
                      )}
                      
                      {selectedCV.evaluation.facilitiesSatisfaction > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">Türksat'ın sağladığı imkânlardan memnunum</h3>
                          <div className="flex items-center">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < selectedCV.evaluation.facilitiesSatisfaction ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">({selectedCV.evaluation.facilitiesSatisfaction}/5)</span>
                          </div>
                        </div>
                      )}
                      
                      {selectedCV.evaluation.longTermIntent > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">Türksat'ta uzun süre çalışmak isterim</h3>
                          <div className="flex items-center">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < selectedCV.evaluation.longTermIntent ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">({selectedCV.evaluation.longTermIntent}/5)</span>
                          </div>
                        </div>
                      )}
                      
                      {selectedCV.evaluation.recommendation > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">Türksat'ı arkadaşlarıma tavsiye ederim</h3>
                          <div className="flex items-center">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < selectedCV.evaluation.recommendation ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">({selectedCV.evaluation.recommendation}/5)</span>
                          </div>
                        </div>
                      )}
                      
                      {selectedCV.evaluation.applicationSatisfaction > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">Bu "Yetkinlik-X" uygulamasını beğendim</h3>
                          <div className="flex items-center">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < selectedCV.evaluation.applicationSatisfaction ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">({selectedCV.evaluation.applicationSatisfaction}/5)</span>
                          </div>
                        </div>
                      )}
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
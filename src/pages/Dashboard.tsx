import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileEdit, Clock, CheckCircle2, AlertCircle, Settings, Users } from 'lucide-react';
import { getCVData, getAllCVs } from '../services/cvService';
import { CVData } from '../types/cv';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Dashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [cvData, setCVData] = useState<CVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<{ totalCVs: number; totalUsers: number } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        try {
          const data = await getCVData(currentUser.id);
          setCVData(data);
          
          // Load admin stats if user is admin
          if (isAdmin()) {
            try {
              const allCVs = await getAllCVs();
              setAdminStats({
                totalCVs: allCVs.length,
                totalUsers: new Set(allCVs.map(cv => cv.userId)).size
              });
            } catch (error) {
              console.error('Error loading admin stats:', error);
            }
          }
        } catch (error) {
          console.error('Error loading CV data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [currentUser, isAdmin]);

  // Calculate CV completion percentage
  const calculateCompletion = () => {
    if (!cvData) return 0;
    
    const requiredSections = [
      cvData.personalInfo?.firstName,
      cvData.personalInfo?.lastName,
      cvData.personalInfo?.email,
      cvData.personalInfo?.phone,
      cvData.education && cvData.education.length > 0,
      cvData.experience && cvData.experience.length > 0,
      cvData.skills && cvData.skills.length > 0
    ];
    
    const completedSections = requiredSections.filter(Boolean).length;
    return Math.round((completedSections / requiredSections.length) * 100);
  };

  const handleDownloadCV = async () => {
    if (!cvData || !currentUser) return;

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
      
      // CV içeriğini HTML olarak oluştur
      element.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
          <!-- CV Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
            <h1 style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 10px 0;">
              ${cvData.personalInfo?.firstName} ${cvData.personalInfo?.lastName}
            </h1>
            <p style="color: #6b7280; font-size: 16px;">${cvData.personalInfo?.email}</p>
            ${cvData.personalInfo?.phone ? `<p style="color: #6b7280; font-size: 16px;">${cvData.personalInfo.phone}</p>` : ''}
            ${cvData.personalInfo?.gender ? `<p style="color: #6b7280; font-size: 14px;">Cinsiyet: ${cvData.personalInfo.gender}</p>` : ''}
            ${cvData.personalInfo?.residenceCity || cvData.personalInfo?.residenceDistrict ? `<p style="color: #6b7280; font-size: 14px;">Şehir: ${cvData.personalInfo?.residenceCity || ''}${cvData.personalInfo?.residenceCity && cvData.personalInfo?.residenceDistrict ? ' / ' : ''}${cvData.personalInfo?.residenceDistrict || ''}</p>` : ''}
          </div>

          <!-- Summary -->
          ${cvData.personalInfo?.summary ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              Hakkımda
            </h2>
            <p style="color: #374151; line-height: 1.6;">${cvData.personalInfo.summary}</p>
          </div>
          ` : ''}

          <!-- Education -->
          ${cvData.education && cvData.education.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              Öğrenim
            </h2>
            ${cvData.education.map(edu => `
              <div style="margin-bottom: 20px; padding-left: 20px; border-left: 3px solid #e5e7eb;">
                <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">${edu.degree}</h3>
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">${edu.fieldOfStudy} - ${edu.institution}</p>
                <p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">
                  ${edu.current ? 'Devam ediyor' : edu.endDate ? `Mezun: ${new Date(edu.endDate).getFullYear()}` : 'Mezuniyet tarihi belirtilmemiş'}
                </p>
                ${edu.description ? `<p style="color: #374151; line-height: 1.6;">${edu.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Experience -->
          ${cvData.experience && cvData.experience.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              İş Deneyimi
            </h2>
            ${cvData.experience.map(exp => `
              <div style="margin-bottom: 20px; padding-left: 20px; border-left: 3px solid #e5e7eb;">
                <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">${exp.company} - ${exp.title}</h3>
                ${exp.location ? `<p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Lokasyon: ${exp.location}</p>` : ''}
                <p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">
                  ${new Date(exp.startDate).getFullYear()} - ${exp.current ? 'Günümüz' : exp.endDate ? new Date(exp.endDate).getFullYear() : 'Belirtilmemiş'}
                  ${exp.workDuration ? ` (${exp.workDuration})` : ''}
                </p>
                ${exp.description ? `<p style="color: #374151; line-height: 1.6;">${exp.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Skills -->
          ${cvData.skills && cvData.skills.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              Yetenek ve Yetkinlikler
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${cvData.skills.map(skill => `
                <span style="background-color: #f3f4f6; color: #374151; padding: 8px 12px; border-radius: 6px; font-size: 14px;">
                  ${skill.name}${skill.level ? ` (${skill.level}/5)` : ''}${skill.yearsOfExperience ? ` - ${skill.yearsOfExperience} yıl` : ''}
                </span>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Certificates -->
          ${cvData.certificates && cvData.certificates.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              Sertifikalar
            </h2>
            ${cvData.certificates.map(cert => `
              <div style="margin-bottom: 15px; padding-left: 20px; border-left: 3px solid #e5e7eb;">
                <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">${cert.name}</h3>
                <p style="color: #6b7280; font-size: 14px;">${cert.startDate} - ${cert.endDate}</p>
                ${cert.duration ? `<p style="color: #6b7280; font-size: 14px;">Süre: ${cert.duration} saat</p>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Languages -->
          ${cvData.languages && cvData.languages.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              Yabancı Dil
            </h2>
            ${cvData.languages.map(lang => `
              <div style="margin-bottom: 10px; padding-left: 20px; border-left: 3px solid #e5e7eb;">
                <span style="font-weight: bold; color: #1f2937;">${lang.name}</span>
                ${lang.examType ? ` - ${lang.examType}` : ''}
                ${lang.examScore ? ` (${lang.examScore})` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
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
      const fileName = `${cvData.personalInfo?.firstName}_${cvData.personalInfo?.lastName}_CV.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const completionPercentage = calculateCompletion();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-10 bg-white bg-opacity-95 rounded-lg p-6 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Hoşgeldiniz, {currentUser?.name}!
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          CV'nizi yönetin ve başvuru sürecinizi takip edin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CV Status Card */}
        <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 border-t-4 border-blue-500 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">CV Durumu</h2>
              <p className="text-gray-600 mt-1">
                {isLoading
                  ? 'Yükleniyor...'
                  : cvData
                  ? `CV'niz %${completionPercentage} tamamlandı`
                  : 'Henüz CV oluşturmadınız'}
              </p>
            </div>
            <FileEdit className="h-8 w-8 text-blue-500" />
          </div>
          
          {!isLoading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    completionPercentage < 30 ? 'bg-red-500' : 
                    completionPercentage < 70 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`} 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              
              <div className="mt-4">
                <Link
                  to="/cv-form"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  {cvData ? 'CV\'nizi güncelleyin' : 'CV oluşturun'} →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 border-t-4 border-purple-500 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold text-gray-800">Son Aktiviteler</h2>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
          
          {isLoading ? (
            <p className="text-gray-600 mt-4">Aktiviteler yükleniyor...</p>
          ) : (
            <>
              {cvData ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-800">CV son güncelleme</p>
                      <p className="text-xs text-gray-500">
                        {new Date(cvData.updatedAt || Date.now()).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-start">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-800">Henüz CV oluşturulmadı</p>
                    <p className="text-xs text-gray-500">Aktiviteleri takip etmek için CV oluşturun</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 border-t-4 border-teal-500 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Hızlı İşlemler</h2>
          
          <div className="space-y-3">
            <Link 
              to="/cv-form" 
              className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <div className="flex items-center">
                <FileEdit className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-700">
                  {cvData ? 'CV\'nizi düzenleyin' : 'CV oluşturun'}
                </span>
              </div>
            </Link>
            
            {cvData && (
              <button 
                className="block w-full p-3 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                onClick={handleDownloadCV}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="text-green-700">PDF olarak indir</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Admin Panel Card - Only show for admins */}
        {isAdmin() && (
          <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 border-t-4 border-red-500 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Yönetici Paneli</h2>
                <p className="text-gray-600 mt-1">
                  Tüm CV'leri görüntüleyin ve yönetin
                </p>
              </div>
              <Settings className="h-8 w-8 text-red-500" />
            </div>
            
            {adminStats && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{adminStats.totalCVs}</div>
                  <div className="text-sm text-gray-600">Toplam CV</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{adminStats.totalUsers}</div>
                  <div className="text-sm text-gray-600">Kullanıcı</div>
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <Link
                to="/admin"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Users className="h-4 w-4 mr-2" />
                Yönetici Paneline Git
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
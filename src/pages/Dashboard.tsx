import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileEdit, Clock, CheckCircle2, AlertCircle, Settings, Users, Key, Eye, EyeOff } from 'lucide-react';
import { getCVData } from '../services/cvService';
import { CVData } from '../types/cv';
import { authAPI } from '../services/apiService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Dashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [cvData, setCVData] = useState<CVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Şifre değiştirme state'leri
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        try {
          const data = await getCVData(currentUser.id);
          setCVData(data);
        } catch (error) {
          console.error('Error loading CV data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [currentUser]);

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
      element.style.padding = '30px';
      element.style.width = '210mm';
      element.style.minHeight = '297mm';
      element.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      element.style.backgroundColor = '#ffffff';
      
      // BASIT TEMİZ CV TASARIM
      element.innerHTML = `
        <div style="max-width: 100%; margin: 0; color: #333; line-height: 1.6;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #2563eb;">
            ${cvData.personalInfo?.profileImage ? `
              <img src="${cvData.personalInfo.profileImage}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 20px; border: 3px solid #2563eb;" />
            ` : ''}
            <h1 style="font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 15px 0;">
              ${cvData.personalInfo?.firstName} ${cvData.personalInfo?.lastName}
            </h1>
            <div style="font-size: 16px; color: #64748b; margin-bottom: 15px;">
              ${cvData.personalInfo?.email || ''}
              ${cvData.personalInfo?.phone ? ` | ${cvData.personalInfo.phone}` : ''}
            </div>
            ${cvData.personalInfo?.turksatEmployeeNumber ? `
              <div style="color: #2563eb; font-weight: 500; font-size: 14px;">
                Türksat Sicil No: ${cvData.personalInfo.turksatEmployeeNumber}
              </div>
            ` : ''}
          </div>

          <!-- Özet -->
          ${cvData.personalInfo?.summary ? `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
              HAKKIMDA
            </h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.7;">${cvData.personalInfo.summary}</p>
          </div>
          ` : ''}

          <!-- İş Deneyimi -->
          ${cvData.experience && cvData.experience.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
              İŞ DENEYİMİ
            </h2>
            ${cvData.experience.map(exp => `
              <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h3 style="font-weight: 600; color: #1e293b; margin: 0 0 8px 0; font-size: 16px;">${exp.company}</h3>
                <div style="color: #2563eb; font-weight: 500; margin-bottom: 5px;">${exp.title}</div>
                ${exp.department ? `<div style="color: #64748b; font-size: 13px; margin-bottom: 5px;">Departman: ${exp.department}</div>` : ''}
                <div style="color: #64748b; font-size: 13px; margin-bottom: 10px;">
                  ${new Date(exp.startDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })} - 
                  ${exp.current ? 'Günümüz' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : 'Belirtilmemiş'}
                </div>
                ${exp.tasks ? `<div style="margin-bottom: 8px;"><strong style="color: #1e293b;">Görevler:</strong> ${exp.tasks}</div>` : ''}
                ${exp.description ? `<div style="color: #475569; font-size: 14px;">${exp.description}</div>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Eğitim -->
          ${cvData.education && cvData.education.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
              EĞİTİM
            </h2>
            ${cvData.education.map(edu => `
              <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h3 style="font-weight: 600; color: #1e293b; margin: 0 0 5px 0;">${edu.degree}</h3>
                <div style="color: #2563eb; margin-bottom: 5px;">${edu.fieldOfStudy} - ${edu.institution}</div>
                <div style="color: #64748b; font-size: 13px;">
                  ${edu.current ? 'Devam ediyor' : edu.endDate ? `Mezun: ${new Date(edu.endDate).toLocaleDateString('tr-TR', { year: 'numeric' })}` : 'Mezuniyet tarihi belirtilmemiş'}
                </div>
                ${edu.description ? `<div style="color: #475569; font-size: 14px; margin-top: 8px;">${edu.description}</div>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Beceriler -->
          ${cvData.skills && cvData.skills.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
              BECERILER
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${cvData.skills.map(skill => `
                <span style="background: #2563eb; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                  ${skill.name}${skill.level ? ` (${skill.level}/5)` : ''}
                </span>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Sertifikalar -->
          ${cvData.certificates && cvData.certificates.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
              SERTİFİKALAR
            </h2>
            ${cvData.certificates.map(cert => `
              <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                <div style="font-weight: 600; color: #1e293b;">${cert.name}</div>
                <div style="color: #64748b; font-size: 13px;">${cert.startDate} - ${cert.endDate}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Diller -->
          ${cvData.languages && cvData.languages.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
              YABANCI DİL
            </h2>
            ${cvData.languages.map(lang => `
              <div style="margin-bottom: 8px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
                <span style="font-weight: 600; color: #1e293b;">${lang.name}</span>
                ${lang.examType ? ` - ${lang.examType}` : ''}
                ${lang.examScore ? ` (${lang.examScore})` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Footer -->
          <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Bu CV Yetkinlik-X sistemi ile oluşturulmuştur | ${new Date().toLocaleDateString('tr-TR')}
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

      // PDF'i indir
      const fileName = `${cvData.personalInfo?.firstName}_${cvData.personalInfo?.lastName}_CV.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Şifre değiştirme fonksiyonları
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Yeni şifre ve tekrarı eşleşmiyor!');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Yeni şifre en az 6 karakter olmalıdır!');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await authAPI.changePassword(passwordForm);
      if (response.success) {
        alert('Şifre başarıyla değiştirildi!');
        setShowPasswordForm(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      alert(error.message || 'Şifre değiştirme işlemi başarısız!');
    } finally {
      setPasswordLoading(false);
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

        {/* Password Change Card */}
        <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 border-t-4 border-orange-500 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Şifre Değiştir</h2>
              <p className="text-gray-600 mt-1">
                Hesap güvenliğiniz için şifrenizi güncelleyin
              </p>
            </div>
            <Key className="h-8 w-8 text-orange-500" />
          </div>
          
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Şifremi Değiştir
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Mevcut Şifre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mevcut Şifre
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Yeni Şifre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yeni Şifre
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Şifre Tekrar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yeni Şifre Tekrar
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {passwordLoading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Admin Panel Card - Only show for admins */}
        {isAdmin() && (
          <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 border-t-4 border-red-500 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Yönetici Paneli</h2>
                <p className="text-gray-600 mt-1">
                  Tüm CV'leri görüntüleyin ve yönetin
                </p>
              </div>
              <Settings className="h-8 w-8 text-red-500" />
            </div>
            
            <div className="flex gap-3">
              <Link
                to="/admin"
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
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
    if (!cvData) {
      alert('CV bulunamadı. Lütfen önce CV oluşturun.');
      return;
    }

    try {
      // CV önizleme elementini oluştur
      const element = document.createElement('div');
      element.id = 'cv-preview-temp';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      
      element.style.padding = '40px';
      element.style.width = '210mm';
      element.style.minHeight = '297mm';
      element.style.fontFamily = 'Arial, sans-serif';
      
      // CV içeriğini oluştur
      element.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
          <!-- CV Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
            ${cvData.personalInfo?.profileImage ? 
              `<img src="${cvData.personalInfo.profileImage}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;" />` 
              : ''
            }
            <h1 style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 10px 0;">
              ${cvData.personalInfo?.firstName} ${cvData.personalInfo?.lastName}
            </h1>
            <p style="color: #6b7280; font-size: 16px;">${cvData.personalInfo?.email}</p>
            ${cvData.personalInfo?.phone ? `<p style="color: #6b7280; font-size: 16px;">${cvData.personalInfo.phone}</p>` : ''}
            ${cvData.personalInfo?.linkedIn || cvData.personalInfo?.github || cvData.personalInfo?.twitter || cvData.personalInfo?.website || cvData.personalInfo?.instagram || cvData.personalInfo?.facebook || cvData.personalInfo?.youtube || cvData.personalInfo?.tiktok || cvData.personalInfo?.discord || cvData.personalInfo?.telegram || cvData.personalInfo?.whatsapp || cvData.personalInfo?.medium || cvData.personalInfo?.behance || cvData.personalInfo?.dribbble || cvData.personalInfo?.stackoverflow ? `
              <div style="margin-top: 10px;">
                ${cvData.personalInfo?.linkedIn ? `<p style="color: #6b7280; font-size: 14px;">LinkedIn: ${cvData.personalInfo.linkedIn}</p>` : ''}
                ${cvData.personalInfo?.github ? `<p style="color: #6b7280; font-size: 14px;">GitHub: ${cvData.personalInfo.github}</p>` : ''}
                ${cvData.personalInfo?.twitter ? `<p style="color: #6b7280; font-size: 14px;">Twitter: ${cvData.personalInfo.twitter}</p>` : ''}
                ${cvData.personalInfo?.instagram ? `<p style="color: #6b7280; font-size: 14px;">Instagram: ${cvData.personalInfo.instagram}</p>` : ''}
                ${cvData.personalInfo?.facebook ? `<p style="color: #6b7280; font-size: 14px;">Facebook: ${cvData.personalInfo.facebook}</p>` : ''}
                ${cvData.personalInfo?.youtube ? `<p style="color: #6b7280; font-size: 14px;">YouTube: ${cvData.personalInfo.youtube}</p>` : ''}
                ${cvData.personalInfo?.tiktok ? `<p style="color: #6b7280; font-size: 14px;">TikTok: ${cvData.personalInfo.tiktok}</p>` : ''}
                ${cvData.personalInfo?.discord ? `<p style="color: #6b7280; font-size: 14px;">Discord: ${cvData.personalInfo.discord}</p>` : ''}
                ${cvData.personalInfo?.telegram ? `<p style="color: #6b7280; font-size: 14px;">Telegram: ${cvData.personalInfo.telegram}</p>` : ''}
                ${cvData.personalInfo?.whatsapp ? `<p style="color: #6b7280; font-size: 14px;">WhatsApp: ${cvData.personalInfo.whatsapp}</p>` : ''}
                ${cvData.personalInfo?.medium ? `<p style="color: #6b7280; font-size: 14px;">Medium: ${cvData.personalInfo.medium}</p>` : ''}
                ${cvData.personalInfo?.behance ? `<p style="color: #6b7280; font-size: 14px;">Behance: ${cvData.personalInfo.behance}</p>` : ''}
                ${cvData.personalInfo?.dribbble ? `<p style="color: #6b7280; font-size: 14px;">Dribbble: ${cvData.personalInfo.dribbble}</p>` : ''}
                ${cvData.personalInfo?.stackoverflow ? `<p style="color: #6b7280; font-size: 14px;">Stack Overflow: ${cvData.personalInfo.stackoverflow}</p>` : ''}
                ${cvData.personalInfo?.website ? `<p style="color: #6b7280; font-size: 14px;">Website: ${cvData.personalInfo.website}</p>` : ''}
              </div>
            ` : ''}
            ${cvData.personalInfo?.summary ? `<p style="margin-top: 15px; color: #374151; line-height: 1.6;">${cvData.personalInfo.summary}</p>` : ''}
            ${cvData.personalInfo?.sgkServiceDocument ? `<p style="margin-top: 10px; color: #059669; font-size: 14px; font-weight: 500;">✓ SGK Hizmet Dökümü: Yüklendi</p>` : ''}
          </div>
          
          <!-- Skills -->
          ${cvData.skills && cvData.skills.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              Yetenek ve Yetkinlikler
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${cvData.skills.map(skill => `
                <span style="background: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 6px; font-size: 14px;">
                  ${skill.name}${skill.level ? ` (${skill.level}/5)` : ''}${skill.yearsOfExperience ? ` - ${skill.yearsOfExperience} yıl` : ''}
                </span>
              `).join('')}
            </div>
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
                ${exp.location ? `<p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">${exp.location}</p>` : ''}
                <p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">
                  ${new Date(exp.startDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })} - 
                  ${exp.current ? 'Günümüz' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : 'Belirtilmemiş'}
                  ${exp.workDuration ? ` (${exp.workDuration})` : ''}
                </p>
                ${exp.description ? `<p style="color: #374151; line-height: 1.6;">${exp.description}</p>` : ''}
              </div>
            `).join('')}
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
                  ${edu.current ? 'Devam ediyor' : edu.endDate ? `Mezun: ${new Date(edu.endDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })}` : 'Mezuniyet tarihi belirtilmemiş'}
                </p>
                ${edu.description ? `<p style="color: #374151; line-height: 1.6;">${edu.description}</p>` : ''}
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
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${cvData.languages.map(lang => `
                <span style="background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 6px; font-size: 14px;">
                  ${lang.name}${lang.examType ? ` - ${lang.examType}` : ''}${lang.examScore ? ` (${lang.examScore})` : ''}${lang.certificateDate ? ` - ${lang.certificateDate}` : ''}
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
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
              ${cvData.certificates.map(cert => `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                  <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">${cert.name}</h3>
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 3px;">Başlangıç: ${cert.startDate}</p>
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 3px;">Bitiş: ${cert.endDate}</p>
                  ${cert.duration ? `<p style="color: #9ca3af; font-size: 12px;">Süre: ${cert.duration} saat</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <!-- Awards -->
          ${cvData.awards && cvData.awards.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              Ödüller ve Başarılar
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
              ${cvData.awards.map(award => `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                  <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">${award.title}</h3>
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 3px;">${award.organization}</p>
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 3px;">Tarih: ${award.date}</p>
                  ${award.description ? `<p style="color: #9ca3af; font-size: 12px;">${award.description}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <!-- Publications -->
          ${cvData.publications && cvData.publications.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              Yayınlar ve Makaleler
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
              ${cvData.publications.map(pub => `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                  <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">${pub.title}</h3>
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 3px;">Yayınlayıcı: ${pub.publisher}</p>
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 3px;">Tarih: ${pub.publishDate}</p>
                  ${pub.description ? `<p style="color: #9ca3af; font-size: 12px;">${pub.description}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <!-- Hobbies -->
          ${cvData.hobbies && cvData.hobbies.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              Hobiler
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${cvData.hobbies.map(hobby => `
                <span style="background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 6px; font-size: 14px;">
                  ${hobby}
                </span>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <!-- References -->
          ${cvData.references && cvData.references.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              Referanslar
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
              ${cvData.references.map(ref => `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                  <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">${ref.name}</h3>
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 3px;">${ref.company}</p>
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 3px;">${ref.phone}</p>
                  ${ref.type ? `<p style="color: #9ca3af; font-size: 12px;">${ref.type}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <!-- Evaluation -->
          ${cvData.evaluation && (cvData.evaluation.workSatisfaction > 0 || cvData.evaluation.facilitiesSatisfaction > 0 || cvData.evaluation.longTermIntent > 0 || cvData.evaluation.recommendation > 0 || cvData.evaluation.applicationSatisfaction > 0) ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              Değerlendirmeler
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
              ${cvData.evaluation.workSatisfaction > 0 ? `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                  <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">Türksat'ta çalışmaktan memnunum</h3>
                  <p style="color: #6b7280; font-size: 14px;">${'★'.repeat(cvData.evaluation.workSatisfaction)}${'☆'.repeat(5 - cvData.evaluation.workSatisfaction)} (${cvData.evaluation.workSatisfaction}/5)</p>
                </div>
              ` : ''}
              ${cvData.evaluation.facilitiesSatisfaction > 0 ? `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                  <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">Türksat'ın sağladığı imkânlardan memnunum</h3>
                  <p style="color: #6b7280; font-size: 14px;">${'★'.repeat(cvData.evaluation.facilitiesSatisfaction)}${'☆'.repeat(5 - cvData.evaluation.facilitiesSatisfaction)} (${cvData.evaluation.facilitiesSatisfaction}/5)</p>
                </div>
              ` : ''}
              ${cvData.evaluation.longTermIntent > 0 ? `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                  <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">Türksat'ta uzun süre çalışmak isterim</h3>
                  <p style="color: #6b7280; font-size: 14px;">${'★'.repeat(cvData.evaluation.longTermIntent)}${'☆'.repeat(5 - cvData.evaluation.longTermIntent)} (${cvData.evaluation.longTermIntent}/5)</p>
                </div>
              ` : ''}
              ${cvData.evaluation.recommendation > 0 ? `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                  <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">Türksat'ı arkadaşlarıma tavsiye ederim</h3>
                  <p style="color: #6b7280; font-size: 14px;">${'★'.repeat(cvData.evaluation.recommendation)}${'☆'.repeat(5 - cvData.evaluation.recommendation)} (${cvData.evaluation.recommendation}/5)</p>
                </div>
              ` : ''}
              ${cvData.evaluation.applicationSatisfaction > 0 ? `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                  <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">Bu "Yetkinlik-X" uygulamasını beğendim</h3>
                  <p style="color: #6b7280; font-size: 14px;">${'★'.repeat(cvData.evaluation.applicationSatisfaction)}${'☆'.repeat(5 - cvData.evaluation.applicationSatisfaction)} (${cvData.evaluation.applicationSatisfaction}/5)</p>
                </div>
              ` : ''}
            </div>
          </div>
          ` : ''}
        </div>
      `;
      
      document.body.appendChild(element);
      
      // HTML'i canvas'a çevir
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      // Geçici elementi kaldır
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
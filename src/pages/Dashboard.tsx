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
        <div style="max-width: 800px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2d3748;">
          <!-- Header Section with Modern Design -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; border-radius: 0; margin: -40px -40px 30px -40px; position: relative;">
            <div style="display: flex; align-items: center; gap: 30px;">
              <div style="flex-shrink: 0;">
                ${cvData.personalInfo?.profileImage ? 
                  `<div style="width: 150px; height: 150px; border-radius: 50%; border: 6px solid rgba(255,255,255,0.3); padding: 4px; background: white;">
                    <img src="${cvData.personalInfo.profileImage}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />
                  </div>` 
                  : `<div style="width: 150px; height: 150px; border-radius: 50%; border: 6px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: bold;">
                    ${cvData.personalInfo?.firstName?.charAt(0) || ''}${cvData.personalInfo?.lastName?.charAt(0) || ''}
                  </div>`
                }
              </div>
              <div style="flex: 1;">
                <h1 style="font-size: 42px; font-weight: 300; margin: 0 0 10px 0; letter-spacing: -1px;">
                  ${cvData.personalInfo?.firstName} <span style="font-weight: 700;">${cvData.personalInfo?.lastName}</span>
                </h1>
                <div style="font-size: 18px; opacity: 0.9; margin-bottom: 20px;">
                  ${cvData.personalInfo?.email}
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 20px; font-size: 14px;">
                  ${cvData.personalInfo?.phone ? `<div style="display: flex; align-items: center; gap: 8px;"><span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px;">📞</span> ${cvData.personalInfo.phone}</div>` : ''}
                  ${cvData.personalInfo?.residenceCity ? `<div style="display: flex; align-items: center; gap: 8px;"><span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px;">📍</span> ${cvData.personalInfo.residenceCity}${cvData.personalInfo?.residenceDistrict ? ' / ' + cvData.personalInfo.residenceDistrict : ''}</div>` : ''}
                  ${cvData.personalInfo?.gender ? `<div style="display: flex; align-items: center; gap: 8px;"><span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px;">👤</span> ${cvData.personalInfo.gender}</div>` : ''}
                </div>
              </div>
            </div>
            ${cvData.personalInfo?.summary ? `
              <div style="margin-top: 25px; padding: 20px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px);">
                <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 10px 0; opacity: 0.9;">HAKKIMDA</h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; opacity: 0.95;">${cvData.personalInfo.summary}</p>
              </div>
            ` : ''}
            
            <!-- Social Media Links -->
            ${(cvData.personalInfo?.linkedIn || cvData.personalInfo?.github || cvData.personalInfo?.website) ? `
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
                <div style="display: flex; flex-wrap: wrap; gap: 15px; font-size: 13px;">
                  ${cvData.personalInfo?.linkedIn ? `<div style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px;">💼 LinkedIn: ${cvData.personalInfo.linkedIn}</div>` : ''}
                  ${cvData.personalInfo?.github ? `<div style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px;">💻 GitHub: ${cvData.personalInfo.github}</div>` : ''}
                  ${cvData.personalInfo?.website ? `<div style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px;">🌐 Website: ${cvData.personalInfo.website}</div>` : ''}
                </div>
              </div>
            ` : ''}
          </div>
          
          <!-- Education -->
          ${cvData.education && cvData.education.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <div style="display: flex; align-items: center; margin-bottom: 20px; padding: 15px 0; border-bottom: 3px solid #667eea;">
              <span style="font-size: 24px; margin-right: 12px;">🎓</span>
              <h2 style="font-size: 24px; font-weight: 700; color: #2d3748; margin: 0; letter-spacing: -0.5px;">ÖĞRENİM</h2>
            </div>
            ${cvData.education.map(edu => `
              <div style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; border-left: 6px solid #667eea; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="font-weight: 700; color: #2d3748; margin-bottom: 8px; font-size: 18px;">${edu.degree}</h3>
                <p style="color: #4a5568; font-size: 15px; margin-bottom: 8px; font-weight: 600;">${edu.fieldOfStudy} - ${edu.institution}</p>
                <p style="color: #718096; font-size: 14px; margin-bottom: 12px; background: rgba(102, 126, 234, 0.1); padding: 6px 12px; border-radius: 6px; display: inline-block;">
                  ${edu.current ? '📚 Devam ediyor' : edu.endDate ? `🎯 Mezun: ${new Date(edu.endDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })}` : '📅 Mezuniyet tarihi belirtilmemiş'}
                </p>
                ${edu.description ? `<p style="color: #4a5568; line-height: 1.7; margin: 12px 0 0 0; font-style: italic;">${edu.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <!-- Experience -->
          ${cvData.experience && cvData.experience.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <div style="display: flex; align-items: center; margin-bottom: 20px; padding: 15px 0; border-bottom: 3px solid #764ba2;">
              <span style="font-size: 24px; margin-right: 12px;">💼</span>
              <h2 style="font-size: 24px; font-weight: 700; color: #2d3748; margin: 0; letter-spacing: -0.5px;">İŞ DENEYİMİ</h2>
            </div>
            ${cvData.experience.map(exp => `
              <div style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%); border-radius: 12px; border-left: 6px solid #764ba2; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="font-weight: 700; color: #2d3748; margin-bottom: 8px; font-size: 18px;">${exp.company} - ${exp.title}</h3>
                ${exp.location ? `<p style="color: #4a5568; font-size: 15px; margin-bottom: 8px; font-weight: 600;">📍 ${exp.location}</p>` : ''}
                <p style="color: #718096; font-size: 14px; margin-bottom: 12px; background: rgba(118, 75, 162, 0.1); padding: 6px 12px; border-radius: 6px; display: inline-block;">
                  📅 ${new Date(exp.startDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })} - 
                  ${exp.current ? '🚀 Günümüz' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : 'Belirtilmemiş'}
                  ${exp.workDuration ? ` (⏱️ ${exp.workDuration})` : ''}
                </p>
                ${exp.description ? `<p style="color: #4a5568; line-height: 1.7; margin: 12px 0 0 0; font-style: italic;">${exp.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <!-- Skills -->
          ${cvData.skills && cvData.skills.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <div style="display: flex; align-items: center; margin-bottom: 20px; padding: 15px 0; border-bottom: 3px solid #10b981;">
              <span style="font-size: 24px; margin-right: 12px;">⚡</span>
              <h2 style="font-size: 24px; font-weight: 700; color: #2d3748; margin: 0; letter-spacing: -0.5px;">YETENEK VE YETKİNLİKLER</h2>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              ${cvData.skills.map(skill => `
                <span style="background: linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%); color: #065f46; padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 600; border: 2px solid #10b981; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
                  💡 ${skill.name}${skill.level ? ` (⭐ ${skill.level}/5)` : ''}${skill.yearsOfExperience ? ` - 🗓️ ${skill.yearsOfExperience} yıl` : ''}
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
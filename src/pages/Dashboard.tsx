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
      
      // CV içeriğini HTML olarak oluştur - ESTETİK VERSİYON
      element.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2d3748; line-height: 1.6;">
          <!-- CV Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; margin: -40px -40px 30px -40px; text-align: center; position: relative;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);"></div>
            <div style="position: relative; z-index: 1;">
              <h1 style="font-size: 36px; font-weight: 700; margin: 0 0 10px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                ${cvData.personalInfo?.firstName} ${cvData.personalInfo?.lastName}
              </h1>
              <div style="height: 3px; width: 60px; background: #fff; margin: 15px auto 20px auto; border-radius: 2px;"></div>
              <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; font-size: 16px;">
                ${cvData.personalInfo?.email ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; background: #fff; border-radius: 50%; display: inline-block;"></span>
                    ${cvData.personalInfo.email}
                  </div>
                ` : ''}
                ${cvData.personalInfo?.phone ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; background: #fff; border-radius: 50%; display: inline-block;"></span>
                    ${cvData.personalInfo.phone}
                  </div>
                ` : ''}
                ${cvData.personalInfo?.turksatEmployeeNumber ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; background: #fff; border-radius: 50%; display: inline-block;"></span>
                    Türksat Sicil No: ${cvData.personalInfo.turksatEmployeeNumber}
                  </div>
                ` : ''}
                ${cvData.personalInfo?.residenceCity || cvData.personalInfo?.residenceDistrict ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; background: #fff; border-radius: 50%; display: inline-block;"></span>
                    ${cvData.personalInfo?.residenceCity || ''}${cvData.personalInfo?.residenceCity && cvData.personalInfo?.residenceDistrict ? ' / ' : ''}${cvData.personalInfo?.residenceDistrict || ''}
                  </div>
                ` : ''}
              </div>
              ${cvData.personalInfo?.gender ? `
                <div style="margin-top: 15px; font-size: 14px; opacity: 0.9;">
                  Cinsiyet: ${cvData.personalInfo.gender}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Summary -->
          ${cvData.personalInfo?.summary ? `
          <div style="margin-bottom: 35px; background: #f8fafc; padding: 25px; border-radius: 12px; border-left: 5px solid #667eea;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
              <span style="width: 8px; height: 8px; background: #667eea; border-radius: 50%; display: inline-block;"></span>
              Hakkımda
            </h2>
            <p style="color: #4a5568; line-height: 1.7; margin: 0; font-size: 15px;">${cvData.personalInfo.summary}</p>
          </div>
          ` : ''}

          <!-- Education -->
          ${cvData.education && cvData.education.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🎓</span>
              Öğrenim
            </h2>
            ${cvData.education.map((edu, index) => `
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
          ${cvData.experience && cvData.experience.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">💼</span>
              İş Deneyimi
            </h2>
            ${cvData.experience.map((exp, index) => `
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
          ${cvData.skills && cvData.skills.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">⚡</span>
              Yetenek ve Yetkinlikler
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              ${cvData.skills.map(skill => `
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 10px 16px; border-radius: 25px; font-size: 14px; font-weight: 500; box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3); display: flex; align-items: center; gap: 8px;">
                  <span style="width: 6px; height: 6px; background: white; border-radius: 50%; display: inline-block;"></span>
                  ${skill.name}${skill.level ? ` (${skill.level}/5)` : ''}${skill.yearsOfExperience ? ` - ${skill.yearsOfExperience} yıl` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Certificates -->
          ${cvData.certificates && cvData.certificates.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🏆</span>
              Sertifikalar
            </h2>
            ${cvData.certificates.map(cert => `
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
          ${cvData.languages && cvData.languages.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🌍</span>
              Yabancı Dil
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 15px;">
              ${cvData.languages.map(lang => `
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
        if (cvData.personalInfo && i === 1) {
          pdf.text(`${cvData.personalInfo.firstName || ''} ${cvData.personalInfo.lastName || ''}`, 10, yPosition);
          yPosition += lineHeight;
          
          if (cvData.personalInfo.email) {
            pdf.text(cvData.personalInfo.email, 10, yPosition);
          yPosition += lineHeight;
          }
          
          if (cvData.personalInfo.phone) {
            pdf.text(cvData.personalInfo.phone, 10, yPosition);
              yPosition += lineHeight;
          }
          
          if (cvData.personalInfo.residenceCity || cvData.personalInfo.residenceDistrict) {
            pdf.text(`${cvData.personalInfo.residenceCity || ''} ${cvData.personalInfo.residenceDistrict || ''}`, 10, yPosition);
            yPosition += lineHeight;
          }
          
          if (cvData.personalInfo.summary) {
            const summaryLines = pdf.splitTextToSize(cvData.personalInfo.summary, 180);
            summaryLines.forEach((line: string) => {
              pdf.text(line, 10, yPosition);
              yPosition += lineHeight;
            });
          }
        }
        
        // Eğitim bilgileri
        if (cvData.education && cvData.education.length > 0) {
          pdf.text('Öğrenim Eğitim', 10, yPosition);
          yPosition += lineHeight;
          
          cvData.education.forEach(edu => {
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
        if (cvData.experience && cvData.experience.length > 0) {
          pdf.text('İş Deneyimi Çalışma Tecrübe', 10, yPosition);
          yPosition += lineHeight;
          
          cvData.experience.forEach(exp => {
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
        if (cvData.skills && cvData.skills.length > 0) {
          pdf.text('Yetenek Yetkinlik Beceri Skill', 10, yPosition);
          yPosition += lineHeight;
          
          cvData.skills.forEach(skill => {
            pdf.text(`${skill.name} ${skill.level || ''} ${skill.yearsOfExperience || ''}`, 10, yPosition);
              yPosition += lineHeight;
            });
          }
        
        // Sertifikalar
        if (cvData.certificates && cvData.certificates.length > 0) {
          pdf.text('Sertifika Certificate Belge', 10, yPosition);
          yPosition += lineHeight;
          
          cvData.certificates.forEach(cert => {
            pdf.text(`${cert.name} ${cert.startDate} ${cert.endDate} ${cert.duration || ''}`, 10, yPosition);
          yPosition += lineHeight;
        });
        }
        
        // Diller
        if (cvData.languages && cvData.languages.length > 0) {
          pdf.text('Yabancı Dil Language İngilizce', 10, yPosition);
          yPosition += lineHeight;
          
          cvData.languages.forEach(lang => {
            pdf.text(`${lang.name} ${lang.examType || ''} ${lang.examScore || ''}`, 10, yPosition);
          yPosition += lineHeight;
          });
        }
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
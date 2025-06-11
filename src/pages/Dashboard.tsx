import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileEdit, Clock, CheckCircle2, AlertCircle, Settings, Users } from 'lucide-react';
import { getCVData, getAllCVs } from '../services/cvService';
import { CVData } from '../types/cv';
import jsPDF from 'jspdf';

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
      // Text-based PDF oluştur
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Arial font kullan - Türkçe karakter desteği var
      pdf.setFont('arial', 'normal');
      
      let yPosition = 20;
      const pageWidth = 210;
      const margin = 20;
      const lineHeight = 7;
      const sectionSpacing = 18;
      const primaryColor = [41, 98, 180]; // Mavi
      const textColor = [44, 62, 80]; // Koyu gri

      // Helper functions
      const checkNewPage = (currentY: number, additionalHeight = 20) => {
        if (currentY + additionalHeight > 280) {
          pdf.addPage();
          return 20;
        }
        return currentY;
      };

      const addSection = (title: string, yPos: number, icon: string = '●') => {
        // Bölüm başlığı arka planı
        pdf.setFillColor(245, 248, 255); // Açık mavi arka plan
        pdf.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 12, 'F');
        
        // Bölüm başlığı
        pdf.setFontSize(14);
        pdf.setFont('arial', 'bold');
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text(`${icon} ${title}`, margin, yPos + 2);
        
        // Alt çizgi
        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.setLineWidth(0.8);
        pdf.line(margin, yPos + 5, pageWidth - margin, yPos + 5);
        
        return yPos + 15;
      };

      const wrapText = (text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = pdf.getTextWidth(testLine);
          
          if (textWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        return lines;
      };

      // Header arka plan
      pdf.setFillColor(245, 248, 255);
      pdf.rect(0, 0, pageWidth, 55, 'F');
      
      // İsim
      pdf.setFontSize(22);
      pdf.setFont('arial', 'bold');
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      const fullName = `${cvData.personalInfo?.firstName || ''} ${cvData.personalInfo?.lastName || ''}`;
      pdf.text(fullName, margin, yPosition + 5);
      yPosition += 15;

      // Profesyonel unvan varsa ekle
      if (cvData.personalInfo?.summary) {
        pdf.setFontSize(12);
        pdf.setFont('arial', 'italic');
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        const summaryFirstLine = cvData.personalInfo.summary.split('.')[0] + '.';
        if (summaryFirstLine.length < 80) {
          pdf.text(summaryFirstLine, margin, yPosition);
          yPosition += 8;
        }
      }

      // İletişim Bilgileri
      pdf.setFontSize(10);
      pdf.setFont('arial', 'normal');
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      if (cvData.personalInfo?.email) {
        pdf.text(`E-posta: ${cvData.personalInfo.email}`, margin, yPosition);
        yPosition += lineHeight;
      }
      if (cvData.personalInfo?.phone) {
        pdf.text(`Telefon: ${cvData.personalInfo.phone}`, margin, yPosition);
        yPosition += lineHeight;
      }
      if (cvData.personalInfo?.residenceCity) {
        pdf.text(`Şehir: ${cvData.personalInfo.residenceCity}${cvData.personalInfo?.residenceDistrict ? ' / ' + cvData.personalInfo.residenceDistrict : ''}`, margin, yPosition);
        yPosition += lineHeight;
      }
      if (cvData.personalInfo?.gender) {
        pdf.text(`Cinsiyet: ${cvData.personalInfo.gender}`, margin, yPosition);
        yPosition += lineHeight;
      }
      
      yPosition += sectionSpacing;

      // Hakkımda
      if (cvData.personalInfo?.summary) {
        yPosition = checkNewPage(yPosition);
        yPosition = addSection('HAKKIMDA', yPosition, '👤');
        
        pdf.setFontSize(11);
        pdf.setFont('arial', 'normal');
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        const summaryLines = wrapText(cvData.personalInfo.summary, pageWidth - 2 * margin);
        summaryLines.forEach(line => {
          yPosition = checkNewPage(yPosition);
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
        yPosition += sectionSpacing;
      }

      // Eğitim
      if (cvData.education && cvData.education.length > 0) {
        yPosition = checkNewPage(yPosition);
        yPosition = addSection('ÖĞRENİM', yPosition, '🎓');
        
        cvData.education.forEach(edu => {
          yPosition = checkNewPage(yPosition, 25);
          
          pdf.setFontSize(12);
          pdf.setFont('arial', 'bold');
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
          pdf.text(edu.degree, margin, yPosition);
          yPosition += lineHeight + 1;
          
          pdf.setFontSize(11);
          pdf.setFont('arial', 'normal');
          pdf.text(`${edu.fieldOfStudy} - ${edu.institution}`, margin, yPosition);
          yPosition += lineHeight;
          
          const endDateText = edu.current ? 'Devam ediyor' : 
            edu.endDate ? `Mezun: ${new Date(edu.endDate).toLocaleDateString('tr-TR')}` : 
            'Mezuniyet tarihi belirtilmemiş';
          pdf.text(endDateText, margin, yPosition);
          yPosition += lineHeight;
          
          if (edu.description) {
            const descLines = wrapText(edu.description, pageWidth - 2 * margin);
            descLines.forEach(line => {
              yPosition = checkNewPage(yPosition);
              pdf.text(line, margin, yPosition);
              yPosition += lineHeight;
            });
          }
          yPosition += 8;
        });
        yPosition += sectionSpacing;
      }

      // İş Deneyimi
      if (cvData.experience && cvData.experience.length > 0) {
        yPosition = checkNewPage(yPosition);
        yPosition = addSection('İŞ DENEYİMİ', yPosition, '💼');
        
        cvData.experience.forEach(exp => {
          yPosition = checkNewPage(yPosition, 25);
          
          pdf.setFontSize(12);
          pdf.setFont('arial', 'bold');
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
          pdf.text(`${exp.company} - ${exp.title}`, margin, yPosition);
          yPosition += lineHeight + 1;
          
          pdf.setFontSize(11);
          pdf.setFont('arial', 'normal');
          
          if (exp.location) {
            pdf.text(`Lokasyon: ${exp.location}`, margin, yPosition);
            yPosition += lineHeight;
          }
          
          const dateText = `${new Date(exp.startDate).toLocaleDateString('tr-TR')} - ${
            exp.current ? 'Günümüz' : 
            exp.endDate ? new Date(exp.endDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'
          }${exp.workDuration ? ` (${exp.workDuration})` : ''}`;
          pdf.text(dateText, margin, yPosition);
          yPosition += lineHeight;
          
          if (exp.description) {
            const descLines = wrapText(exp.description, pageWidth - 2 * margin);
            descLines.forEach(line => {
              yPosition = checkNewPage(yPosition);
              pdf.text(line, margin, yPosition);
              yPosition += lineHeight;
            });
          }
          yPosition += 8;
        });
        yPosition += sectionSpacing;
      }

      // Yetenekler
      if (cvData.skills && cvData.skills.length > 0) {
        yPosition = checkNewPage(yPosition);
        yPosition = addSection('YETENEK VE YETKİNLİKLER', yPosition, '⚡');
        
        pdf.setFontSize(11);
        pdf.setFont('arial', 'normal');
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        cvData.skills.forEach(skill => {
          yPosition = checkNewPage(yPosition);
          const skillText = `• ${skill.name}${skill.level ? ` (${skill.level}/5)` : ''}${skill.yearsOfExperience ? ` - ${skill.yearsOfExperience} yıl` : ''}`;
          pdf.text(skillText, margin, yPosition);
          yPosition += lineHeight;
        });
        yPosition += sectionSpacing;
      }

      // Sertifikalar
      if (cvData.certificates && cvData.certificates.length > 0) {
        yPosition = checkNewPage(yPosition);
        yPosition = addSection('SERTİFİKALAR', yPosition, '🏆');
        
        pdf.setFontSize(11);
        cvData.certificates.forEach(cert => {
          yPosition = checkNewPage(yPosition, 15);
          pdf.setFont('arial', 'bold');
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
          pdf.text(cert.name, margin, yPosition);
          yPosition += lineHeight;
          
          pdf.setFont('arial', 'normal');
          pdf.text(`${cert.startDate} - ${cert.endDate}`, margin, yPosition);
          if (cert.duration) {
            yPosition += lineHeight;
            pdf.text(`Süre: ${cert.duration} saat`, margin, yPosition);
          }
          yPosition += 8;
        });
        yPosition += sectionSpacing;
      }

      // Yabancı Dil
      if (cvData.languages && cvData.languages.length > 0) {
        yPosition = checkNewPage(yPosition);
        yPosition = addSection('YABANCI DİL', yPosition, '🌍');
        
        pdf.setFontSize(11);
        pdf.setFont('arial', 'normal');
        cvData.languages.forEach(lang => {
          yPosition = checkNewPage(yPosition);
          const langText = `• ${lang.name}${lang.examType ? ` - ${lang.examType}` : ''}${lang.examScore ? ` (${lang.examScore})` : ''}`;
          pdf.text(langText, margin, yPosition);
          yPosition += lineHeight;
        });
        yPosition += sectionSpacing;
      }

      // Yayınlar
      if (cvData.publications && cvData.publications.length > 0) {
        yPosition = checkNewPage(yPosition);
        yPosition = addSection('YAYINLAR VE MAKALELER', yPosition, '📚');
        
        pdf.setFontSize(11);
        cvData.publications.forEach(pub => {
          yPosition = checkNewPage(yPosition, 20);
          pdf.setFont('arial', 'bold');
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
          pdf.text(pub.title, margin, yPosition);
          yPosition += lineHeight;
          
          pdf.setFont('arial', 'normal');
          pdf.text(`Yayınlayıcı: ${pub.publisher}`, margin, yPosition);
          yPosition += lineHeight;
          pdf.text(`Tarih: ${pub.publishDate}`, margin, yPosition);
          yPosition += lineHeight;
          
          if (pub.description) {
            const descLines = wrapText(pub.description, pageWidth - 2 * margin);
            descLines.forEach(line => {
              yPosition = checkNewPage(yPosition);
              pdf.text(line, margin, yPosition);
              yPosition += lineHeight;
            });
          }
          yPosition += 8;
        });
        yPosition += sectionSpacing;
      }

      // Ödüller
      if (cvData.awards && cvData.awards.length > 0) {
        yPosition = checkNewPage(yPosition);
        yPosition = addSection('ÖDÜLLER VE BAŞARILAR', yPosition, '🥇');
        
        pdf.setFontSize(11);
        cvData.awards.forEach(award => {
          yPosition = checkNewPage(yPosition, 20);
          pdf.setFont('arial', 'bold');
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
          pdf.text(award.title, margin, yPosition);
          yPosition += lineHeight;
          
          pdf.setFont('arial', 'normal');
          pdf.text(`Kuruluş: ${award.organization}`, margin, yPosition);
          yPosition += lineHeight;
          pdf.text(`Tarih: ${award.date}`, margin, yPosition);
          yPosition += lineHeight;
          
          if (award.description) {
            const descLines = wrapText(award.description, pageWidth - 2 * margin);
            descLines.forEach(line => {
              yPosition = checkNewPage(yPosition);
              pdf.text(line, margin, yPosition);
              yPosition += lineHeight;
            });
          }
          yPosition += 8;
        });
        yPosition += sectionSpacing;
      }

      // Referanslar
      if (cvData.references && cvData.references.length > 0) {
        yPosition = checkNewPage(yPosition);
        yPosition = addSection('REFERANSLAR', yPosition, '👥');
        
        pdf.setFontSize(11);
        cvData.references.forEach(ref => {
          yPosition = checkNewPage(yPosition, 15);
          pdf.setFont('arial', 'bold');
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
          pdf.text(ref.name, margin, yPosition);
          yPosition += lineHeight;
          
          pdf.setFont('arial', 'normal');
          pdf.text(`Şirket: ${ref.company}`, margin, yPosition);
          yPosition += lineHeight;
          pdf.text(`Telefon: ${ref.phone}`, margin, yPosition);
          yPosition += lineHeight;
          
          if (ref.type) {
            pdf.text(`Tür: ${ref.type}`, margin, yPosition);
            yPosition += lineHeight;
          }
          yPosition += 8;
        });
        yPosition += sectionSpacing;
      }

      // Hobiler
      if (cvData.hobbies && cvData.hobbies.length > 0) {
        yPosition = checkNewPage(yPosition);
        yPosition = addSection('HOBİLER', yPosition, '🎨');
        
        pdf.setFontSize(11);
        pdf.setFont('arial', 'normal');
        
        const hobbiesText = cvData.hobbies.join(', ');
        const hobbiesLines = wrapText(hobbiesText, pageWidth - 2 * margin);
        hobbiesLines.forEach(line => {
          yPosition = checkNewPage(yPosition);
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
        yPosition += sectionSpacing;
      }

      // Değerlendirmeler
      if (cvData.evaluation && (cvData.evaluation.workSatisfaction > 0 || cvData.evaluation.facilitiesSatisfaction > 0 || 
          cvData.evaluation.longTermIntent > 0 || cvData.evaluation.recommendation > 0 || cvData.evaluation.applicationSatisfaction > 0)) {
        yPosition = checkNewPage(yPosition);
        yPosition = addSection('DEĞERLENDİRMELER', yPosition, '⭐');
        
        pdf.setFontSize(11);
        pdf.setFont('arial', 'normal');
        
        if (cvData.evaluation.workSatisfaction > 0) {
          pdf.text(`Türksat'ta çalışmaktan memnunum: ${'★'.repeat(cvData.evaluation.workSatisfaction)}${'☆'.repeat(5 - cvData.evaluation.workSatisfaction)} (${cvData.evaluation.workSatisfaction}/5)`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.evaluation.facilitiesSatisfaction > 0) {
          pdf.text(`Türksat'ın sağladığı imkânlardan memnunum: ${'★'.repeat(cvData.evaluation.facilitiesSatisfaction)}${'☆'.repeat(5 - cvData.evaluation.facilitiesSatisfaction)} (${cvData.evaluation.facilitiesSatisfaction}/5)`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.evaluation.longTermIntent > 0) {
          pdf.text(`Türksat'ta uzun süre çalışmak isterim: ${'★'.repeat(cvData.evaluation.longTermIntent)}${'☆'.repeat(5 - cvData.evaluation.longTermIntent)} (${cvData.evaluation.longTermIntent}/5)`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.evaluation.recommendation > 0) {
          pdf.text(`Türksat'ı arkadaşlarıma tavsiye ederim: ${'★'.repeat(cvData.evaluation.recommendation)}${'☆'.repeat(5 - cvData.evaluation.recommendation)} (${cvData.evaluation.recommendation}/5)`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.evaluation.applicationSatisfaction > 0) {
          pdf.text(`Bu "Yetkinlik-X" uygulamasını beğendim: ${'★'.repeat(cvData.evaluation.applicationSatisfaction)}${'☆'.repeat(5 - cvData.evaluation.applicationSatisfaction)} (${cvData.evaluation.applicationSatisfaction}/5)`, margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += sectionSpacing;
      }

      // Sosyal Medya
      if (cvData.personalInfo?.linkedIn || cvData.personalInfo?.github || cvData.personalInfo?.website || 
          cvData.personalInfo?.twitter || cvData.personalInfo?.instagram || cvData.personalInfo?.facebook || 
          cvData.personalInfo?.youtube || cvData.personalInfo?.tiktok || cvData.personalInfo?.discord || 
          cvData.personalInfo?.telegram || cvData.personalInfo?.whatsapp || cvData.personalInfo?.medium || 
          cvData.personalInfo?.behance || cvData.personalInfo?.dribbble || cvData.personalInfo?.stackoverflow) {
        yPosition = checkNewPage(yPosition);
        yPosition = addSection('SOSYAL MEDYA', yPosition, '🌐');
        
        pdf.setFontSize(11);
        pdf.setFont('arial', 'normal');
        
        if (cvData.personalInfo?.linkedIn) {
          pdf.text(`LinkedIn: ${cvData.personalInfo.linkedIn}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.github) {
          pdf.text(`GitHub: ${cvData.personalInfo.github}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.website) {
          pdf.text(`Website: ${cvData.personalInfo.website}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.twitter) {
          pdf.text(`Twitter: ${cvData.personalInfo.twitter}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.instagram) {
          pdf.text(`Instagram: ${cvData.personalInfo.instagram}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.facebook) {
          pdf.text(`Facebook: ${cvData.personalInfo.facebook}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.youtube) {
          pdf.text(`YouTube: ${cvData.personalInfo.youtube}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.tiktok) {
          pdf.text(`TikTok: ${cvData.personalInfo.tiktok}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.discord) {
          pdf.text(`Discord: ${cvData.personalInfo.discord}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.telegram) {
          pdf.text(`Telegram: ${cvData.personalInfo.telegram}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.whatsapp) {
          pdf.text(`WhatsApp: ${cvData.personalInfo.whatsapp}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.medium) {
          pdf.text(`Medium: ${cvData.personalInfo.medium}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.behance) {
          pdf.text(`Behance: ${cvData.personalInfo.behance}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.dribbble) {
          pdf.text(`Dribbble: ${cvData.personalInfo.dribbble}`, margin, yPosition);
          yPosition += lineHeight;
        }
        if (cvData.personalInfo?.stackoverflow) {
          pdf.text(`Stack Overflow: ${cvData.personalInfo.stackoverflow}`, margin, yPosition);
          yPosition += lineHeight;
        }
      }

      // PDF'i kaydet
      pdf.save(`CV_${cvData.personalInfo?.firstName}_${cvData.personalInfo?.lastName}.pdf`);
    } catch (error) {
      console.error('PDF oluşturmada hata:', error);
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
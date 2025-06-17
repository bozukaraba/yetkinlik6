import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCVData, saveCVData } from '../services/cvService';
import { CVData, Education, Experience, Skill, Language, Reference, Certificate, Award, Publication, Hobby } from '../types/cv';
import { ChevronLeft, ChevronRight, Save, Trash2, Download, GripVertical } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item component for drag and drop
interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-2 top-2 z-10 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
      </div>
      {children}
    </div>
  );
};

const CVForm = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Başlangıç formunu oluştur
  const initialFormData: CVData = {
    userId: currentUser?.id || '',
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Türkiye',
      summary: '',
      maritalStatus: 'bekar',
      militaryStatus: 'yapılmadı',
      drivingLicense: [],
      linkedIn: '',
      website: '',
      profileImage: undefined,
      turksatEmployeeNumber: ''
    },
    education: [],
    experience: [],
    skills: [],
    languages: [],
    certificates: [],
    projects: [],
    publications: [],
    volunteer: [],
    references: [],
    hobbies: [],
    awards: []
  };
  
  const [formData, setFormData] = useState<CVData>(initialFormData);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag end handlers
  const handleEducationDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.education?.findIndex(edu => edu.id === active.id) ?? -1;
        const newIndex = prev.education?.findIndex(edu => edu.id === over.id) ?? -1;
        
        if (oldIndex !== -1 && newIndex !== -1 && prev.education) {
          const reorderedEducation = arrayMove(prev.education, oldIndex, newIndex)
            .map((edu, index) => ({ ...edu, sortOrder: index }));
          
          return {
            ...prev,
            education: reorderedEducation
          };
        }
        return prev;
      });
    }
  };

  const handleExperienceDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.experience?.findIndex(exp => exp.id === active.id) ?? -1;
        const newIndex = prev.experience?.findIndex(exp => exp.id === over.id) ?? -1;
        
        if (oldIndex !== -1 && newIndex !== -1 && prev.experience) {
          const reorderedExperience = arrayMove(prev.experience, oldIndex, newIndex)
            .map((exp, index) => ({ ...exp, sortOrder: index }));
          
          return {
            ...prev,
            experience: reorderedExperience
          };
        }
        return prev;
      });
    }
  };

  const handleSkillDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.skills?.findIndex(skill => skill.id === active.id) ?? -1;
        const newIndex = prev.skills?.findIndex(skill => skill.id === over.id) ?? -1;
        
        if (oldIndex !== -1 && newIndex !== -1 && prev.skills) {
          const reorderedSkills = arrayMove(prev.skills, oldIndex, newIndex)
            .map((skill, index) => ({ ...skill, sortOrder: index }));
          
          return {
            ...prev,
            skills: reorderedSkills
          };
        }
        return prev;
      });
    }
  };

  const handleLanguageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.languages?.findIndex(lang => lang.id === active.id) ?? -1;
        const newIndex = prev.languages?.findIndex(lang => lang.id === over.id) ?? -1;
        
        if (oldIndex !== -1 && newIndex !== -1 && prev.languages) {
          const reorderedLanguages = arrayMove(prev.languages, oldIndex, newIndex)
            .map((lang, index) => ({ ...lang, sortOrder: index }));
          
          return {
            ...prev,
            languages: reorderedLanguages
          };
        }
        return prev;
      });
    }
  };

  useEffect(() => {
    const loadExistingCV = async () => {
      if (currentUser) {
        try {
          const existingCV = await getCVData(currentUser.id);
          if (existingCV) {
            // Sort arrays by sortOrder when loading CV
            const sortedCV = {
              ...existingCV,
              education: existingCV.education?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
              experience: existingCV.experience?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
              skills: existingCV.skills?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
              languages: existingCV.languages?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
              certificates: existingCV.certificates?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
              awards: existingCV.awards?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
              publications: existingCV.publications?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
              references: existingCV.references?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
            };
            setFormData(sortedCV);
          }
        } catch (error) {
          console.error('CV yüklenirken hata oluştu:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // currentUser yoksa da loading'i false yap
        setLoading(false);
      }
    };

    loadExistingCV();
  }, [currentUser]);

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [name]: value
      }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        // Resmi otomatik olarak optimize et
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Maksimum boyutlar - localStorage için daha agresif optimize
          const maxWidth = 150;
          const maxHeight = 150;
          
          let { width, height } = img;
          
          // Orantılı olarak boyutlandır
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Çok yüksek sıkıştırma ile optimize et (kalite: 0.3)
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.3);
          
          // Boyut kontrolü
          const sizeInKB = optimizedDataUrl.length * 0.75 / 1024;
          console.log(`Profil resmi boyutu: ${sizeInKB.toFixed(1)}KB`);
          
          if (sizeInKB > 30) {
            alert('Resim çok büyük. Lütfen daha küçük bir resim seçin.');
            return;
          }
          
          setFormData(prev => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              profileImage: optimizedDataUrl
            }
          }));
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        profileImage: undefined
      }
    }));
  };

  const handleSGKDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // PDF dosyası kontrolü
      if (file.type !== 'application/pdf') {
        alert('Lütfen sadece PDF dosyası yükleyin.');
        return;
      }

      // Dosya boyutu kontrolü (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('PDF dosyası 5MB\'dan küçük olmalıdır.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        // PDF boyutunu kontrol et
        const sizeInMB = result.length * 0.75 / (1024 * 1024);
        console.log(`SGK belgesi boyutu: ${sizeInMB.toFixed(1)}MB`);
        
        if (sizeInMB > 4) {
          alert('PDF dosyası çok büyük. Lütfen daha küçük bir dosya seçin.');
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            sgkServiceDocument: result
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSGKDocument = () => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        sgkServiceDocument: undefined
      }
    }));
  };

  const addEducation = () => {
    const newEducation: Education = {
      id: crypto.randomUUID(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      current: false,
      description: '',
      sortOrder: 0
    };
    setFormData(prev => ({
      ...prev,
      education: [newEducation, ...(prev.education || []).map(edu => ({ ...edu, sortOrder: (edu.sortOrder || 0) + 1 }))]
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education?.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index) || []
    }));
  };

  const addExperience = () => {
    const newExperience: Experience = {
      id: crypto.randomUUID(),
      title: '',
      company: '',
      startDate: '',
      current: false,
      description: '',
      workDuration: '',
      sortOrder: 0
    };
    setFormData(prev => ({
      ...prev,
      experience: [newExperience, ...(prev.experience || []).map(exp => ({ ...exp, sortOrder: (exp.sortOrder || 0) + 1 }))]
    }));
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience?.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience?.filter((_, i) => i !== index) || []
    }));
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name: '',
      level: 1,
      category: '',
      yearsOfExperience: 0,
      sortOrder: 0
    };
    setFormData(prev => ({
      ...prev,
      skills: [newSkill, ...(prev.skills || []).map(skill => ({ ...skill, sortOrder: (skill.sortOrder || 0) + 1 }))]
    }));
  };

  const updateSkill = (index: number, field: keyof Skill, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter((_, i) => i !== index) || []
    }));
  };

  const addLanguage = () => {
    const newLanguage: Language = {
      id: crypto.randomUUID(),
      name: '',
      examType: '',
      certificateDate: '',
      examScore: '',
      sortOrder: 0
    };
    setFormData(prev => ({
      ...prev,
      languages: [newLanguage, ...(prev.languages || []).map(lang => ({ ...lang, sortOrder: (lang.sortOrder || 0) + 1 }))]
    }));
  };

  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages?.filter((_, i) => i !== index) || []
    }));
  };

  const addReference = () => {
    const newReference: Reference = {
      id: crypto.randomUUID(),
      name: '',
      company: '',
      phone: '',
      type: ''
    };
    setFormData(prev => ({
      ...prev,
      references: [newReference, ...(prev.references || [])]
    }));
  };

  const updateReference = (index: number, field: keyof Reference, value: string) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references?.map((ref, i) => 
        i === index ? { ...ref, [field]: value } : ref
      )
    }));
  };

  const removeReference = (index: number) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references?.filter((_, i) => i !== index) || []
    }));
  };

  const addCertificate = () => {
    const newCertificate: Certificate = {
      id: crypto.randomUUID(),
      name: '',
      startDate: '',
      endDate: '',
      duration: ''
    };
    setFormData(prev => ({
      ...prev,
      certificates: [newCertificate, ...(prev.certificates || [])]
    }));
  };

  const updateCertificate = (index: number, field: keyof Certificate, value: string) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates?.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const removeCertificate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates?.filter((_, i) => i !== index) || []
    }));
  };

  const addHobby = () => {
    const newHobby: Hobby = {
      id: crypto.randomUUID(),
      category: 'Kültür',
      sortOrder: 0
    };
    setFormData(prev => ({
      ...prev,
      hobbies: [newHobby, ...(prev.hobbies || [])].map((hobby, index) => ({
        ...hobby,
        sortOrder: index
      }))
    }));
  };

  const updateHobby = (index: number, field: keyof Hobby, value: string) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies?.map((hobby, i) => 
        i === index ? { ...hobby, [field]: value } : hobby
      )
    }));
  };

  const removeHobby = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies?.filter((_, i) => i !== index) || []
    }));
  };

  const addAward = () => {
    const newAward: Award = {
      id: crypto.randomUUID(),
      title: '',
      organization: '',
      date: '',
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      awards: [newAward, ...(prev.awards || [])]
    }));
  };

  const updateAward = (index: number, field: keyof Award, value: string) => {
    setFormData(prev => ({
      ...prev,
      awards: prev.awards?.map((award, i) => 
        i === index ? { ...award, [field]: value } : award
      )
    }));
  };

  const removeAward = (index: number) => {
    setFormData(prev => ({
      ...prev,
      awards: prev.awards?.filter((_, i) => i !== index) || []
    }));
  };

  const addPublication = () => {
    const newPublication: Publication = {
      id: crypto.randomUUID(),
      title: '',
      authors: [''],
      publishDate: '',
      publisher: '',
      url: '',
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      publications: [newPublication, ...(prev.publications || [])]
    }));
  };

  const updatePublication = (index: number, field: keyof Publication, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      publications: prev.publications?.map((pub, i) => 
        i === index ? { ...pub, [field]: value } : pub
      )
    }));
  };

  const removePublication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      publications: prev.publications?.filter((_, i) => i !== index) || []
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== CV FORM SUBMIT BAŞLADI ===');
    console.log('Current user:', currentUser);
    console.log('Form data:', formData);

    if (!currentUser) {
      console.error('No current user found');
      alert('Oturum doğrulanamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        userId: currentUser.id
      };

      console.log('Data to save:', dataToSave);
      console.log('Submitting CV data for user:', currentUser.id);
      
      const savedCV = await saveCVData(currentUser.id, dataToSave);
      console.log('CV saved successfully:', savedCV);
      
      alert('CV başarıyla kaydedildi!');
      navigate('/dashboard');
    } catch (error) {
      console.error('CV kaydedilirken hata:', error);
      
      // Check if it's an auth error
      if (error instanceof Error && error.message.includes('oturum')) {
        alert('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        logout();
      } else {
        alert('CV kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCV = async () => {
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
      
      // CV içeriğini HTML olarak oluştur - MODERN ESTETİK VERSİYON
      element.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2d3748; line-height: 1.6;">
          <!-- CV Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; margin: -40px -40px 30px -40px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);"></div>
            <div style="position: relative; z-index: 1;">
              ${formData.personalInfo?.profileImage ? `
                <div style="margin: 0 auto 20px auto; width: 120px; height: 120px; border-radius: 50%; border: 5px solid white; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.3);">
                  <img src="${formData.personalInfo.profileImage}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
              ` : ''}
              <h1 style="font-size: 36px; font-weight: 700; margin: 0 0 10px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                ${formData.personalInfo?.firstName} ${formData.personalInfo?.lastName}
              </h1>
              <div style="height: 3px; width: 60px; background: #fff; margin: 15px auto 20px auto; border-radius: 2px;"></div>
              <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; font-size: 16px;">
                ${formData.personalInfo?.email ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; background: #fff; border-radius: 50%; display: inline-block;"></span>
                    ${formData.personalInfo.email}
                  </div>
                ` : ''}
                ${formData.personalInfo?.phone ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; background: #fff; border-radius: 50%; display: inline-block;"></span>
                    ${formData.personalInfo.phone}
                  </div>
                ` : ''}
                ${formData.personalInfo?.turksatEmployeeNumber ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; background: #fff; border-radius: 50%; display: inline-block;"></span>
                    Türksat Sicil No: ${formData.personalInfo.turksatEmployeeNumber}
                  </div>
                ` : ''}
                ${formData.personalInfo?.residenceCity || formData.personalInfo?.residenceDistrict ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; background: #fff; border-radius: 50%; display: inline-block;"></span>
                    ${formData.personalInfo?.residenceCity || ''}${formData.personalInfo?.residenceCity && formData.personalInfo?.residenceDistrict ? ' / ' : ''}${formData.personalInfo?.residenceDistrict || ''}
                  </div>
                ` : ''}
              </div>
              ${formData.personalInfo?.gender ? `
                <div style="margin-top: 15px; font-size: 14px; opacity: 0.9;">
                  Cinsiyet: ${formData.personalInfo.gender}
                </div>
              ` : ''}
              ${formData.personalInfo?.sgkServiceDocument ? `
                <div style="margin-top: 15px; font-size: 14px; opacity: 0.9; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block;">
                  ✓ SGK Hizmet Dökümü: Yüklendi
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Summary -->
          ${formData.personalInfo?.summary ? `
          <div style="margin-bottom: 35px; background: #f8fafc; padding: 25px; border-radius: 12px; border-left: 5px solid #667eea;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
              <span style="width: 8px; height: 8px; background: #667eea; border-radius: 50%; display: inline-block;"></span>
              Hakkımda
            </h2>
            <p style="color: #4a5568; line-height: 1.7; margin: 0; font-size: 15px;">${formData.personalInfo.summary}</p>
          </div>
          ` : ''}

          <!-- Social Links -->
          ${formData.personalInfo?.linkedIn || formData.personalInfo?.github || formData.personalInfo?.twitter || formData.personalInfo?.website || formData.personalInfo?.instagram || formData.personalInfo?.facebook || formData.personalInfo?.youtube || formData.personalInfo?.tiktok || formData.personalInfo?.discord || formData.personalInfo?.telegram || formData.personalInfo?.whatsapp || formData.personalInfo?.medium || formData.personalInfo?.behance || formData.personalInfo?.dribbble || formData.personalInfo?.stackoverflow ? `
          <div style="margin-bottom: 35px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🔗</span>
              Sosyal Medya & İletişim
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              ${formData.personalInfo?.linkedIn ? `<div style="background: #0077b5; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">LinkedIn: ${formData.personalInfo.linkedIn}</div>` : ''}
              ${formData.personalInfo?.github ? `<div style="background: #333; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">GitHub: ${formData.personalInfo.github}</div>` : ''}
              ${formData.personalInfo?.twitter ? `<div style="background: #1da1f2; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Twitter: ${formData.personalInfo.twitter}</div>` : ''}
              ${formData.personalInfo?.instagram ? `<div style="background: linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d); color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Instagram: ${formData.personalInfo.instagram}</div>` : ''}
              ${formData.personalInfo?.facebook ? `<div style="background: #4267b2; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Facebook: ${formData.personalInfo.facebook}</div>` : ''}
              ${formData.personalInfo?.youtube ? `<div style="background: #ff0000; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">YouTube: ${formData.personalInfo.youtube}</div>` : ''}
              ${formData.personalInfo?.website ? `<div style="background: #4a5568; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Website: ${formData.personalInfo.website}</div>` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Skills -->
          ${formData.skills && formData.skills.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">⚡</span>
              Yetenek ve Yetkinlikler
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              ${formData.skills.map(skill => `
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 10px 16px; border-radius: 25px; font-size: 14px; font-weight: 500; box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3); display: flex; align-items: center; gap: 8px;">
                  <span style="width: 6px; height: 6px; background: white; border-radius: 50%; display: inline-block;"></span>
                  ${skill.name}${skill.level ? ` (${skill.level}/5)` : ''}${skill.yearsOfExperience ? ` - ${skill.yearsOfExperience} yıl` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Experience -->
          ${formData.experience && formData.experience.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">💼</span>
              İş Deneyimi
            </h2>
            ${formData.experience.map((exp, index) => `
              <div style="margin-bottom: 25px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 4px solid #ed8936; position: relative;">
                <div style="position: absolute; top: -5px; left: -7px; width: 14px; height: 14px; background: #ed8936; border-radius: 50%; border: 3px solid white;"></div>
                <h3 style="font-weight: 600; color: #2d3748; margin: 0 0 5px 0; font-size: 16px;">${exp.company}</h3>
                <p style="color: #667eea; font-weight: 500; font-size: 15px; margin: 0 0 8px 0;">${exp.title}</p>
                ${exp.department ? `<p style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0; font-style: italic;">🏢 Departman: ${exp.department}</p>` : ''}
                ${exp.location ? `<p style="color: #a0aec0; font-size: 13px; margin: 0 0 5px 0;">📍 ${exp.location}</p>` : ''}
                <p style="color: #a0aec0; font-size: 13px; margin: 0 0 15px 0; display: flex; align-items: center; gap: 5px;">
                  <span style="width: 6px; height: 6px; background: #ed8936; border-radius: 50%; display: inline-block;"></span>
                  ${new Date(exp.startDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })} - 
                  ${exp.current ? 'Günümüz' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : 'Belirtilmemiş'}
                  ${exp.workDuration ? ` (${exp.workDuration})` : ''}
                </p>
                ${exp.tasks ? `<div style="margin-bottom: 12px;"><strong style="color: #2d3748; font-size: 14px;">📋 Görevler:</strong><p style="color: #4a5568; line-height: 1.6; margin: 5px 0 0 0; font-size: 14px;">${exp.tasks}</p></div>` : ''}
                ${exp.projectDetails ? `<div style="margin-bottom: 12px;"><strong style="color: #2d3748; font-size: 14px;">🚀 Projeler:</strong><p style="color: #4a5568; line-height: 1.6; margin: 5px 0 0 0; font-size: 14px;">${exp.projectDetails}</p></div>` : ''}
                ${exp.description ? `<div style="margin-bottom: 0;"><strong style="color: #2d3748; font-size: 14px;">📝 Açıklama:</strong><p style="color: #4a5568; line-height: 1.6; margin: 5px 0 0 0; font-size: 14px;">${exp.description}</p></div>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Education -->
          ${formData.education && formData.education.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🎓</span>
              Öğrenim
            </h2>
            ${formData.education.map((edu, index) => `
              <div style="margin-bottom: 25px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 4px solid #38b2ac; position: relative;">
                <div style="position: absolute; top: -5px; left: -7px; width: 14px; height: 14px; background: #38b2ac; border-radius: 50%; border: 3px solid white;"></div>
                <h3 style="font-weight: 600; color: #2d3748; margin: 0 0 8px 0; font-size: 16px;">${edu.degree}</h3>
                <p style="color: #667eea; font-weight: 500; font-size: 14px; margin: 0 0 5px 0;">${edu.fieldOfStudy} - ${edu.institution}</p>
                ${edu.educationLevel ? `<p style="color: #9ca3af; font-size: 13px; margin: 0 0 5px 0;">${edu.educationLevel}</p>` : ''}
                <p style="color: #a0aec0; font-size: 13px; margin: 0 0 15px 0; display: flex; align-items: center; gap: 5px;">
                  <span style="width: 6px; height: 6px; background: #38b2ac; border-radius: 50%; display: inline-block;"></span>
                  ${edu.current ? 'Devam ediyor' : edu.endDate ? `Mezun: ${new Date(edu.endDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })}` : 'Mezuniyet tarihi belirtilmemiş'}
                </p>
                ${edu.description ? `<p style="color: #4a5568; line-height: 1.6; margin: 0; font-size: 14px; font-style: italic;">${edu.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Languages -->
          ${formData.languages && formData.languages.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🌍</span>
              Yabancı Dil
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 15px;">
              ${formData.languages.map(lang => `
                <div style="background: white; padding: 15px 20px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); border: 2px solid #e2e8f0; min-width: 150px; text-align: center;">
                  <div style="font-weight: 600; color: #2d3748; font-size: 15px; margin-bottom: 5px;">${lang.name}</div>
                  ${lang.examType ? `<div style="color: #667eea; font-size: 13px; margin-bottom: 3px;">${lang.examType}</div>` : ''}
                  ${lang.examScore ? `<div style="color: #38a169; font-weight: 500; font-size: 14px;">${lang.examScore}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Certificates -->
          ${formData.certificates && formData.certificates.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🏆</span>
              Sertifikalar
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
              ${formData.certificates.map(cert => `
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); border-left: 4px solid #38a169; position: relative;">
                  <div style="position: absolute; top: -5px; left: -7px; width: 14px; height: 14px; background: #38a169; border-radius: 50%; border: 3px solid white;"></div>
                  <h3 style="font-weight: 600; color: #2d3748; margin: 0 0 8px 0; font-size: 15px;">${cert.name}</h3>
                  <p style="color: #a0aec0; font-size: 13px; margin: 0;">📅 ${cert.startDate} - ${cert.endDate}</p>
                  ${cert.duration ? `<p style="color: #a0aec0; font-size: 13px; margin: 5px 0 0 0;">⏱️ Süre: ${cert.duration} saat</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Awards -->
          ${formData.awards && formData.awards.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🏅</span>
              Ödüller ve Başarılar
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
              ${formData.awards.map(award => `
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); border-left: 4px solid #f56565; position: relative;">
                  <div style="position: absolute; top: -5px; left: -7px; width: 14px; height: 14px; background: #f56565; border-radius: 50%; border: 3px solid white;"></div>
                  <h3 style="font-weight: 600; color: #2d3748; margin: 0 0 8px 0; font-size: 15px;">${award.title}</h3>
                  <p style="color: #667eea; font-size: 14px; margin: 0 0 5px 0;">${award.organization}</p>
                  <p style="color: #a0aec0; font-size: 13px; margin: 0;">📅 ${award.date}</p>
                  ${award.description ? `<p style="color: #4a5568; font-size: 13px; margin: 8px 0 0 0; font-style: italic;">${award.description}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Publications -->
          ${formData.publications && formData.publications.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">📚</span>
              Yayınlar ve Makaleler
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
              ${formData.publications.map(pub => `
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); border-left: 4px solid #9f7aea; position: relative;">
                  <div style="position: absolute; top: -5px; left: -7px; width: 14px; height: 14px; background: #9f7aea; border-radius: 50%; border: 3px solid white;"></div>
                  <h3 style="font-weight: 600; color: #2d3748; margin: 0 0 8px 0; font-size: 15px;">${pub.title}</h3>
                  <p style="color: #667eea; font-size: 14px; margin: 0 0 5px 0;">Yayınlayıcı: ${pub.publisher}</p>
                  <p style="color: #a0aec0; font-size: 13px; margin: 0;">📅 ${pub.publishDate}</p>
                  ${pub.description ? `<p style="color: #4a5568; font-size: 13px; margin: 8px 0 0 0; font-style: italic;">${pub.description}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Hobbies -->
          ${formData.hobbies && formData.hobbies.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🎨</span>
              Hobi ve İlgi Alanları
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              ${formData.hobbies.map(hobby => `
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; box-shadow: 0 2px 6px rgba(240, 147, 251, 0.3);">
                  ${hobby.category === 'Diğer' ? hobby.customValue || 'Diğer' : hobby.category}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- References -->
          ${formData.references && formData.references.length > 0 ? `
          <div style="margin-bottom: 35px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #667eea; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              <span style="width: 24px; height: 24px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">👥</span>
              Referanslar
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
              ${formData.references.map(ref => `
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); border-left: 4px solid #4299e1; position: relative;">
                  <div style="position: absolute; top: -5px; left: -7px; width: 14px; height: 14px; background: #4299e1; border-radius: 50%; border: 3px solid white;"></div>
                  <h3 style="font-weight: 600; color: #2d3748; margin: 0 0 8px 0; font-size: 15px;">${ref.name}</h3>
                  <p style="color: #667eea; font-size: 14px; margin: 0 0 5px 0;">${ref.company}</p>
                  <p style="color: #a0aec0; font-size: 13px; margin: 0;">📞 ${ref.phone}</p>
                  ${ref.type ? `<p style="color: #4a5568; font-size: 13px; margin: 5px 0 0 0; font-style: italic;">${ref.type}</p>` : ''}
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
      
      document.body.appendChild(element);
      
      // HTML'i canvas'a çevir
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
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
      const fileName = `${formData.personalInfo?.firstName}_${formData.personalInfo?.lastName}_CV.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Kişisel Bilgiler</h3>
            
            {/* Profil Resmi */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {formData.personalInfo?.profileImage ? (
                  <div className="relative">
                    <img
                      src={formData.personalInfo.profileImage}
                      alt="Profil"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
                  Resim Seç
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ad</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.personalInfo?.firstName || ''}
                  onChange={handlePersonalInfoChange}
                  className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Soyad</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.personalInfo?.lastName || ''}
                  onChange={handlePersonalInfoChange}
                  className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-posta</label>
                <input
                  type="email"
                  name="email"
                  value={formData.personalInfo?.email || ''}
                  onChange={handlePersonalInfoChange}
                  className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.personalInfo?.phone || ''}
                  onChange={handlePersonalInfoChange}
                  className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Türksat Sicil No</label>
                <input
                  type="text"
                  name="turksatEmployeeNumber"
                  value={formData.personalInfo?.turksatEmployeeNumber || ''}
                  onChange={handlePersonalInfoChange}
                  className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Doğum Tarihi</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.personalInfo?.birthDate || ''}
                  onChange={handlePersonalInfoChange}
                  className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Medeni Durum</label>
                <select
                  name="maritalStatus"
                  value={formData.personalInfo?.maritalStatus || 'bekar'}
                  onChange={handlePersonalInfoChange}
                  className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                >
                  <option value="bekar">Bekar</option>
                  <option value="evli">Evli</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cinsiyet</label>
                <select
                  name="gender"
                  value={formData.personalInfo?.gender || ''}
                  onChange={handlePersonalInfoChange}
                  className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                >
                  <option value="">Seçiniz</option>
                  <option value="Kadın">Kadın</option>
                  <option value="Erkek">Erkek</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">İkametgah İli</label>
                <input
                  type="text"
                  name="residenceCity"
                  value={formData.personalInfo?.residenceCity || ''}
                  onChange={handlePersonalInfoChange}
                  className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">İkametgah İlçesi</label>
                <input
                  type="text"
                  name="residenceDistrict"
                  value={formData.personalInfo?.residenceDistrict || ''}
                  onChange={handlePersonalInfoChange}
                  className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Askerlik Durumu</label>
                <select
                  name="militaryStatus"
                  value={formData.personalInfo?.militaryStatus || 'yapılmadı'}
                  onChange={handlePersonalInfoChange}
                  className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                >
                  <option value="yapılmadı">Yapılmadı</option>
                  <option value="yapıldı">Yapıldı</option>
                  <option value="muaf">Muaf</option>
                  <option value="tecilli">Tecilli</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Özet</label>
              <textarea
                name="summary"
                value={formData.personalInfo?.summary || ''}
                onChange={handlePersonalInfoChange}
                rows={4}
                className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
              />
            </div>
            
            {/* SGK Hizmet Dökümü */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">SGK Hizmet Dökümü Ekle</h4>
              <div className="flex flex-col items-center space-y-4">
                {formData.personalInfo?.sgkServiceDocument ? (
                  <div className="w-full max-w-md">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-green-800">SGK Hizmet Dökümü</p>
                          <p className="text-xs text-green-600">PDF dosyası yüklendi</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeSGKDocument}
                        className="text-red-500 hover:text-red-700"
                        title="Dosyayı Kaldır"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-md">
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg hover:border-gray-300 transition-colors">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
                        PDF Dosyası Seç
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleSGKDocumentUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-500 text-center">
                        Sadece PDF dosyaları kabul edilir (Maksimum 5MB)<br />
                        Dosyalar otomatik olarak optimize edilir
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Sosyal Medya Hesapları</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                  <input
                    type="url"
                    name="linkedIn"
                    value={formData.personalInfo?.linkedIn || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="https://linkedin.com/in/kullanici-adi"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">GitHub</label>
                  <input
                    type="url"
                    name="github"
                    value={formData.personalInfo?.github || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="https://github.com/kullanici-adi"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Twitter</label>
                  <input
                    type="url"
                    name="twitter"
                    value={formData.personalInfo?.twitter || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="https://twitter.com/kullanici-adi"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Instagram</label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.personalInfo?.instagram || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="https://instagram.com/kullanici-adi"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Facebook</label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.personalInfo?.facebook || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="https://facebook.com/kullanici-adi"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">YouTube</label>
                  <input
                    type="url"
                    name="youtube"
                    value={formData.personalInfo?.youtube || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="https://youtube.com/@kullanici-adi"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">TikTok</label>
                  <input
                    type="url"
                    name="tiktok"
                    value={formData.personalInfo?.tiktok || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="https://tiktok.com/@kullanici-adi"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discord</label>
                  <input
                    type="text"
                    name="discord"
                    value={formData.personalInfo?.discord || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="kullanici#1234"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telegram</label>
                  <input
                    type="text"
                    name="telegram"
                    value={formData.personalInfo?.telegram || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="@kullanici-adi"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.personalInfo?.whatsapp || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="+90 555 123 45 67"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medium</label>
                  <input
                    type="url"
                    name="medium"
                    value={formData.personalInfo?.medium || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="https://medium.com/@kullanici-adi"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Behance</label>
                  <input
                    type="url"
                    name="behance"
                    value={formData.personalInfo?.behance || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="https://behance.net/kullanici-adi"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dribbble</label>
                  <input
                    type="url"
                    name="dribbble"
                    value={formData.personalInfo?.dribbble || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="https://dribbble.com/kullanici-adi"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stack Overflow</label>
                  <input
                    type="url"
                    name="stackoverflow"
                    value={formData.personalInfo?.stackoverflow || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="https://stackoverflow.com/users/kullanici-id"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.personalInfo?.website || ''}
                    onChange={handlePersonalInfoChange}
                    placeholder="https://website.com"
                    className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Öğrenim Bilgileri</h3>
              <button
                type="button"
                onClick={addEducation}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Öğrenim Ekle
              </button>
            </div>
            
            {formData.education?.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Henüz öğrenim eklenmemiş.</p>
                <button
                  type="button"
                  onClick={addEducation}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <span className="mr-1">+</span>
                  Öğrenim Ekle
                </button>
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleEducationDragEnd}
              >
                <SortableContext items={formData.education?.map(edu => edu.id) || []} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {formData.education?.map((edu, index) => (
                      <SortableItem key={edu.id} id={edu.id}>
                        <div className="border rounded-lg p-4 pl-10">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-gray-700">Öğrenim #{index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeEducation(index)}
                              className="text-red-500 hover:text-red-700"
                              title="Sil"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Öğrenim Düzeyi</label>
                        <select
                          value={edu.educationLevel || ''}
                          onChange={(e) => updateEducation(index, 'educationLevel', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        >
                          <option value="">Seçiniz</option>
                          <option value="İlkokul">İlkokul</option>
                          <option value="Ortaokul">Ortaokul</option>
                          <option value="Lise">Lise</option>
                          <option value="Ön Lisans">Ön Lisans</option>
                          <option value="Lisans">Lisans</option>
                          <option value="Yüksek Lisans">Yüksek Lisans</option>
                          <option value="Doktora">Doktora</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Okul Adı</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bölüm</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                        <input
                          type="date"
                          value={edu.endDate || ''}
                          onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                          disabled={edu.current}
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={edu.current || false}
                          onChange={(e) => updateEducation(index, 'current', e.target.checked)}
                          className="h-5 w-5 text-blue-600 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Devam ediyor</label>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                      <textarea
                        value={edu.description || ''}
                        onChange={(e) => updateEducation(index, 'description', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                      />
                    </div>
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Deneyim Bilgileri</h3>
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Deneyim Ekle
              </button>
            </div>
            
            {formData.experience?.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Henüz deneyim eklenmemiş.</p>
                <button
                  type="button"
                  onClick={addExperience}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <span className="mr-1">+</span>
                  Deneyim Ekle
                </button>
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleExperienceDragEnd}
              >
                <SortableContext items={formData.experience?.map(exp => exp.id) || []} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {formData.experience?.map((exp, index) => (
                      <SortableItem key={exp.id} id={exp.id}>
                        <div className="border rounded-lg p-4 pl-10">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-gray-700">Deneyim #{index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeExperience(index)}
                              className="text-red-500 hover:text-red-700"
                              title="Sil"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Şirket</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Çalıştığınız Departman</label>
                        <input
                          type="text"
                          value={exp.department || ''}
                          onChange={(e) => updateExperience(index, 'department', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pozisyon Unvanı</label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => updateExperience(index, 'title', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Çalışma Süresi</label>
                        <input
                          type="text"
                          value={exp.workDuration || ''}
                          onChange={(e) => updateExperience(index, 'workDuration', e.target.value)}
                          placeholder="Örn: 2 yıl 6 ay, 1.5 yıl, 18 ay"
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Görev</label>
                        <textarea
                          value={exp.tasks || ''}
                          onChange={(e) => updateExperience(index, 'tasks', e.target.value)}
                          rows={3}
                          placeholder="Görevlerinizi detaylıca açıklayınız..."
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Proje</label>
                        <textarea
                          value={exp.projectDetails || ''}
                          onChange={(e) => updateExperience(index, 'projectDetails', e.target.value)}
                          rows={3}
                          placeholder="Yaptığınız projeleri detaylıca açıklayınız..."
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
                        <input
                          type="date"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                        <input
                          type="date"
                          value={exp.endDate || ''}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                          disabled={exp.current}
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exp.current || false}
                          onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                          className="h-5 w-5 text-blue-600 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Halen çalışıyorum</label>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                      />
                    </div>
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Yetenek ve Yetkinlik Bilgileri</h3>
              <button
                type="button"
                onClick={addSkill}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Yetenek Ekle
              </button>
            </div>
            <p className="text-sm text-gray-600">(Java, .NET, Excel, Pazarlama, Muhasebe, Satın Alma, İş Geliştirme, Yazılım Geliştirme, Analiz, İnsan Kaynakları vb.)</p>
            
            {formData.skills?.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Henüz yetenek eklenmemiş.</p>
                <button
                  type="button"
                  onClick={addSkill}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <span className="mr-1">+</span>
                  Yetenek Ekle
                </button>
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSkillDragEnd}
              >
                <SortableContext items={formData.skills?.map(skill => skill.id) || []} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {formData.skills?.map((skill, index) => (
                      <SortableItem key={skill.id} id={skill.id}>
                        <div className="border rounded-lg p-4 pl-10">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-gray-700">Yetenek #{index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeSkill(index)}
                              className="text-red-500 hover:text-red-700"
                              title="Sil"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Yetenek Adı</label>
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) => updateSkill(index, 'name', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Seviye (1-5)</label>
                        <select
                          value={skill.level || 1}
                          onChange={(e) => updateSkill(index, 'level', Number(e.target.value))}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        >
                          <option value={1}>1</option>
                          <option value={1.5}>1.5</option>
                          <option value={2}>2</option>
                          <option value={2.5}>2.5</option>
                          <option value={3}>3</option>
                          <option value={3.5}>3.5</option>
                          <option value={4}>4</option>
                          <option value={4.5}>4.5</option>
                          <option value={5}>5</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tecrübe Yılı (0-50)</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={skill.yearsOfExperience || 0}
                          onChange={(e) => updateSkill(index, 'yearsOfExperience', Number(e.target.value))}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Sertifika ve Eğitim Bilgileri</h3>
              <button
                type="button"
                onClick={addCertificate}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Sertifika ve Eğitim Ekle
              </button>
            </div>
            
            {formData.certificates?.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Henüz sertifika ve eğitim eklenmemiş.</p>
                <button
                  type="button"
                  onClick={addCertificate}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <span className="mr-1">+</span>
                  Sertifika ve Eğitim Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.certificates?.map((cert, index) => (
                  <div key={cert.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-700">Sertifika ve Eğitim #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeCertificate(index)}
                        className="text-red-500 hover:text-red-700"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sertifika ve Eğitim Adı</label>
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => updateCertificate(index, 'name', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
                        <input
                          type="date"
                          value={cert.startDate ? cert.startDate.split('-').reverse().join('-') : ''}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            const formattedDate = selectedDate ? selectedDate.split('-').reverse().join('-') : '';
                            updateCertificate(index, 'startDate', formattedDate);
                          }}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                        <input
                          type="date"
                          value={cert.endDate ? cert.endDate.split('-').reverse().join('-') : ''}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            const formattedDate = selectedDate ? selectedDate.split('-').reverse().join('-') : '';
                            updateCertificate(index, 'endDate', formattedDate);
                          }}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Süre (Saat)</label>
                        <input
                          type="text"
                          value={cert.duration || ''}
                          onChange={(e) => updateCertificate(index, 'duration', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Yabancı Dil</h3>
              <button
                type="button"
                onClick={addLanguage}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Yabancı Dil Ekle
              </button>
            </div>
            
            {formData.languages?.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Henüz dil eklenmemiş.</p>
                <button
                  type="button"
                  onClick={addLanguage}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <span className="mr-1">+</span>
                  Yabancı Dil Ekle
                </button>
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleLanguageDragEnd}
              >
                <SortableContext items={formData.languages?.map(lang => lang.id) || []} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {formData.languages?.map((lang, index) => (
                      <SortableItem key={lang.id} id={lang.id}>
                        <div className="border rounded-lg p-4 pl-10">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-gray-700">Dil #{index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeLanguage(index)}
                              className="text-red-500 hover:text-red-700"
                              title="Sil"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Yabancı Dil Türü</label>
                        <input
                          type="text"
                          value={lang.name}
                          onChange={(e) => {
                            const updatedLanguages = [...(formData.languages || [])];
                            updatedLanguages[index] = { ...updatedLanguages[index], name: e.target.value };
                            setFormData(prev => ({ ...prev, languages: updatedLanguages }));
                          }}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sınav Türü</label>
                        <input
                          type="text"
                          value={lang.examType || ''}
                          onChange={(e) => {
                            const updatedLanguages = [...(formData.languages || [])];
                            updatedLanguages[index] = { ...updatedLanguages[index], examType: e.target.value };
                            setFormData(prev => ({ ...prev, languages: updatedLanguages }));
                          }}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Belge Tarihi</label>
                        <input
                          type="date"
                          value={lang.certificateDate ? lang.certificateDate.split('-').reverse().join('-') : ''}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            const formattedDate = selectedDate ? selectedDate.split('-').reverse().join('-') : '';
                            const updatedLanguages = [...(formData.languages || [])];
                            updatedLanguages[index] = { ...updatedLanguages[index], certificateDate: formattedDate };
                            setFormData(prev => ({ ...prev, languages: updatedLanguages }));
                          }}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sınav Puanı</label>
                        <input
                          type="text"
                          value={lang.examScore || ''}
                          onChange={(e) => {
                            const updatedLanguages = [...(formData.languages || [])];
                            updatedLanguages[index] = { ...updatedLanguages[index], examScore: e.target.value };
                            setFormData(prev => ({ ...prev, languages: updatedLanguages }));
                          }}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Yayın ve Makale Bilgileri</h3>
              <button
                type="button"
                onClick={addPublication}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Yayın Ekle
              </button>
            </div>
            
            {formData.publications?.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Henüz yayın eklenmemiş.</p>
                <button
                  type="button"
                  onClick={addPublication}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <span className="mr-1">+</span>
                  Yayın Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.publications?.map((pub, index) => (
                  <div key={pub.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-700">Yayın #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removePublication(index)}
                        className="text-red-500 hover:text-red-700"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Yayın Adı</label>
                        <input
                          type="text"
                          value={pub.title}
                          onChange={(e) => updatePublication(index, 'title', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Yayın Tarihi</label>
                        <input
                          type="date"
                          value={pub.publishDate ? pub.publishDate.split('-').reverse().join('-') : ''}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            const formattedDate = selectedDate ? selectedDate.split('-').reverse().join('-') : '';
                            updatePublication(index, 'publishDate', formattedDate);
                          }}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Yayınlayıcı</label>
                        <input
                          type="text"
                          value={pub.publisher}
                          onChange={(e) => updatePublication(index, 'publisher', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                      <textarea
                        value={pub.description}
                        onChange={(e) => updatePublication(index, 'description', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 8:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Ödül ve Başarı Bilgileri</h3>
              <button
                type="button"
                onClick={addAward}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Ödül Ekle
              </button>
            </div>
            
            {formData.awards?.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Henüz ödül eklenmemiş.</p>
                <button
                  type="button"
                  onClick={addAward}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <span className="mr-1">+</span>
                  Ödül Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.awards?.map((award, index) => (
                  <div key={award.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-700">Ödül #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeAward(index)}
                        className="text-red-500 hover:text-red-700"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Ödül Adı</label>
                        <input
                          type="text"
                          value={award.title}
                          onChange={(e) => updateAward(index, 'title', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Kurum</label>
                        <input
                          type="text"
                          value={award.organization}
                          onChange={(e) => updateAward(index, 'organization', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tarih</label>
                        <input
                          type="date"
                          value={award.date ? award.date.split('-').reverse().join('-') : ''}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            const formattedDate = selectedDate ? selectedDate.split('-').reverse().join('-') : '';
                            updateAward(index, 'date', formattedDate);
                          }}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                        <textarea
                          value={award.description}
                          onChange={(e) => updateAward(index, 'description', e.target.value)}
                          rows={3}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 9:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Referans Bilgileri</h3>
              <button
                type="button"
                onClick={addReference}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Referans Ekle
              </button>
            </div>
            
            {formData.references?.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Henüz referans eklenmemiş.</p>
                <button
                  type="button"
                  onClick={addReference}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <span className="mr-1">+</span>
                  Referans Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.references?.map((ref, index) => (
                  <div key={ref.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-700">Referans #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeReference(index)}
                        className="text-red-500 hover:text-red-700"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">İsim</label>
                        <input
                          type="text"
                          value={ref.name}
                          onChange={(e) => updateReference(index, 'name', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Şirket</label>
                        <input
                          type="text"
                          value={ref.company}
                          onChange={(e) => updateReference(index, 'company', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Telefon</label>
                        <input
                          type="tel"
                          value={ref.phone}
                          onChange={(e) => updateReference(index, 'phone', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Profesyonel/Kişisel</label>
                        <input
                          type="text"
                          value={ref.type}
                          onChange={(e) => updateReference(index, 'type', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 10:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Hobi ve İlgi Alanları</h3>
              <button
                type="button"
                onClick={addHobby}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Hobi Ekle
              </button>
            </div>
            
            {formData.hobbies?.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Henüz hobi eklenmemiş.</p>
                <button
                  type="button"
                  onClick={addHobby}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <span className="mr-1">+</span>
                  Hobi Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.hobbies?.map((hobby, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-700">Hobi #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeHobby(index)}
                        className="text-red-500 hover:text-red-700"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Kategori</label>
                        <select
                          value={hobby.category}
                          onChange={(e) => updateHobby(index, 'category', e.target.value)}
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        >
                          <option value="Kültür">Kültür</option>
                          <option value="Sanat">Sanat</option>
                          <option value="Spor">Spor</option>
                          <option value="Müzik">Müzik</option>
                          <option value="Gezi">Gezi</option>
                          <option value="Etkinlik">Etkinlik</option>
                          <option value="Dernek – Vakıf Faaliyetleri">Dernek – Vakıf Faaliyetleri</option>
                          <option value="Bilgisayar Oyunları">Bilgisayar Oyunları</option>
                          <option value="Grafik Tasarım">Grafik Tasarım</option>
                          <option value="Diğer">Diğer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {hobby.category === 'Diğer' ? 'Özel Hobi/İlgi Alanı' : 'Detay/Açıklama'}
                        </label>
                        <input
                          type="text"
                          value={hobby.customValue || ''}
                          onChange={(e) => updateHobby(index, 'customValue', e.target.value)}
                          placeholder={
                            hobby.category === 'Diğer' 
                              ? "Hobi/ilgi alanınızı yazınız..." 
                              : `${hobby.category} ile ilgili detay yazınız...`
                          }
                          className="mt-1 block w-full bg-white border-2 border-gray-300 rounded-lg shadow-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white bg-opacity-95 shadow-lg rounded-lg px-8 py-10 backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8" style={{ fontFamily: 'Bahnschrift Light, Arial, sans-serif' }}>Özgeçmiş</h2>
          
          {/* Progress bar */}
          <div className="mb-8">
            <div className="grid grid-cols-10 gap-1 text-xs font-medium text-gray-600 mb-4">
              <div 
                onClick={() => setCurrentStep(1)}
                className={`text-center p-3 rounded cursor-pointer transition-all duration-300 hover:bg-blue-50 ${currentStep === 1 ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === 1 
                    ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                    : 'bg-gray-200 text-gray-600 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-105'
                }`}>
                  <span className="text-sm font-bold">1</span>
                </div>
                <span className="block text-xs">Kişisel</span>
              </div>
              <div 
                onClick={() => setCurrentStep(2)}
                className={`text-center p-3 rounded cursor-pointer transition-all duration-300 hover:bg-blue-50 ${currentStep === 2 ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === 2 
                    ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                    : 'bg-gray-200 text-gray-600 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-105'
                }`}>
                  <span className="text-sm font-bold">2</span>
                </div>
                <span className="block text-xs">Öğrenim</span>
              </div>
              <div 
                onClick={() => setCurrentStep(3)}
                className={`text-center p-3 rounded cursor-pointer transition-all duration-300 hover:bg-blue-50 ${currentStep === 3 ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === 3 
                    ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                    : 'bg-gray-200 text-gray-600 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-105'
                }`}>
                  <span className="text-sm font-bold">3</span>
                </div>
                <span className="block text-xs">Deneyim</span>
              </div>
              <div 
                onClick={() => setCurrentStep(4)}
                className={`text-center p-3 rounded cursor-pointer transition-all duration-300 hover:bg-blue-50 ${currentStep === 4 ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === 4 
                    ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                    : 'bg-gray-200 text-gray-600 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-105'
                }`}>
                  <span className="text-sm font-bold">4</span>
                </div>
                <span className="block text-xs">Yetenek ve Yetkinlikler</span>
              </div>
              <div 
                onClick={() => setCurrentStep(5)}
                className={`text-center p-3 rounded cursor-pointer transition-all duration-300 hover:bg-blue-50 ${currentStep === 5 ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === 5 
                    ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                    : 'bg-gray-200 text-gray-600 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-105'
                }`}>
                  <span className="text-sm font-bold">5</span>
                </div>
                <span className="block text-xs">Sertifika ve Eğitimler</span>
              </div>
              <div 
                onClick={() => setCurrentStep(6)}
                className={`text-center p-3 rounded cursor-pointer transition-all duration-300 hover:bg-blue-50 ${currentStep === 6 ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === 6 
                    ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                    : 'bg-gray-200 text-gray-600 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-105'
                }`}>
                  <span className="text-sm font-bold">6</span>
                </div>
                <span className="block text-xs">Yabancı Dil</span>
              </div>
              <div 
                onClick={() => setCurrentStep(7)}
                className={`text-center p-3 rounded cursor-pointer transition-all duration-300 hover:bg-blue-50 ${currentStep === 7 ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === 7 
                    ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                    : 'bg-gray-200 text-gray-600 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-105'
                }`}>
                  <span className="text-sm font-bold">7</span>
                </div>
                <span className="block text-xs">Yayınlar ve Makaleler</span>
              </div>
              <div 
                onClick={() => setCurrentStep(8)}
                className={`text-center p-3 rounded cursor-pointer transition-all duration-300 hover:bg-blue-50 ${currentStep === 8 ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === 8 
                    ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                    : 'bg-gray-200 text-gray-600 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-105'
                }`}>
                  <span className="text-sm font-bold">8</span>
                </div>
                <span className="block text-xs">Ödül ve Başarılar</span>
              </div>
              <div 
                onClick={() => setCurrentStep(9)}
                className={`text-center p-3 rounded cursor-pointer transition-all duration-300 hover:bg-blue-50 ${currentStep === 9 ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === 9 
                    ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                    : 'bg-gray-200 text-gray-600 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-105'
                }`}>
                  <span className="text-sm font-bold">9</span>
                </div>
                <span className="block text-xs">Referans</span>
              </div>
              <div 
                onClick={() => setCurrentStep(10)}
                className={`text-center p-3 rounded cursor-pointer transition-all duration-300 hover:bg-blue-50 ${currentStep === 10 ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === 10 
                    ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                    : 'bg-gray-200 text-gray-600 hover:bg-blue-200 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-105'
                }`}>
                  <span className="text-sm font-bold">10</span>
                </div>
                <span className="block text-xs">Hobi ve İlgi Alanları</span>
              </div>

            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-8">
            {renderStep()}

            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Geri
              </button>

              <div className="flex space-x-3">
                {/* CV İndir butonu - her adımda görünür */}
                <button
                  type="button"
                  onClick={handleDownloadCV}
                  disabled={!formData.personalInfo?.firstName || !formData.personalInfo?.lastName}
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    !formData.personalInfo?.firstName || !formData.personalInfo?.lastName
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  title={!formData.personalInfo?.firstName || !formData.personalInfo?.lastName ? 'CV indirmek için ad soyad gerekli' : 'CV\'yi PDF olarak indir'}
                >
                  <Download className="h-4 w-4 mr-1" />
                  CV İndir
                </button>
                
                {currentStep < 10 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => Math.min(10, prev + 1))}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    İleri
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      await handleSubmit(e as any);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Kaydet ve Bitir
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVForm;
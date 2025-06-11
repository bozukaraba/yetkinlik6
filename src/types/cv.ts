export interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  summary?: string;
  profileImage?: string;
  sgkServiceDocument?: string; // SGK Hizmet Dökümü PDF dosyası
  gender?: 'Kadın' | 'Erkek';
  residenceCity?: string; // İkametgah ili
  residenceDistrict?: string; // İkametgah ilçesi
  maritalStatus?: 'bekar' | 'evli';
  militaryStatus?: 'yapıldı' | 'muaf' | 'tecilli' | 'yapılmadı';
  drivingLicense?: string[];
  linkedIn?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  github?: string;
  youtube?: string;
  tiktok?: string;
  discord?: string;
  telegram?: string;
  whatsapp?: string;
  snapchat?: string;
  pinterest?: string;
  reddit?: string;
  medium?: string;
  behance?: string;
  dribbble?: string;
  stackoverflow?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  educationLevel?: 'Ortaokul' | 'Lise' | 'Ön Lisans' | 'Lisans' | 'Yüksek Lisans' | 'Doktora';
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  gpa?: string;
  relevantCourses?: string[];
  projects?: string[];
  awards?: string[];
  sortOrder?: number;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string;
  workDuration?: string;
  projects?: string[];
  achievements?: string[];
  technologies?: string[];
  references?: {
    name: string;
    title: string;
    company: string;
    email?: string;
    phone?: string;
  }[];
  sortOrder?: number;
}

export interface Skill {
  id: string;
  name: string;
  level?: number; // 1-5
  category?: string;
  yearsOfExperience?: number;
  sortOrder?: number;
}

export interface Language {
  id: string;
  name: string;
  examType?: string;
  certificateDate?: string;
  examScore?: string;
  sortOrder?: number;
}

export interface Certificate {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  duration: string;
  sortOrder?: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  technologies?: string[];
  role?: string;
  achievements?: string[];
}

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  publishDate: string;
  publisher?: string;
  url?: string;
  description?: string;
  sortOrder?: number;
}

export interface Award {
  id: string;
  title: string;
  organization: string;
  date: string;
  description?: string;
  sortOrder?: number;
}

export interface Reference {
  id: string;
  name: string;
  company: string;
  phone: string;
  type: string;
  sortOrder?: number;
}

export interface Volunteer {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface Evaluation {
  workSatisfaction: number; // Türksat'ta çalışmaktan memnunum
  facilitiesSatisfaction: number; // Türksat'ın çalışma ile ilgili sağladığı imkânlardan memnunum
  longTermIntent: number; // Türksat'ta uzun süre çalışmak isterim
  recommendation: number; // Türksat'ı arkadaşlarıma tavsiye ederim
  applicationSatisfaction: number; // Yetkinlik-X uygulaması değerlendirmesi
}

export interface CVData {
  id?: string;
  userId: string;
  personalInfo?: PersonalInfo;
  education?: Education[];
  experience?: Experience[];
  skills?: Skill[];
  languages?: Language[];
  certificates?: Certificate[];
  projects?: Project[];
  publications?: Publication[];
  volunteer?: Volunteer[];
  references?: Reference[];
  hobbies?: string[];
  awards?: Award[];
  evaluation?: Evaluation;
  createdAt?: string;
  updatedAt?: string;
}
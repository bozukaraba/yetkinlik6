import { supabase } from '../lib/supabase';
import { CVData, PersonalInfo, Education, Experience, Skill, Language, Certificate, Award, Publication, Reference, Evaluation } from '../types/cv';

// Helper function to convert date format from DD-MM-YYYY to YYYY-MM-DD
const convertDateFormat = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 2) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

// Helper function to convert date format from YYYY-MM-DD to DD-MM-YYYY
const convertDateFormatBack = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

// Get CV data from Supabase
export const getCVData = async (userId: string): Promise<CVData | null> => {
  try {
    // Get CV record
    const { data: cvData, error: cvError } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (cvError) {
      if (cvError.code === 'PGRST116') { // Not found
        return null;
      }
      throw cvError;
    }

    // Get all related data in parallel
    const [
      personalInfoResult,
      educationResult,
      experienceResult,
      skillsResult,
      languagesResult,
      certificatesResult,
      publicationsResult,
      referencesResult,
      hobbiesResult,
      awardsResult,
      evaluationResult
    ] = await Promise.all([
      supabase.from('personal_info').select('*').eq('cv_id', cvData.id).single(),
      supabase.from('education').select('*').eq('cv_id', cvData.id),
      supabase.from('experience').select('*').eq('cv_id', cvData.id),
      supabase.from('skills').select('*').eq('cv_id', cvData.id),
      supabase.from('languages').select('*').eq('cv_id', cvData.id),
      supabase.from('certificates').select('*').eq('cv_id', cvData.id),
      supabase.from('publications').select('*').eq('cv_id', cvData.id),
      supabase.from('user_references').select('*').eq('cv_id', cvData.id),
      supabase.from('hobbies').select('*').eq('cv_id', cvData.id),
      supabase.from('awards').select('*').eq('cv_id', cvData.id),
      supabase.from('evaluations').select('*').eq('cv_id', cvData.id).single()
    ]);

    // Build CV data object
    const cv: CVData = {
      id: cvData.id,
      userId: cvData.user_id,
      personalInfo: personalInfoResult.data ? {
        firstName: personalInfoResult.data.first_name,
        lastName: personalInfoResult.data.last_name,
        email: personalInfoResult.data.email,
        phone: personalInfoResult.data.phone,
        birthDate: personalInfoResult.data.birth_date ? convertDateFormatBack(personalInfoResult.data.birth_date) : '',
        address: personalInfoResult.data.address,
        city: personalInfoResult.data.city,
        postalCode: personalInfoResult.data.postal_code,
        country: personalInfoResult.data.country,
        summary: personalInfoResult.data.summary,
        maritalStatus: personalInfoResult.data.marital_status,
        militaryStatus: personalInfoResult.data.military_status,
        drivingLicense: personalInfoResult.data.driving_license || [],
        profileImage: personalInfoResult.data.profile_image,
        sgkServiceDocument: personalInfoResult.data.sgk_service_document,
        linkedIn: personalInfoResult.data.linkedin,
        github: personalInfoResult.data.github,
        twitter: personalInfoResult.data.twitter,
        instagram: personalInfoResult.data.instagram,
        facebook: personalInfoResult.data.facebook,
        youtube: personalInfoResult.data.youtube,
        tiktok: personalInfoResult.data.tiktok,
        discord: personalInfoResult.data.discord,
        telegram: personalInfoResult.data.telegram,
        whatsapp: personalInfoResult.data.whatsapp,
        medium: personalInfoResult.data.medium,
        behance: personalInfoResult.data.behance,
        dribbble: personalInfoResult.data.dribbble,
        stackoverflow: personalInfoResult.data.stackoverflow,
        website: personalInfoResult.data.website
      } : undefined,
      education: educationResult.data?.map(edu => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.field_of_study,
        startDate: edu.start_date ? convertDateFormatBack(edu.start_date) : '',
        endDate: edu.end_date ? convertDateFormatBack(edu.end_date) : '',
        current: edu.current,
        description: edu.description
      })) || [],
      experience: experienceResult.data?.map(exp => ({
        id: exp.id,
        title: exp.title,
        company: exp.company,
        startDate: exp.start_date ? convertDateFormatBack(exp.start_date) : '',
        endDate: exp.end_date ? convertDateFormatBack(exp.end_date) : '',
        current: exp.current,
        description: exp.description,
        workDuration: exp.work_duration
      })) || [],
      skills: skillsResult.data?.map(skill => ({
        id: skill.id,
        name: skill.name,
        level: skill.level,
        category: skill.category,
        yearsOfExperience: skill.years_of_experience
      })) || [],
      languages: languagesResult.data?.map(lang => ({
        id: lang.id,
        name: lang.name,
        examType: lang.exam_type,
        certificateDate: lang.certificate_date ? convertDateFormatBack(lang.certificate_date) : '',
        examScore: lang.exam_score
      })) || [],
      certificates: certificatesResult.data?.map(cert => ({
        id: cert.id,
        name: cert.name,
        startDate: cert.start_date ? convertDateFormatBack(cert.start_date) : '',
        endDate: cert.end_date ? convertDateFormatBack(cert.end_date) : '',
        duration: cert.duration
      })) || [],
      publications: publicationsResult.data?.map(pub => ({
        id: pub.id,
        title: pub.title,
        authors: pub.authors || [],
        publishDate: pub.publish_date ? convertDateFormatBack(pub.publish_date) : '',
        publisher: pub.publisher,
        url: pub.url,
        description: pub.description
      })) || [],
      references: referencesResult.data?.map(ref => ({
        id: ref.id,
        name: ref.name,
        company: ref.company,
        phone: ref.phone,
        type: ref.type
      })) || [],
      hobbies: hobbiesResult.data?.map(hobby => hobby.name) || [],
      awards: awardsResult.data?.map(award => ({
        id: award.id,
        title: award.title,
        organization: award.organization,
        date: award.date ? convertDateFormatBack(award.date) : '',
        description: award.description
      })) || [],
      evaluation: evaluationResult.data ? {
        workSatisfaction: evaluationResult.data.work_satisfaction,
        facilitiesSatisfaction: evaluationResult.data.facilities_satisfaction,
        longTermIntent: evaluationResult.data.long_term_intent,
        recommendation: evaluationResult.data.recommendation,
        applicationSatisfaction: evaluationResult.data.application_satisfaction
      } : {
        workSatisfaction: 0,
        facilitiesSatisfaction: 0,
        longTermIntent: 0,
        recommendation: 0,
        applicationSatisfaction: 0
      },
      createdAt: cvData.created_at,
      updatedAt: cvData.updated_at
    };

    return cv;
  } catch (error) {
    console.error('CV verisi yüklenirken hata:', error);
    throw error;
  }
};

// Save CV data to Supabase
export const saveCVData = async (userId: string, data: CVData): Promise<CVData> => {
  try {
    console.log('=== saveCVData BAŞLADI ===');
    console.log('saveCVData called for user:', userId);
    console.log('Data received:', { 
      hasPersonalInfo: !!data.personalInfo,
      educationCount: data.education?.length || 0,
      experienceCount: data.experience?.length || 0,
      skillsCount: data.skills?.length || 0,
      hasEvaluation: !!data.evaluation
    });
    
    // Check authentication in multiple ways
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('Session check:', !!session);
    console.log('User check:', !!user);
    console.log('User ID from auth:', user?.id);
    console.log('User ID from param:', userId);
    
    if (!session || !user) {
      console.error('No active session or user found');
      throw new Error('Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
    }
    
    if (user.id !== userId) {
      console.error('User ID mismatch:', { authUserId: user.id, paramUserId: userId });
      throw new Error('Kullanıcı ID eşleşmiyor');
    }

    // Check if user exists in users table, if not create it
    console.log('Checking if user exists in users table...');
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist, create it
      console.log('User not found in users table, creating...');
      const { error: userCreateError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          role: 'user'
        });

      if (userCreateError) {
        console.error('Failed to create user in users table:', userCreateError);
        throw new Error('Kullanıcı profili oluşturulamadı');
      }
      console.log('User created successfully in users table');
    } else if (userCheckError) {
      console.error('Error checking user existence:', userCheckError);
      throw userCheckError;
    } else {
      console.log('User exists in users table');
    }

    // Create or get CV record
    let cvId = data.id;
    if (!cvId) {
      console.log('Creating new CV record');
      const { data: cvData, error: cvError } = await supabase
        .from('cvs')
        .insert({ user_id: userId })
        .select()
        .single();

      if (cvError) {
        console.error('CV creation error:', cvError);
        throw cvError;
      }
      cvId = cvData.id;
      console.log('New CV created with ID:', cvId);
    } else {
      console.log('Updating existing CV:', cvId);
      const { error: cvUpdateError } = await supabase
        .from('cvs')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', cvId);

      if (cvUpdateError) {
        console.error('CV update error:', cvUpdateError);
        throw cvUpdateError;
      }
      console.log('CV updated successfully');
    }

    // Save personal info using upsert
    if (data.personalInfo) {
      console.log('=== PERSONAL INFO KAYDETME BAŞLADI ===');
      const personalData = {
        cv_id: cvId,
        first_name: data.personalInfo.firstName,
        last_name: data.personalInfo.lastName,
        email: data.personalInfo.email,
        phone: data.personalInfo.phone,
        birth_date: data.personalInfo.birthDate ? convertDateFormat(data.personalInfo.birthDate) : null,
        address: data.personalInfo.address,
        city: data.personalInfo.city,
        postal_code: data.personalInfo.postalCode,
        country: data.personalInfo.country,
        summary: data.personalInfo.summary,
        marital_status: data.personalInfo.maritalStatus,
        military_status: data.personalInfo.militaryStatus,
        driving_license: data.personalInfo.drivingLicense,
        profile_image: data.personalInfo.profileImage,
        sgk_service_document: data.personalInfo.sgkServiceDocument,
        linkedin: data.personalInfo.linkedIn,
        github: data.personalInfo.github,
        twitter: data.personalInfo.twitter,
        instagram: data.personalInfo.instagram,
        facebook: data.personalInfo.facebook,
        youtube: data.personalInfo.youtube,
        tiktok: data.personalInfo.tiktok,
        discord: data.personalInfo.discord,
        telegram: data.personalInfo.telegram,
        whatsapp: data.personalInfo.whatsapp,
        medium: data.personalInfo.medium,
        behance: data.personalInfo.behance,
        dribbble: data.personalInfo.dribbble,
        stackoverflow: data.personalInfo.stackoverflow,
        website: data.personalInfo.website
      };

      console.log('Personal data to save:', personalData);

      const { error: personalError } = await supabase
        .from('personal_info')
        .upsert(personalData, { onConflict: 'cv_id' });

      if (personalError) {
        console.error('Personal info save error:', personalError);
        throw personalError;
      }
      console.log('=== PERSONAL INFO KAYDEDILDI ===');
    }

    // Helper function to safely update array data
    const updateArrayData = async (tableName: string, dataArray: any[] | undefined, mapFunction: (item: any, index: number) => any) => {
      console.log(`=== ${tableName.toUpperCase()} GÜNCELLEME BAŞLADI ===`);
      console.log(`${tableName} data count:`, dataArray?.length || 0);
      
      if (!dataArray || dataArray.length === 0) {
        // If no data, delete existing records
        console.log(`No ${tableName} data, deleting existing records...`);
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('cv_id', cvId);
        
        if (deleteError) {
          console.error(`Error deleting ${tableName}:`, deleteError);
          throw deleteError;
        }
        console.log(`${tableName} existing records deleted`);
        return;
      }

      // Get existing records
      console.log(`Fetching existing ${tableName} records...`);
      const { data: existingData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('cv_id', cvId);

      if (fetchError) {
        console.error(`Error fetching existing ${tableName}:`, fetchError);
        throw fetchError;
      }

      console.log(`Found ${existingData?.length || 0} existing ${tableName} records`);

      // Prepare new data with cv_id
      const newData = dataArray.map((item, index) => mapFunction(item, index));
      console.log(`Prepared ${newData.length} new ${tableName} records`);

      // Delete existing records
      console.log(`Deleting existing ${tableName} records...`);
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('cv_id', cvId);

      if (deleteError) {
        console.error(`Error deleting ${tableName}:`, deleteError);
        throw deleteError;
      }

      // Insert new data
      console.log(`Inserting new ${tableName} records...`);
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(newData);

      if (insertError) {
        console.error(`Error inserting ${tableName}:`, insertError);
        throw insertError;
      }

      console.log(`=== ${tableName.toUpperCase()} BAŞARIYLA GÜNCELLENDİ ===`);
    };

    // Update all array data
    await updateArrayData('education', data.education, (edu) => ({
      cv_id: cvId,
      institution: edu.institution,
      degree: edu.degree,
      field_of_study: edu.fieldOfStudy,
      start_date: edu.startDate ? convertDateFormat(edu.startDate) : null,
      end_date: edu.endDate ? convertDateFormat(edu.endDate) : null,
      current: edu.current,
      description: edu.description
    }));

    await updateArrayData('experience', data.experience, (exp) => ({
      cv_id: cvId,
      title: exp.title,
      company: exp.company,
      start_date: exp.startDate ? convertDateFormat(exp.startDate) : null,
      end_date: exp.endDate ? convertDateFormat(exp.endDate) : null,
      current: exp.current,
      description: exp.description,
      work_duration: exp.workDuration
    }));

    await updateArrayData('skills', data.skills, (skill) => ({
      cv_id: cvId,
      name: skill.name,
      level: skill.level,
      category: skill.category,
      years_of_experience: skill.yearsOfExperience
    }));

    await updateArrayData('languages', data.languages, (lang) => ({
      cv_id: cvId,
      name: lang.name,
      exam_type: lang.examType,
      certificate_date: lang.certificateDate ? convertDateFormat(lang.certificateDate) : null,
      exam_score: lang.examScore
    }));

    await updateArrayData('certificates', data.certificates, (cert) => ({
      cv_id: cvId,
      name: cert.name,
      start_date: cert.startDate ? convertDateFormat(cert.startDate) : null,
      end_date: cert.endDate ? convertDateFormat(cert.endDate) : null,
      duration: cert.duration
    }));

    await updateArrayData('publications', data.publications, (pub) => ({
      cv_id: cvId,
      title: pub.title,
      authors: pub.authors,
      publish_date: pub.publishDate ? convertDateFormat(pub.publishDate) : null,
      publisher: pub.publisher,
      url: pub.url,
      description: pub.description
    }));

    await updateArrayData('user_references', data.references, (ref) => ({
      cv_id: cvId,
      name: ref.name,
      company: ref.company,
      phone: ref.phone,
      type: ref.type
    }));

    await updateArrayData('hobbies', data.hobbies, (hobby) => ({
      cv_id: cvId,
      name: hobby
    }));

    await updateArrayData('awards', data.awards, (award) => ({
      cv_id: cvId,
      title: award.title,
      organization: award.organization,
      date: award.date ? convertDateFormat(award.date) : null,
      description: award.description
    }));

    // Save evaluation using manual check and update
    if (data.evaluation) {
      console.log('=== EVALUATION KAYDETME BAŞLADI ===');
      const evaluationData = {
        cv_id: cvId,
        work_satisfaction: data.evaluation.workSatisfaction,
        facilities_satisfaction: data.evaluation.facilitiesSatisfaction,
        long_term_intent: data.evaluation.longTermIntent,
        recommendation: data.evaluation.recommendation,
        application_satisfaction: data.evaluation.applicationSatisfaction
      };

      console.log('Evaluation data to save:', evaluationData);

      // Check if evaluation exists
      console.log('Checking if evaluation exists...');
      const { data: existingEval, error: checkError } = await supabase
        .from('evaluations')
        .select('id')
        .eq('cv_id', cvId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing evaluation:', checkError);
        throw checkError;
      }

      if (existingEval) {
        // Update existing evaluation
        console.log('Updating existing evaluation...');
        const { error: updateError } = await supabase
          .from('evaluations')
          .update(evaluationData)
          .eq('cv_id', cvId);

        if (updateError) {
          console.error('Evaluation update error:', updateError);
          throw updateError;
        }
        console.log('=== EVALUATION GÜNCELLENDI ===');
      } else {
        // Insert new evaluation
        console.log('Inserting new evaluation...');
        const { error: insertError } = await supabase
          .from('evaluations')
          .insert(evaluationData);

        if (insertError) {
          console.error('Evaluation insert error:', insertError);
          throw insertError;
        }
        console.log('=== EVALUATION EKLENDİ ===');
      }
    }

    console.log('=== CV KAYDETME TAMAMLANDI ===');
    console.log('CV saved successfully, fetching updated data...');
    // Return updated CV data
    const updatedCV = await getCVData(userId);
    console.log('Updated CV fetched:', !!updatedCV);
    return updatedCV || data;
  } catch (error) {
    console.error('CV kaydedilirken hata:', error);
    throw error;
  }
};

// Create or update CV
export const createCV = async (data: CVData): Promise<CVData> => {
  if (!data.userId) {
    throw new Error('CV oluşturmak için kullanıcı ID gerekli');
  }
  
  return saveCVData(data.userId, data);
};

// Get all CVs (admin only)
export const getAllCVs = async (): Promise<CVData[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      throw new Error('Bu işlem için admin yetkisi gerekli');
    }

    const { data: cvs, error } = await supabase
      .from('cvs')
      .select(`
        *,
        personal_info(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const allCVs: CVData[] = [];
    
    for (const cv of cvs || []) {
      const fullCV = await getCVData(cv.user_id);
      if (fullCV) {
        allCVs.push(fullCV);
      }
    }

    return allCVs;
  } catch (error) {
    console.error('CV\'ler yüklenirken hata:', error);
    throw error;
  }
};

// Search CVs by keywords (admin only)
export const searchCVsByKeywords = async (keywords: string[]): Promise<CVData[]> => {
  const allCVs = await getAllCVs();
  
  if (keywords.length === 0) {
    return allCVs;
  }
  
  return allCVs.filter(cv => {
    return keywords.every(keyword => {
      const keywordLower = keyword.toLowerCase().trim();
      
      // Search in personal info
      const personalInfo = cv.personalInfo;
      if (personalInfo) {
        if (personalInfo.firstName?.toLowerCase().includes(keywordLower) ||
            personalInfo.lastName?.toLowerCase().includes(keywordLower) ||
            personalInfo.email?.toLowerCase().includes(keywordLower) ||
            personalInfo.city?.toLowerCase().includes(keywordLower) ||
            personalInfo.summary?.toLowerCase().includes(keywordLower)) {
          return true;
        }
      }
      
      // Search in skills
      if (cv.skills?.some(skill => skill.name?.toLowerCase().includes(keywordLower) ||
                                  skill.category?.toLowerCase().includes(keywordLower))) {
        return true;
      }
      
      // Search in experience
      if (cv.experience?.some(exp => exp.title?.toLowerCase().includes(keywordLower) ||
                                    exp.company?.toLowerCase().includes(keywordLower) ||
                                    exp.description?.toLowerCase().includes(keywordLower))) {
        return true;
      }
      
      // Search in education
      if (cv.education?.some(edu => edu.institution?.toLowerCase().includes(keywordLower) ||
                                   edu.degree?.toLowerCase().includes(keywordLower) ||
                                   edu.fieldOfStudy?.toLowerCase().includes(keywordLower))) {
        return true;
      }
      
      return false;
    });
  });
};
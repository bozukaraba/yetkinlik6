-- Yetkinlikx CV Management System Database Schema
-- Supabase SQL Editor ile çalıştırılacak

-- 1. Kullanıcılar tablosu (Users)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CV'ler tablosu (CVs)
CREATE TABLE cvs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Kişisel Bilgiler tablosu (Personal Info)
CREATE TABLE personal_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    birth_date DATE,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Türkiye',
    summary TEXT,
    marital_status VARCHAR(20) CHECK (marital_status IN ('bekar', 'evli')),
    military_status VARCHAR(20) CHECK (military_status IN ('yapılmadı', 'yapıldı', 'muaf', 'tecilli')),
    driving_license TEXT[], -- Array of driving license types
    profile_image TEXT, -- Base64 encoded image
    sgk_service_document TEXT, -- Base64 encoded PDF
    -- Social Media Fields
    linkedin VARCHAR(255),
    github VARCHAR(255),
    twitter VARCHAR(255),
    instagram VARCHAR(255),
    facebook VARCHAR(255),
    youtube VARCHAR(255),
    tiktok VARCHAR(255),
    discord VARCHAR(255),
    telegram VARCHAR(255),
    whatsapp VARCHAR(255),
    medium VARCHAR(255),
    behance VARCHAR(255),
    dribbble VARCHAR(255),
    stackoverflow VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Eğitim tablosu (Education)
CREATE TABLE education (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_date DATE,
    end_date DATE,
    current BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. İş Deneyimi tablosu (Experience)
CREATE TABLE experience (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    current BOOLEAN DEFAULT false,
    description TEXT,
    work_duration VARCHAR(100), -- e.g., "2 yıl 6 ay"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Yetenekler tablosu (Skills)
CREATE TABLE skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    level DECIMAL(2,1) CHECK (level >= 1 AND level <= 5), -- 1.0 to 5.0
    category VARCHAR(255),
    years_of_experience INTEGER DEFAULT 0 CHECK (years_of_experience >= 0 AND years_of_experience <= 50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Diller tablosu (Languages)
CREATE TABLE languages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(255),
    certificate_date DATE,
    exam_score VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Sertifikalar tablosu (Certificates)
CREATE TABLE certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    duration VARCHAR(100), -- e.g., "40 saat"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Projeler tablosu (Projects)
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    technologies TEXT[],
    start_date DATE,
    end_date DATE,
    url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Yayınlar tablosu (Publications)
CREATE TABLE publications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    authors TEXT[],
    publish_date DATE,
    publisher VARCHAR(255),
    url VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Gönüllülük tablosu (Volunteer)
CREATE TABLE volunteer (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    organization VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    current BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Referanslar tablosu (References)
CREATE TABLE user_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(20),
    type VARCHAR(100), -- e.g., "profesyonel", "kişisel"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Hobiler tablosu (Hobbies)
CREATE TABLE hobbies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Ödüller tablosu (Awards)
CREATE TABLE awards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Değerlendirmeler tablosu (Evaluations)
CREATE TABLE evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    work_satisfaction INTEGER CHECK (work_satisfaction >= 0 AND work_satisfaction <= 5),
    facilities_satisfaction INTEGER CHECK (facilities_satisfaction >= 0 AND facilities_satisfaction <= 5),
    long_term_intent INTEGER CHECK (long_term_intent >= 0 AND long_term_intent <= 5),
    recommendation INTEGER CHECK (recommendation >= 0 AND recommendation <= 5),
    application_satisfaction INTEGER CHECK (application_satisfaction >= 0 AND application_satisfaction <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler oluştur
CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_personal_info_cv_id ON personal_info(cv_id);
CREATE INDEX idx_education_cv_id ON education(cv_id);
CREATE INDEX idx_experience_cv_id ON experience(cv_id);
CREATE INDEX idx_skills_cv_id ON skills(cv_id);
CREATE INDEX idx_languages_cv_id ON languages(cv_id);
CREATE INDEX idx_certificates_cv_id ON certificates(cv_id);
CREATE INDEX idx_projects_cv_id ON projects(cv_id);
CREATE INDEX idx_publications_cv_id ON publications(cv_id);
CREATE INDEX idx_volunteer_cv_id ON volunteer(cv_id);
CREATE INDEX idx_user_references_cv_id ON user_references(cv_id);
CREATE INDEX idx_hobbies_cv_id ON hobbies(cv_id);
CREATE INDEX idx_awards_cv_id ON awards(cv_id);
CREATE INDEX idx_evaluations_cv_id ON evaluations(cv_id);

-- Updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger'ları ekle
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cvs_updated_at BEFORE UPDATE ON cvs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_info_updated_at BEFORE UPDATE ON personal_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON education FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experience_updated_at BEFORE UPDATE ON experience FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON languages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_publications_updated_at BEFORE UPDATE ON publications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volunteer_updated_at BEFORE UPDATE ON volunteer FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_references_updated_at BEFORE UPDATE ON user_references FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hobbies_updated_at BEFORE UPDATE ON hobbies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_awards_updated_at BEFORE UPDATE ON awards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) politikaları
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi verilerini görebilir
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- CV'ler için politikalar
CREATE POLICY "Users can view own CVs" ON cvs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own CVs" ON cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own CVs" ON cvs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own CVs" ON cvs FOR DELETE USING (auth.uid() = user_id);

-- Diğer tablolar için politikalar (CV sahibi kontrolü)
CREATE POLICY "Users can manage own CV data" ON personal_info FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = personal_info.cv_id AND cvs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own education" ON education FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = education.cv_id AND cvs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own experience" ON experience FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = experience.cv_id AND cvs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own skills" ON skills FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = skills.cv_id AND cvs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own languages" ON languages FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = languages.cv_id AND cvs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own certificates" ON certificates FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = certificates.cv_id AND cvs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own projects" ON projects FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = projects.cv_id AND cvs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own publications" ON publications FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = publications.cv_id AND cvs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own volunteer" ON volunteer FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = volunteer.cv_id AND cvs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own references" ON user_references FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = user_references.cv_id AND cvs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own hobbies" ON hobbies FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = hobbies.cv_id AND cvs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own awards" ON awards FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = awards.cv_id AND cvs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own evaluations" ON evaluations FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = evaluations.cv_id AND cvs.user_id = auth.uid())
);

-- Admin kullanıcıları için tüm verilere erişim politikaları
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can view all CVs" ON cvs FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Admin view'leri oluştur
CREATE VIEW admin_cv_overview AS
SELECT 
    c.id as cv_id,
    u.first_name || ' ' || u.last_name as user_name,
    u.email as user_email,
    pi.first_name || ' ' || pi.last_name as cv_name,
    pi.email as cv_email,
    pi.phone,
    pi.city,
    c.created_at,
    c.updated_at
FROM cvs c
JOIN users u ON c.user_id = u.id
LEFT JOIN personal_info pi ON c.id = pi.cv_id;

-- İstatistik view'i
CREATE VIEW cv_statistics AS
SELECT 
    COUNT(DISTINCT c.id) as total_cvs,
    COUNT(DISTINCT c.user_id) as total_users,
    COUNT(DISTINCT e.id) as total_experiences,
    COUNT(DISTINCT ed.id) as total_educations,
    COUNT(DISTINCT s.id) as total_skills,
    COUNT(DISTINCT l.id) as total_languages,
    COUNT(DISTINCT cert.id) as total_certificates,
    COUNT(DISTINCT a.id) as total_awards,
    COUNT(DISTINCT ev.id) as total_evaluations
FROM cvs c
LEFT JOIN experience e ON c.id = e.cv_id
LEFT JOIN education ed ON c.id = ed.cv_id
LEFT JOIN skills s ON c.id = s.cv_id
LEFT JOIN languages l ON c.id = l.cv_id
LEFT JOIN certificates cert ON c.id = cert.cv_id
LEFT JOIN awards a ON c.id = a.cv_id
LEFT JOIN evaluations ev ON c.id = ev.cv_id;

-- Test verisi için örnek admin kullanıcı (şifreyi değiştirmeyi unutmayın!)
INSERT INTO users (email, password_hash, first_name, last_name, role) 
VALUES ('admin@yetkinlikx.com', crypt('admin123', gen_salt('bf')), 'Admin', 'User', 'admin');

-- Başarılı kurulum mesajı
DO $$
BEGIN
    RAISE NOTICE 'Yetkinlikx CV Management System veritabanı başarıyla oluşturuldu!';
    RAISE NOTICE 'Admin kullanıcı: admin@yetkinlikx.com / admin123';
    RAISE NOTICE 'Lütfen admin şifresini değiştirmeyi unutmayın!';
END $$; 
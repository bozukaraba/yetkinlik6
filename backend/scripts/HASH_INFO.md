# HASH BİLGİLERİ - VERİTABANI GÖREVLİSİ İÇİN

## Password Hash Formatı
- **Algoritma**: bcrypt 
- **Cost Factor**: 10
- **Format**: $2a$10$[salt][hash]

## Test Hash Değerleri

### test123 şifresi için:
```
$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
```

### admin123 şifresi için:
```
$2a$10$CwTycUXWue0Thq9StjUM0uJ1/jW5eRmy.B6YYL4JgGAcYlnm.L/hy
```

### turksat2024 şifresi için:
```
$2a$10$N9qo8uLOickgx2ZWhzSkkOGBwxXoKg.M4GNMWgVYqWf5FzH1p1I2e
```

## Kullanım
1. `password_hash` kolonu VARCHAR(255) olarak oluşturulmalı
2. Hash değeri bu kolona string olarak kaydedilir
3. Backend bcrypt ile karşılaştırma yapar

## Örnek Test Kullanıcısı Ekleme
```sql
INSERT INTO users (id, email, password_hash, name, role, is_active) VALUES 
(gen_random_uuid(), 'admin@turksat.com.tr', '$2a$10$CwTycUXWue0Thq9StjUM0uJ1/jW5eRmy.B6YYL4JgGAcYlnm.L/hy', 'Admin User', 'admin', true);
```

Bu kullanıcı ile giriş yapabilir: email: admin@turksat.com.tr, şifre: admin123 
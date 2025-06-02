import React from 'react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 bg-opacity-95 backdrop-blur-sm text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-center md:text-left text-gray-300">
              &copy; {year} Yetkinlikx. Tüm hakları saklıdır.
            </p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Gizlilik Politikası
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Kullanım Şartları
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              İletişim
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
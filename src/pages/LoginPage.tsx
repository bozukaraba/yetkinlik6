import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, Lock, AlertCircle, Mail, X } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }
    
    try {
      setIsLoading(true);
      await login(email, password);
      // Navigation will be handled automatically by AuthContext
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    
    if (!resetEmail) {
      setResetError('Lütfen e-posta adresinizi girin');
      return;
    }
    
    try {
      setIsResetLoading(true);
      await resetPassword(resetEmail);
      setResetSuccess('Şifre sıfırlama e-postası gönderildi. E-posta kutunuzu kontrol edin.');
      setResetEmail('');
    } catch (err: any) {
      setResetError(err.message || 'Şifre sıfırlama e-postası gönderilemedi.');
      console.error(err);
    } finally {
      setIsResetLoading(false);
    }
  };

  const openResetModal = () => {
    setShowResetModal(true);
    setResetEmail('');
    setResetError('');
    setResetSuccess('');
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetEmail('');
    setResetError('');
    setResetSuccess('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Motivasyon Metni */}
        <div className="lg:order-1 order-2 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 lg:p-8 rounded-2xl shadow-lg backdrop-blur-sm border border-blue-200">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
              Bizim için çok değerlisiniz.
            </h3>
            <div className="space-y-4 leading-relaxed text-center">
              <p className="text-base text-black">
                Bu özgeçmiş, sizi daha yakından tanımamız ve birlikte daha iyi bir gelecek inşa etmemiz için önemli bir vesile.
              </p>
              <p className="text-base text-black">
                Deneyimleriniz, yetenekleriniz ve hedefleriniz bizim için kıymetli çünkü burada sadece iş değil, birlikte büyüyen bir aileyiz.
              </p>
              <p className="text-base text-black">
                Sizinle çalışmak bizim için büyük bir mutluluk ve onur. Bu sürecin bir parçası olduğunuz için teşekkür ederiz.
              </p>
              <blockquote className="border-l-4 border-blue-500 bg-white pl-4 py-3 rounded-r-lg shadow-sm">
                <p className="text-base text-gray-800 italic">
                  "Lütfen, kendinizi en iyi şekilde ifade edin ve mümkün olduğunca detaylı doldurun. Çünkü her bilgi, sizinle daha güçlü bir bağ kurmamıza ve gelişiminize destek olmamıza yardımcı olacak."
                </p>
              </blockquote>
              
              {/* Kahve Molası Bölümü */}
              <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                <div className="flex items-center justify-center space-x-4">
                  <img 
                    src="/kahve.png" 
                    alt="Kahve" 
                    className="w-12 h-12 object-contain opacity-80"
                  />
                  <p className="text-sm text-gray-700 italic text-center">
                    Bir kahve molası verip doldurmaya başlayabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="lg:order-2 order-1 max-w-md w-full mx-auto space-y-8 bg-white bg-opacity-95 p-8 rounded-lg shadow-md backdrop-blur-sm">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Hesabınıza Giriş Yapın
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Veya{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              yeni bir hesap oluşturun
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-posta adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="E-posta adresiniz"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="Şifreniz"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Beni hatırla
              </label>
            </div>

            <div className="text-sm">
              <button 
                type="button"
                onClick={openResetModal}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Şifremi unuttum
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading 
                  ? 'bg-blue-400' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Şifre Sıfırlama</h3>
              <button
                onClick={closeResetModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
            </p>

            {resetError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{resetError}</p>
              </div>
            )}

            {resetSuccess && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 flex items-center">
                <Mail className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-sm text-green-700">{resetSuccess}</p>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="resetEmail"
                    name="resetEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="E-posta adresinizi girin"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeResetModal}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isResetLoading}
                  className={`flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white ${
                    isResetLoading 
                      ? 'bg-blue-400' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {isResetLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Gönderiliyor...
                    </span>
                  ) : (
                    'E-posta Gönder'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
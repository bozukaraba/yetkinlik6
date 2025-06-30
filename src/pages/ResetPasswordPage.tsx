import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiService';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    token: searchParams.get('token') || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // URL'den token'ı al
    const token = searchParams.get('token');
    if (token) {
      setFormData(prev => ({ ...prev, token }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Şifreler eşleşmiyor');
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (!formData.token) {
      setMessage('Token gereklidir');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response: any = await apiClient.post('/auth/reset-password-confirm', {
        token: formData.token,
        newPassword: formData.newPassword
      });

      if (response.success) {
        setSuccess(true);
        setMessage('Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage(response.message || 'Bir hata oluştu');
      }
    } catch (error: any) {
      setMessage(error.message || 'Sunucu hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Şifre Sıfırla
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Yeni şifrenizi belirleyin
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Token Input (Development için görünür) */}
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                Token
              </label>
              <input
                id="token"
                name="token"
                type="text"
                value={formData.token}
                onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Reset token'ı buraya yapıştırın"
                required
              />
            </div>

            {/* Yeni Şifre */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Yeni Şifre
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Yeni şifrenizi girin"
                required
                minLength={6}
              />
            </div>

            {/* Şifre Tekrar */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Şifre Tekrar
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Şifrenizi tekrar girin"
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Mesaj */}
          {message && (
            <div className={`text-sm text-center ${success ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}

          {/* Gönder Butonu */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>
        </form>

        {/* Development Info */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800">🛠️ Development Mode</h3>
          <p className="mt-1 text-xs text-yellow-700">
            Console'dan token'ı alıp yukarıdaki alana yapıştırın
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 
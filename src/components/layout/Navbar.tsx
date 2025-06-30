import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircle, Menu, X, LogOut, FileEdit, Home } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [logoError, setLogoError] = React.useState(false);
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, navigate to login
      navigate('/login');
    }
  };

  return (
    <nav className="bg-white bg-opacity-95 backdrop-blur-sm shadow-md py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center cursor-default">
              {!logoError ? (
                <img 
                  src="/turksat-logo.png" 
                  alt="Türksat" 
                  className="h-12" 
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg font-bold text-xl tracking-wider">
                  Yetkinlikx
                </div>
              )}
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {currentUser ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                  <Home className="h-5 w-5 mr-1" />
                  <span>Panel</span>
                </Link>
                <Link to="/cv-form" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                  <FileEdit className="h-5 w-5 mr-1" />
                  <span>CV'im</span>
                </Link>
                {(currentUser.role === 'admin' || isAdmin()) && (
                  <>
                    <Link to="/admin" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                      📊 CV Yönetimi
                    </Link>
                    <Link to="/admin/users" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                      👥 Kullanıcı Yönetimi
                    </Link>
                  </>
                )}
                <div className="flex items-center">
                  <UserCircle className="h-5 w-5 text-gray-600 mr-1" />
                  <span className="text-gray-700">{currentUser.name}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Giriş
                </Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 space-y-3">
            {currentUser ? (
              <>
                <div className="flex items-center pb-3 border-b border-gray-200">
                  <UserCircle className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="text-gray-700">{currentUser.name}</span>
                </div>
                <Link 
                  to="/dashboard" 
                  className="block py-2 text-gray-600 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Panel
                </Link>
                <Link 
                  to="/cv-form" 
                  className="block py-2 text-gray-600 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  CV'im
                </Link>
                {(currentUser.role === 'admin' || isAdmin()) && (
                  <>
                    <Link 
                      to="/admin" 
                      className="block py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      📊 CV Yönetimi
                    </Link>
                    <Link 
                      to="/admin/users" 
                      className="block py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      👥 Kullanıcı Yönetimi
                    </Link>
                  </>
                )}
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block py-2 text-gray-600 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Giriş
                </Link>
                <Link 
                  to="/register" 
                  className="block py-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
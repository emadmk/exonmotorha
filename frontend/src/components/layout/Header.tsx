import { Link } from 'react-router-dom';
import { Bell, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils/helpers';
import { useAuthStore } from '../../stores/authStore';

interface HeaderProps {
  transparent?: boolean;
  showMenu?: boolean;
}

export function Header({ transparent, showMenu = true }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          transparent
            ? 'bg-transparent'
            : 'bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-gold rounded-xl flex items-center justify-center">
              <span className="text-dark-950 font-bold text-lg">اکسون</span>
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              اکسون موتور
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-dark-300 hover:text-white transition-colors">
              صفحه اصلی
            </Link>
            <a href="#services" className="text-dark-300 hover:text-white transition-colors">
              خدمات
            </a>
            <a href="#about" className="text-dark-300 hover:text-white transition-colors">
              درباره ما
            </a>
            <a href="#faq" className="text-dark-300 hover:text-white transition-colors">
              سوالات متداول
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/notifications"
                  className="relative p-2 text-dark-400 hover:text-white transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Link>
                <Link
                  to={user?.role === 'admin' ? '/admin' : user?.role === 'technician' ? '/technician' : '/dashboard'}
                  className="btn-primary py-2 px-4 text-sm hidden sm:block"
                >
                  داشبورد
                </Link>
              </>
            ) : (
              <Link to="/auth" className="btn-primary py-2 px-4 text-sm">
                ورود / ثبت‌نام
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            {showMenu && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-dark-400 hover:text-white"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <nav className="absolute top-16 left-0 right-0 bg-dark-900 border-b border-dark-700 p-4 animate-slide-down">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="text-white py-2"
              >
                صفحه اصلی
              </Link>
              <a
                href="#services"
                onClick={() => setIsMenuOpen(false)}
                className="text-dark-300 py-2"
              >
                خدمات
              </a>
              <a
                href="#about"
                onClick={() => setIsMenuOpen(false)}
                className="text-dark-300 py-2"
              >
                درباره ما
              </a>
              <a
                href="#faq"
                onClick={() => setIsMenuOpen(false)}
                className="text-dark-300 py-2"
              >
                سوالات متداول
              </a>
              {isAuthenticated && (
                <Link
                  to={user?.role === 'admin' ? '/admin' : user?.role === 'technician' ? '/technician' : '/dashboard'}
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-primary text-center"
                >
                  داشبورد
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

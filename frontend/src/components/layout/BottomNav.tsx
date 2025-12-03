import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, MessageCircle, Settings, User } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useAuthStore } from '../../stores/authStore';

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
}

const customerNav: NavItem[] = [
  { path: '/dashboard', label: 'خانه', icon: Home },
  { path: '/orders', label: 'سفارش‌ها', icon: ClipboardList },
  { path: '/messages', label: 'پیام‌ها', icon: MessageCircle },
  { path: '/settings', label: 'تنظیمات', icon: Settings },
];

const technicianNav: NavItem[] = [
  { path: '/technician', label: 'خانه', icon: Home },
  { path: '/technician/orders', label: 'سفارش‌ها', icon: ClipboardList },
  { path: '/messages', label: 'پیام‌ها', icon: MessageCircle },
  { path: '/settings', label: 'پروفایل', icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuthStore();

  const navItems = user?.role === 'technician' ? technicianNav : customerNav;

  // Hide on admin pages
  if (user?.role === 'admin' || location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-xl border-t border-dark-700/50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && item.path !== '/technician' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300',
                isActive
                  ? 'text-gold-500'
                  : 'text-dark-400 hover:text-dark-200'
              )}
            >
              <item.icon
                className={cn(
                  'w-6 h-6 transition-transform',
                  isActive && 'scale-110'
                )}
              />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-gold-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

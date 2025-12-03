import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  LogOut,
  ChevronLeft,
  Save,
  CreditCard,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BottomNav } from '../components/layout/BottomNav';
import { useAuthStore } from '../stores/authStore';
import { userAPI } from '../services/api';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, fetchUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Update profile
      await userAPI.updateProfile({
        name: formData.name,
        email: formData.email || undefined,
      });

      // Upload avatar if changed
      if (avatarFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', avatarFile);
        await userAPI.uploadAvatar(formDataUpload);
      }

      await fetchUser();
      setIsEditing(false);
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { icon: MapPin, label: 'آدرس‌های من', href: '/settings/addresses' },
    { icon: CreditCard, label: 'کارت‌های بانکی', href: '/settings/cards' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
          <Link to="/dashboard" className="p-2 -mr-2 text-dark-400 hover:text-white">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center font-semibold text-white">تنظیمات</h1>
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="p-2 text-gold-500"
            >
              {isLoading ? <div className="spinner w-5 h-5" /> : <Save className="w-5 h-5" />}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-gold-500 text-sm"
            >
              ویرایش
            </button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <GlassCard padding="lg">
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div
                onClick={isEditing ? handleAvatarClick : undefined}
                className={`w-24 h-24 rounded-full overflow-hidden bg-gradient-gold flex items-center justify-center ${
                  isEditing ? 'cursor-pointer' : ''
                }`}
              >
                {avatarPreview || user?.avatar ? (
                  <img
                    src={avatarPreview || user?.avatar}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-dark-950 font-bold">
                    {user?.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              {isEditing && (
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-gold-600 rounded-full flex items-center justify-center">
                  <Camera className="w-4 h-4 text-dark-950" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Info */}
            {isEditing ? (
              <div className="w-full space-y-4">
                <Input
                  placeholder="نام و نام خانوادگی"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  icon={<User className="w-5 h-5" />}
                />
                <Input
                  placeholder="ایمیل (اختیاری)"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  icon={<Mail className="w-5 h-5" />}
                  dir="ltr"
                />
                <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                  <Phone className="w-5 h-5 text-dark-400" />
                  <span className="text-dark-400" dir="ltr">{user?.phone}</span>
                  <span className="text-xs text-dark-500">(غیرقابل تغییر)</span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-1">{user?.name}</h2>
                <p className="text-dark-400" dir="ltr">{user?.phone}</p>
                {user?.email && (
                  <p className="text-dark-400 text-sm mt-1">{user.email}</p>
                )}
                {user?.nationalId && (
                  <p className="text-dark-500 text-sm mt-1">کد ملی: {user.nationalId}</p>
                )}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <GlassCard hoverable padding="md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-gold-500" />
                    </div>
                    <span className="text-white">{item.label}</span>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-dark-500" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full p-4 bg-red-600/10 border border-red-600/20 rounded-xl text-red-400 flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          خروج از حساب کاربری
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
